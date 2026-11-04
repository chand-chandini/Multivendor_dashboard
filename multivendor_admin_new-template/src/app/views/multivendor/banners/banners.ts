import { checkImageFile, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

/** Banners - `banners` table via /dashboard_api. */
@Component({
  selector: 'app-mv-banners',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './banners.html',
  styles: ``,
})
export class Banners implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')

  readonly rows = signal<any[]>([])
  readonly vendors = signal<any[]>([])
  readonly products = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  // Selected image file
  selectedImageFile: File | null = null
  // Selected image filename and preview
  readonly selectedImageName = signal('')
  readonly imagePreview = signal('')
  readonly linkTypes = [
    { value: '', label: 'No link' },
    { value: 'vendor', label: 'Vendor' },
    { value: 'product', label: 'Product' },
    { value: 'external', label: 'External URL' },
  ]

  readonly columns: DataTableColumn[] = [
    {
      key: 'banner_image',
      label: 'Banner',
      type: 'image',
      width: '12%',
      sortable: false,
    },
    { key: 'link_type', label: 'Link Type', width: '14%' },
    { key: 'vendor_name', label: 'Vendor', width: '18%' },
    { key: 'external_url', label: 'External URL', width: '24%' },
    { key: 'banner_order', label: 'Order', width: '10%', align: 'center' },
    {
      key: 'is_active',
      label: 'Status',
      type: 'badge',
      width: '12%',
      align: 'center',
      format: (v) => (Number(v) === 1 ? 'Active' : 'Inactive'),
    },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    { key: 'delete', icon: 'trash', label: 'Delete', permission: 'delete', className: 'text-danger' },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    banner_image: [''],
    link_type: [''],
    vendor_id: [null as number | null],
    product_id: [null as number | null],
    external_url: [''],
    banner_order: [0 as number | null],
    is_active: [1 as number | null],
  }), {
    banner_image: { type: 'image', saved: (): unknown => this.editingId() ? this.form?.controls.banner_image.value : '', file: () => this.selectedImageFile, accept: 'image/png,image/jpeg,image/jpg,image/webp' },
    link_type: { choices: () => this.linkTypes.map((item) => item.value), allowEmptyChoice: true },
    vendor_id: { when: (): boolean => this.form?.controls.link_type.value === 'vendor', choices: () => this.vendors().map((item) => item.id) },
    product_id: { when: (): boolean => this.form?.controls.link_type.value === 'product', choices: () => this.products().map((item) => item.id) },
    external_url: { type: 'url', when: (): boolean => this.form?.controls.link_type.value === 'external' },
    banner_order: { type: 'integer', min: 0 },
    is_active: { choices: () => [0, 1] },
  })

  ngOnInit(): void {
    this.load()

    this.api.getVendors().subscribe({
      next: (res) => this.vendors.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.vendors.set([]),
    })

    this.api.getProducts().subscribe({
      next: (res) => this.products.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.products.set([]),
    })
  }

  load(): void {
    this.loading.set(true)

    this.api.getBanners().subscribe({
      next: (res) => {
        this.loading.set(false)
        this.rows.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => this.loading.set(false),
    })
  }

openAdd(): void {
  this.editingId.set(null)
  this.selectedImageFile = null
  this.selectedImageName.set('')
  this.imagePreview.set('')

  resetValidation(this.form)
  this.form.reset({
    banner_image: '',
    link_type: '',
    vendor_id: null,
    product_id: null,
    external_url: '',
    banner_order: 0,
    is_active: 1,
  })

  this.modalService.open(this.formModal(), {
    centered: true,
    size: 'lg',
    backdrop: 'static',
  })
}

openEdit(row: any): void {
  this.editingId.set(row.id)
  this.selectedImageFile = null

  const imagePath = row.banner_image ?? ''
  this.selectedImageName.set(
    imagePath ? imagePath.split('/').pop()?.split('?')[0] ?? '' : ''
  )
  this.imagePreview.set(imagePath)

  resetValidation(this.form)
  this.form.reset({
    banner_image: imagePath,
    link_type: row.link_type ?? '',
    vendor_id: row.vendor_id ?? null,
    product_id: row.product_id ?? null,
    external_url: row.external_url ?? '',
    banner_order: row.banner_order ?? null,
    is_active: row.is_active ?? null,
  })

  this.modalService.open(this.formModal(), {
    centered: true,
    size: 'lg',
    backdrop: 'static',
  })
}

onImageSelected(event: Event): void {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return
    if (!checkImageFile(this.form.controls.banner_image, file, 'image/png,image/jpeg,image/jpg,image/webp')) return


  if (!file.type.startsWith('image/')) {
    this.notify.error('Invalid file', 'Please select an image file.')
    input.value = ''
    return
  }

  this.selectedImageFile = file
  this.selectedImageName.set(file.name)

  this.form.patchValue({
    banner_image: file.name,
  })

  const reader = new FileReader()

  reader.onload = () => {
    this.imagePreview.set(
      typeof reader.result === 'string' ? reader.result : ''
    )
  }

  reader.readAsDataURL(file)
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
    const values = this.form.getRawValue()

    const payload = new FormData()

    if (id) {
      payload.append('id', String(id))
    }

    payload.append('link_type', values.link_type)
    payload.append('vendor_id', values.vendor_id ? String(values.vendor_id) : '')
    payload.append('product_id', values.product_id ? String(values.product_id) : '')
    payload.append('external_url', values.external_url)
    payload.append('banner_order', String(values.banner_order))
    payload.append('is_active', String(values.is_active))

    // Send actual image file
    if (this.selectedImageFile) {
      payload.append('banner_image', this.selectedImageFile)
    }

    this.saving.set(true)

    const request = id
      ? this.api.updateBanner(payload)
      : this.api.addBanner(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)

        if (res.status === 200) {
          this.notify.success(id ? 'Banner updated' : 'Banner added')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not save banner', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not save banner', 'Please try again.')
      },
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(
      'This banner will be removed.'
    )

    if (!confirmed) return

    this.api.deleteBanner(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Banner deleted')
          this.load()
        } else {
          this.notify.error('Could not delete banner', res.message)
        }
      },
      error: () =>
        this.notify.error('Could not delete banner', 'Please try again.'),
    })
  }
}