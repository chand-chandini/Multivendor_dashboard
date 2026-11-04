import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

/**
 * Promotional Sections - promo blocks on the tenant's public site, stored in
 * tenant_website_promo_sections. Each carries an image, copy and a link the
 * public site turns into a call to action.
 */
@Component({
  selector: 'app-mv-promotional-sections',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './promotional-sections.html',
  styles: ``,
})
export class PromotionalSections implements OnInit {
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
    { key: 'image', label: 'Image', type: 'image', width: '10%', sortable: false, align: 'center' },
    { key: 'title', label: 'Title', width: '20%' },
    { key: 'subtitle', label: 'Subtitle', width: '26%' },
    { key: 'link_url', label: 'Link', width: '18%' },
    { key: 'display_order', label: 'Order', width: '8%', align: 'center' },
    { key: 'status', label: 'Status', type: 'badge', width: '10%', align: 'center', format: (v) => (Number(v) === 1 ? 'Active' : 'Inactive') },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    { key: 'delete', icon: 'trash', label: 'Delete', permission: 'delete', className: 'text-danger' },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    subtitle: [''],
    image: [''],
    link_url: [''],
    display_order: [1 as number | null],
    status: [1 as number | null],
  }), {
    title: { type: 'text' },
    subtitle: { type: 'text' },
    image: { type: 'url' },
    link_url: { type: 'url' },
    display_order: { type: 'integer', min: 0 },
    status: { choices: () => [0, 1] },
  })

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)
    this.api.getWebsitePromoSections().subscribe({
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
      title: '',
      subtitle: '',
      image: '',
      link_url: '',
      display_order: 1,
      status: 1,
    })
    this.modalService.open(this.formModal(), { centered: true, size: 'lg', backdrop: 'static' })
  }

  openEdit(row: any): void {
    this.editingId.set(row.id)
    resetValidation(this.form)
    this.form.reset({
      title: row.title ?? '',
      subtitle: row.subtitle ?? '',
      image: row.image ?? '',
      link_url: row.link_url ?? '',
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
    const request = id ? this.api.updateWebsitePromoSection(id, payload) : this.api.saveWebsitePromoSection(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success(id ? 'Promotional Section updated' : 'Promotional Section added')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not save promotional section', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not save promotional section', 'Please try again.')
      },
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(`"${row.title}" will be removed.`)
    if (!confirmed) return

    this.api.deleteWebsitePromoSection(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Promotional Section deleted')
          this.load()
        } else {
          this.notify.error('Could not delete promotional section', res.message)
        }
      },
      error: () => this.notify.error('Could not delete promotional section', 'Please try again.'),
    })
  }
}
