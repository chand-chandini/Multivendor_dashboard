import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

const SETTLEMENT_STATUS: Record<number, { label: string; className: string }> = {
  0: { label: 'Pending', className: 'badge bg-warning-subtle text-warning' },
  1: { label: 'Processing', className: 'badge bg-info-subtle text-info' },
  2: { label: 'Paid', className: 'badge bg-success-subtle text-success' },
}

/** Vendor settlements and payouts - `vendor_settlements` / `vendor_payouts`. */
@Component({
  selector: 'app-mv-settlements',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './settlements.html',
  styles: ``,
})
export class Settlements implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly settlementModal = viewChild.required<TemplateRef<any>>('settlementModal')
  readonly payoutModal = viewChild.required<TemplateRef<any>>('payoutModal')

  readonly rows = signal<any[]>([])
  readonly vendors = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly payoutTarget = signal<any | null>(null)

  readonly columns: DataTableColumn[] = [
    { key: 'settlement_number', label: 'Settlement #', width: '16%' },
    { key: 'vendor_name', label: 'Vendor', width: '16%' },
    { key: 'period_start', label: 'From', type: 'date', width: '11%' },
    { key: 'period_end', label: 'To', type: 'date', width: '11%' },
    { key: 'total_orders', label: 'Orders', width: '8%', align: 'center' },
    { key: 'gross_sales', label: 'Gross Sales', type: 'currency', width: '12%', align: 'end' },
    { key: 'commission_amount', label: 'Commission', type: 'currency', width: '12%', align: 'end' },
    { key: 'net_payable', label: 'Net Payable', type: 'currency', width: '12%', align: 'end' },
    {
      key: 'settlement_status',
      label: 'Status',
      type: 'badge',
      width: '10%',
      align: 'center',
      format: (v) => SETTLEMENT_STATUS[Number(v)]?.label ?? 'Pending',
      badgeClass: (v) => SETTLEMENT_STATUS[Number(v)]?.className ?? 'badge bg-warning-subtle text-warning',
    },
  ]

  readonly actions: DataTableAction[] = [
    {
      key: 'payout',
      icon: 'cash',
      label: 'Record payout',
      permission: 'add',
      hidden: (row) => Number(row.settlement_status) === 2,
    },
  ]

  readonly settlementForm = withValidation(this.fb.nonNullable.group({
    vendor_id: [null as number | null, [Validators.required]],
    period_start: ['', [Validators.required]],
    period_end: ['', [Validators.required]],
    total_orders: [0 as number | null],
    gross_sales: [0 as number | null],
    commission_amount: [0 as number | null],
    net_payable: [0 as number | null],
  }), {
    vendor_id: { choices: () => this.vendors().map((item) => item.id) },
    period_start: { type: 'date' },
    period_end: { type: 'date', afterField: 'period_start' },
    total_orders: { type: 'integer', min: 0 },
    gross_sales: { type: 'number', min: 0 },
    commission_amount: { type: 'number', min: 0, maxField: 'gross_sales' },
    net_payable: { type: 'number', min: 0 },
  })

  readonly payoutForm = withValidation(this.fb.nonNullable.group({
    payout_amount: [0 as number | null, [Validators.required, Validators.min(0.01)]],
    payout_method: ['bank_transfer', [Validators.required]],
    transaction_reference: [''],
    payout_proof: [''],
  }), {
    payout_amount: { type: 'number', min: 0.01 },
    payout_method: { choices: () => ['bank_transfer', 'upi', 'cash'] },
    transaction_reference: { type: 'text' },
    payout_proof: { type: 'url' },
  })

  ngOnInit(): void {
    this.load()
    this.api.getVendors().subscribe({
      next: (res) => this.vendors.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.vendors.set([]),
    })
  }

  load(): void {
    this.loading.set(true)
    this.api.getVendorSettlements().subscribe({
      next: (res) => {
        this.loading.set(false)
        this.rows.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => this.loading.set(false),
    })
  }

  openAdd(): void {
    resetValidation(this.settlementForm)
    this.settlementForm.reset({ vendor_id: null, total_orders: 0, gross_sales: 0, commission_amount: 0, net_payable: 0 })
    this.modalService.open(this.settlementModal(), { centered: true, size: 'lg', backdrop: 'static' })
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'payout') {
      this.openPayout(event.row)
    }
  }

  openPayout(row: any): void {
    this.payoutTarget.set(row)
    resetValidation(this.payoutForm)
    this.payoutForm.reset({
      payout_amount: Number(row.net_payable) || 0,
      payout_method: 'bank_transfer',
      transaction_reference: '',
      payout_proof: '',
    })
    this.modalService.open(this.payoutModal(), { centered: true, backdrop: 'static' })
  }

  submitSettlement(): void {
    if (!validateForm(this.settlementForm)) {
      this.settlementForm.markAllAsTouched()
      return
    }

    this.saving.set(true)
    this.api.createVendorSettlement(this.settlementForm.getRawValue()).subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success('Settlement created')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not create settlement', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not create settlement', 'Please try again.')
      },
    })
  }

  submitPayout(): void {
    const target = this.payoutTarget()
    if (!target || !validateForm(this.payoutForm)) {
      this.payoutForm.markAllAsTouched()
      return
    }

    this.saving.set(true)
    this.api.submitVendorPayout({ ...this.payoutForm.getRawValue(), vendor_settlement_id: target.id }).subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success('Payout recorded')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not record payout', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not record payout', 'Please try again.')
      },
    })
  }
}
