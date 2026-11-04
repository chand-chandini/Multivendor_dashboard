import { CommonModule } from '@angular/common'
import { dateInput, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import {
  DataTable,
  DataTableAction,
  DataTableActionEvent,
  DataTableColumn,
} from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-mv-coupons',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule, CommonModule],
  templateUrl: './coupons.html',
  styles: ``,
})
export class Coupons implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')
  readonly viewModal = viewChild.required<TemplateRef<any>>('viewModal')

  readonly rows = signal<any[]>([])
  readonly locations = signal<any[]>([])
  readonly shops = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)
  
  readonly selectedRow = signal<any | null>(null)

  readonly columns: DataTableColumn[] = [
    { key: 'coupon_code', label: 'Coupon Code', width: '15%' },
    { key: 'description', label: 'Description', width: '25%' },
    { key: 'discount_type', label: 'Discount Type', width: '12%' },
    { key: 'discount_value', label: 'Discount Value', width: '12%', align: 'end' },
    { key: 'min_order_value', label: 'Min Order Value', type: 'currency', width: '14%', align: 'end' },
    { key: 'location_name', label: 'Location', width: '10%' },
    { key: 'shop_name', label: 'Shop', width: '12%' },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'view', icon: 'eye', label: 'View Details', permission: 'view', className: 'text-primary' },
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    { key: 'delete', icon: 'trash', label: 'Delete', permission: 'delete', className: 'text-danger' },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    vendor_id: [null as number | null],
    category_id: [null as number | null],
    location_id: [null as number | null],
    coupon_code: [''],
    description: [''],
    discount_type: ['percentage'],
    discount_value: [0 as number | null],
    max_discount_amount: [null as number | null],
    min_order_value: [0 as number | null],
    usage_limit_per_user: [1 as number | null],
    total_usage_limit: [null as number | null],
    valid_from: [''],
    valid_upto: [''],
    is_active: [1 as number | null],
  }), {
    coupon_code: { type: 'text' },
    description: { type: 'text' },
    discount_type: { choices: () => ['percentage', 'fixed'] },
    discount_value: { type: 'number', min: 0, max: (): number => this.form?.controls.discount_type.value === 'percentage' ? 100 : Infinity },
    max_discount_amount: { type: 'number', min: 0, when: (): boolean => this.form?.controls.discount_type.value === 'percentage' },
    min_order_value: { type: 'number', min: 0 },
    location_id: { choices: () => this.locations().map((item) => item.id) },
    vendor_id: { choices: () => this.shops().map((item) => item.id) },
    usage_limit_per_user: { type: 'integer', min: 1 },
    total_usage_limit: { type: 'integer', min: 0, required: false },
    valid_from: { type: 'datetime' },
    valid_upto: { type: 'datetime', afterField: 'valid_from' },
    is_active: { choices: () => [0, 1] },
  })

  ngOnInit(): void {
    this.api.getLocations().subscribe({
      next: (res) => {
        this.locations.set(res.status === 200 ? (res.data ?? []) : [])
        this.load()
      },
      error: () => {
        this.locations.set([])
        this.load()
      },
    })

    this.api.getVendors().subscribe({
      next: (res) => {
        this.shops.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => this.shops.set([]),
    })
  }

  load(): void {
    this.loading.set(true)

    this.api.getCoupons().subscribe({
      next: (res) => {
        this.loading.set(false)

        if (res.status !== 200) {
          this.rows.set([])
          return
        }

        const coupons = res.data ?? []
        const locations = this.locations()

        const mappedRows = coupons.map((row: any) => {
          const location = locations.find(
            (item: any) => Number(item.id) === Number(row.location_id)
          )

          return {
            ...row,
            location_name: location
              ? [location.city, location.area].filter(Boolean).join(' - ')
              : '-',
          }
        })

        this.rows.set(mappedRows)
      },
      error: (err) => {
        console.log('GET COUPONS FRONTEND ERROR:', err)
        this.loading.set(false)
        this.rows.set([])
        this.notify.error('Could not load coupons', 'Please try again.')
      },
    })
  }

  openAdd(): void {
    this.editingId.set(null)
    resetValidation(this.form)
    this.form.reset({
      vendor_id: null,
      category_id: null,
      location_id: null,
      coupon_code: '',
      description: '',
      discount_type: 'percentage',
      discount_value: 0,
      max_discount_amount: null,
      min_order_value: 0,
      usage_limit_per_user: 1,
      total_usage_limit: null,
      valid_from: '',
      valid_upto: '',
      is_active: 1,
    })

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  openView(row: any): void {
    this.selectedRow.set(row)
    this.modalService.open(this.viewModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
    })
  }

  openEdit(row: any): void {
    this.editingId.set(row.id)

    resetValidation(this.form)
    this.form.reset({
      vendor_id: row.vendor_id ?? null,
      category_id: row.category_id ?? null,
      location_id: row.location_id ?? null,
      coupon_code: row.coupon_code ?? '',
      description: row.description ?? '',
      discount_type: row.discount_type ?? '',
      discount_value: (row.discount_value == null || row.discount_value === '' ? null : Number(row.discount_value)),
      max_discount_amount: row.max_discount_amount != null ? Number(row.max_discount_amount) : null,
      min_order_value: (row.min_order_value == null || row.min_order_value === '' ? null : Number(row.min_order_value)),
      usage_limit_per_user: (row.usage_limit_per_user == null || row.usage_limit_per_user === '' ? null : Number(row.usage_limit_per_user)),
      total_usage_limit: row.total_usage_limit != null ? Number(row.total_usage_limit) : null,
      valid_from: dateInput(row.valid_from, true),
      valid_upto: dateInput(row.valid_upto, true),
      is_active: (row.is_active == null || row.is_active === '' ? null : Number(row.is_active)),
    })

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'view') {
      this.openView(event.row)
    } else if (event.key === 'edit') {
      this.openEdit(event.row)
    } else if (event.key === 'delete') {
      this.confirmDelete(event.row)
    }
  }

  submit(): void {
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    const id = this.editingId()
    const payload = {
      ...this.form.getRawValue(),
      ...(id ? { id } : {}),
    }

    this.saving.set(true)

    const request = id
      ? this.api.updateCoupon(payload)
      : this.api.addCoupon(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success(id ? 'Coupon updated' : 'Coupon added')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not save coupon', res.message)
        }
      },
      error: (err) => {
        console.log('SAVE COUPON FRONTEND ERROR:', err)
        this.saving.set(false)
        this.notify.error('Could not save coupon', 'Please try again.')
      },
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(`Coupon "${row.coupon_code}" will be removed.`)
    if (!confirmed) return

    this.api.deleteCoupon(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Coupon deleted')
          this.load()
        } else {
          this.notify.error('Could not delete coupon', res.message)
        }
      },
      error: (err) => {
        console.log('DELETE COUPON FRONTEND ERROR:', err)
        this.notify.error('Could not delete coupon', 'Please try again.')
      },
    })
  }
}