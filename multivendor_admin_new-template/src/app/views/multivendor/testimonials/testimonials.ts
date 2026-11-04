import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

/**
 * Testimonials - customer quotes for the tenant's public site, stored in
 * tenant_website_testimonials. rating is a 0-5 decimal the public site
 * renders as stars.
 */
@Component({
  selector: 'app-mv-testimonials',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './testimonials.html',
  styles: ``,
})
export class Testimonials implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')

  readonly rows = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  readonly columns: DataTableColumn[] = [
    { key: 'customer_name', label: 'Customer', width: '18%' },
    { key: 'designation', label: 'Designation', width: '16%' },
    { key: 'message', label: 'Message', width: '27%' },
    { key: 'rating', label: 'Rating', width: '8%', align: 'end', format: (v) => (v === null || v === undefined || v === '' ? '-' : Number(v).toFixed(1)) },
    { key: 'display_order', label: 'Order', width: '7%', align: 'center' },
    { key: 'status', label: 'Status', type: 'badge', width: '9%', align: 'center', format: (v) => (Number(v) === 1 ? 'Active' : 'Inactive') },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    { key: 'delete', icon: 'trash', label: 'Delete', permission: 'delete', className: 'text-danger' },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    customer_name: ['', [Validators.required]],
    designation: [''],
    rating: [5 as number | null, [Validators.min(0), Validators.max(5)]],
    message: [''],
    display_order: [1 as number | null],
    status: [1 as number | null],
  }), {
    customer_name: { type: 'text' },
    designation: { type: 'text' },
    rating: { type: 'number', min: 0, max: 5 },
    message: { type: 'text' },
    display_order: { type: 'integer', min: 0 },
    status: { choices: () => [0, 1] },
  })

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)
    this.api.getWebsiteTestimonials().subscribe({
      next: (res) => {
        this.loading.set(false)
        this.rows.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => {
        this.loading.set(false)
        this.rows.set([])
      },
    })
  }

  openAdd(): void {
    this.editingId.set(null)
    resetValidation(this.form)
    this.form.reset({
      customer_name: '',
      designation: '',
      rating: 5,
      message: '',
      display_order: 1,
      status: 1,
    })
    this.modalService.open(this.formModal(), { centered: true, size: 'lg', backdrop: 'static' })
  }

  openEdit(row: any): void {
    this.editingId.set(row.id)
    resetValidation(this.form)
    this.form.reset({
      customer_name: row.customer_name ?? '',
      designation: row.designation ?? '',
      rating: (row.rating == null || row.rating === '' ? null : Number(row.rating)),
      message: row.message ?? '',
      display_order: (row.display_order == null || row.display_order === '' ? null : Number(row.display_order)),
      status: (row.status == null || row.status === '' ? null : Number(row.status)),
    })
    this.modalService.open(this.formModal(), { centered: true, size: 'lg', backdrop: 'static' })
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'edit') {
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
    const payload = this.form.getRawValue()
    this.saving.set(true)

    // The update endpoint takes the id in the URL, not the body.
    const request = id ? this.api.updateWebsiteTestimonial(id, payload) : this.api.saveWebsiteTestimonial(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success(id ? 'Testimonial updated' : 'Testimonial added')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not save testimonial', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not save testimonial', 'Please try again.')
      },
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(`"${row.customer_name}" will be removed.`)
    if (!confirmed) return

    this.api.deleteWebsiteTestimonial(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Testimonial deleted')
          this.load()
        } else {
          this.notify.error('Could not delete testimonial', res.message)
        }
      },
      error: () => this.notify.error('Could not delete testimonial', 'Please try again.'),
    })
  }
}
