import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap'

/**
 * Charges master - rows from tenant_charge_settings.
 *
 * Database fields:
 * handling_charge
 * packing_charge
 * donation_charge
 * rain_surge_charge
 * rain_surge_active
 */
@Component({
  selector: 'app-mv-charges',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule, NgbNavModule],
  templateUrl: './charges.html',
  styles: ``,
})
export class Charges implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')

  activeTab = 'charges'

  readonly charges = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)
  readonly editingSurge = signal(false)

  readonly chargesColumns: DataTableColumn[] = [
    {
      key: 'handling_charge',
      label: 'Handling Charge',
      type: 'currency',
      width: '25%',
      align: 'end',
    },
    {
      key: 'packing_charge',
      label: 'Packing Charge',
      type: 'currency',
      width: '25%',
      align: 'end',
    },
    {
      key: 'donation_charge',
      label: 'Donation Charge',
      type: 'currency',
      width: '25%',
      align: 'end',
    },
  ]

  readonly surgeColumns: DataTableColumn[] = [
    {
      key: 'rain_surge_charge',
      label: 'Rain Surge Charge',
      type: 'currency',
      width: '45%',
      align: 'start',
    },
    {
      key: 'rain_surge_active',
      label: 'Rain Surge Active',
      type: 'badge',
      width: '45%',
      align: 'start',
      format: (v) => (Number(v) === 1 ? 'Active' : 'Inactive'),
    },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    handling_charge: [0 as number | null],
    packing_charge: [0 as number | null],
    donation_charge: [0 as number | null],
    rain_surge_charge: [0 as number | null],
    rain_surge_active: [0 as number | null],
  }), {
    handling_charge: { type: 'number', min: 0, when: (): boolean => !this.editingSurge() },
    packing_charge: { type: 'number', min: 0, when: (): boolean => !this.editingSurge() },
    donation_charge: { type: 'number', min: 0, when: (): boolean => !this.editingSurge() },
    rain_surge_charge: { type: 'number', min: 0, when: (): boolean => this.editingSurge() },
    rain_surge_active: { when: (): boolean => this.editingSurge(), choices: () => [0, 1] },
  })

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)

    this.api.getCharges().subscribe({
      next: (res) => {
        this.loading.set(false)

        const data = res.status === 200 ? (res.data ?? []) : []

        this.charges.set(Array.isArray(data) ? data : [data])
      },
      error: () => {
        this.loading.set(false)
        this.charges.set([])
      },
    })
  }

  openAdd(isSurge: boolean): void {
    this.editingId.set(null)
    this.editingSurge.set(isSurge)

    resetValidation(this.form)
    this.form.reset({
      handling_charge: 0,
      packing_charge: 0,
      donation_charge: 0,
      rain_surge_charge: 0,
      rain_surge_active: 0,
    })

    this.applyValidators(isSurge)

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  openEdit(row: any, isSurge: boolean): void {
    this.editingId.set(row.id)
    this.editingSurge.set(isSurge)

    resetValidation(this.form)
    this.form.reset({
      handling_charge: (row.handling_charge == null || row.handling_charge === '' ? null : Number(row.handling_charge)),
      packing_charge: (row.packing_charge == null || row.packing_charge === '' ? null : Number(row.packing_charge)),
      donation_charge: (row.donation_charge == null || row.donation_charge === '' ? null : Number(row.donation_charge)),
      rain_surge_charge: (row.rain_surge_charge == null || row.rain_surge_charge === '' ? null : Number(row.rain_surge_charge)),
      rain_surge_active: (row.rain_surge_active == null || row.rain_surge_active === '' ? null : Number(row.rain_surge_active)),
    })

    this.applyValidators(isSurge)

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  onAction(event: DataTableActionEvent, isSurge: boolean): void {
    if (event.key === 'edit') {
      this.openEdit(event.row, isSurge)
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
      ? this.api.updateCharges(payload)
      : this.api.addCharges(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)

        if (res.status === 200) {
          this.notify.success(res.message || 'Saved successfully')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not save', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not save', 'Please try again.')
      },
    })
  }

  private applyValidators(isSurge: boolean): void {
    const feeControls = [
      this.form.controls.handling_charge,
      this.form.controls.packing_charge,
      this.form.controls.donation_charge,
    ]

    if (isSurge) {
      feeControls.forEach((control) => {
        control.setValidators([Validators.min(0)])
      })

      this.form.controls.rain_surge_charge.setValidators([
        Validators.required,
        Validators.min(0),
      ])
    } else {
      feeControls.forEach((control) => {
        control.setValidators([
          Validators.required,
          Validators.min(0),
        ])
      })

      this.form.controls.rain_surge_charge.setValidators([
        Validators.min(0),
      ])
    }

    this.form.controls.rain_surge_active.setValidators([])
  }
}