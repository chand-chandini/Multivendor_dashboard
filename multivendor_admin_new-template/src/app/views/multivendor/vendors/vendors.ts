import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormBuilder, ReactiveFormsModule, Validators, ValidatorFn } from '@angular/forms'
import {
  DataTable,
  DataTableAction,
  DataTableActionEvent,
  DataTableColumn,
} from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { API_CONFIG } from '@/app/config/api.config'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

type VendorImageField = 'shop_image' | 'shop_interior_image1' | 'shop_interior_image2' | 'shop_interior_image3'

/** Vendors master - `vendors` table via /dashboard_api. */
@Component({
  selector: 'app-mv-vendors',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule, CommonModule],
  templateUrl: './vendors.html',
  styles: ``,
})
export class Vendors implements OnInit {
  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  protected permissions = inject(PermissionService)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')
  readonly viewModal = viewChild.required<TemplateRef<any>>('viewModal')
  readonly activeCell = viewChild.required<TemplateRef<any>>('activeCell')
  readonly loginCell = viewChild.required<TemplateRef<any>>('loginCell')

  readonly rows = signal<any[]>([])
  readonly locations = signal<any[]>([])
  readonly categories = signal<any[]>([])
  readonly categoriesLoading = signal(true)
  readonly categoriesError = signal(false)
  private readonly savedStoreType = signal('')

  readonly viewingMode = signal<boolean>(false)

  readonly storeTypes = computed(() => {
    const values = this.categories()
      .map((item) => {
        const value =
          typeof item.vertical === 'string' && item.vertical.trim()
            ? item.vertical.trim()
            : typeof item.category_name === 'string'
              ? item.category_name.trim()
              : ''
        return value
      })
      .filter((value) => value.length > 0)

    if (this.savedStoreType()) {
      values.push(this.savedStoreType())
    }

    return [...new Set(values)].map((value) => ({
      value,
      label: value.replace(/[_-]+/g, ' ').replace(/\b\w/g, (letter: string) =>
        letter.toUpperCase(),
      ),
    }))
  })

  readonly subcategories = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  readonly imageNames = signal<Record<string, string>>({
    shop_image: '',
    shop_interior_image1: '',
    shop_interior_image2: '',
    shop_interior_image3: '',
  })

  readonly imagePreviews = signal<Record<string, string>>({
    shop_image: '',
    shop_interior_image1: '',
    shop_interior_image2: '',
    shop_interior_image3: '',
  })

  private selectedImages: Record<string, File | null> = {
    shop_image: null,
    shop_interior_image1: null,
    shop_interior_image2: null,
    shop_interior_image3: null,
  }

  readonly cellTemplates = computed(() => ({
    active_status: this.activeCell(),
    login_status: this.loginCell(),
  }))

  readonly columns: DataTableColumn[] = [
    { key: 'vendor_name', label: 'Vendor Name', width: '18%' },
    { key: 'vendor_mobile_number', label: 'Phone Number', width: '15%' },
    { key: 'shop_image', label: 'Shop Image', type: 'image', width: '12%' },
    { key: 'vendor_rating', label: 'Shop Rating', width: '10%', align: 'center', format: (value) => value !== null && value !== undefined ? String(value) : '-' },
    { key: 'login_status', label: 'Login Status', width: '11%', align: 'center', sortable: false },
    { key: 'active_status', label: 'Active Status', width: '11%', align: 'center', sortable: false },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'view', icon: 'eye', label: 'View', permission: 'view', className: 'text-primary' },
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    { key: 'delete', icon: 'trash', label: 'Delete', permission: 'delete', className: 'text-danger' },
  ]

  private readonly requiredText = [Validators.required, Validators.pattern(/\S/)]
  private readonly finiteNumber: ValidatorFn = (control) =>
    (typeof control.value === 'number' ||
      (typeof control.value === 'string' && control.value.trim() !== '')) &&
    Number.isFinite(Number(control.value)) ? null : { number: true }

  private readonly supportedImageFields = [
    'shop_image', 'shop_interior_image1', 'shop_interior_image2',
  ] as const

  private selection(options: () => readonly unknown[]): ValidatorFn {
    return (control) => control.value == null || control.value === '' ||
      options().some((value) => String(value) === String(control.value))
        ? null : { selection: true }
  }

  private imageValidator(field: VendorImageField, required = true): ValidatorFn {
    return (control) => {
      const file = this.selectedImages[field]
      if (file) {
        if (!this.supportedImageFields.some((key) => key === field)) {
          return { unsupportedUpload: true }
        }
        return file.size > 0 && /^image\/[a-z0-9.+-]+$/i.test(file.type)
          ? null : { image: true }
      }
      if (this.editingId() && typeof control.value === 'string' && control.value.trim()) return null
      return required ? { required: true } : null
    }
  }

  readonly form = this.fb.nonNullable.group({
    vendor_name: ['', this.requiredText],
    vendor_mobile_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    vendor_mobile_number2: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    vendor_email: ['', [Validators.required, Validators.email]],
    pwd: ['', this.requiredText],
    store_category: ['', [this.selection(() => this.storeTypes().map((item) => item.value))]],
    location_id: [null as number | null, [Validators.required, this.selection(() => this.locations().map((item) => item.id))]],
    subcategory: ['', [...this.requiredText, this.selection(() => this.subcategories().map((item) => item.category_name))]],
    filter: ['', [Validators.required, this.selection(() => ['All', 'Veg', 'Non-Veg'])]],
    vendor_unique_code: ['', this.requiredText],
    vendor_address: ['', this.requiredText],
    special_offer: ['', this.requiredText],
    opening_time: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]],
    closing_time: ['', [Validators.required, Validators.pattern(/^([01]\d|2[0-3]):[0-5]\d$/)]],
    commission_percentage: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0), Validators.max(100)]],
    kyc_status: [0 as number | null, [Validators.required, this.selection(() => [0, 1])]],
    fssai_license_number: ['', [Validators.required, Validators.pattern(/^\d{14}$/)]],
    gst_number: ['', [Validators.required, Validators.pattern(/^\d{2}[A-Z]{5}\d{4}[A-Z][1-9A-Z]Z[A-Z0-9]$/i)]],
    pan_number: ['', [Validators.required, Validators.pattern(/^[A-Z]{5}\d{4}[A-Z]$/i)]],
    shop_image: ['', [this.imageValidator('shop_image')]],
    shop_interior_image1: ['', [this.imageValidator('shop_interior_image1')]],
    shop_interior_image2: ['', [this.imageValidator('shop_interior_image2')]],
    shop_interior_image3: ['', [this.imageValidator('shop_interior_image3', false)]],
    bank_account_holder: ['', [...this.requiredText, Validators.maxLength(255), Validators.pattern(/^(?=[\s\S]*\p{L})[^\x00-\x1f\x7f]+$/u)]],
    bank_account_number: ['', [Validators.required, Validators.pattern(/^\d{9,18}$/)]],
    bank_ifsc_code: ['', [Validators.required, Validators.pattern(/^[A-Z]{4}0[A-Z0-9]{6}$/i)]],
    bank_name: ['', [...this.requiredText, Validators.maxLength(150), Validators.pattern(/^[^\x00-\x1f\x7f]+$/)]],
    upi_id: ['', [Validators.required, Validators.pattern(/^[A-Z0-9][A-Z0-9._-]*@[A-Z0-9][A-Z0-9.-]*$/i)]],
    bank_details_image: [''],
    admin_service: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0), Validators.max(100)]],
    packing_charges: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0)]],
    max_free_delivery_cost: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0)]],
    minimum_order_amount: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0)]],
    minimum_km: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0)]],
    minimum_delivery_charge: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0)]],
    per_km_charges: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0)]],
    maximum_delivery_km: [0 as number | null, [Validators.required, this.finiteNumber, Validators.min(0)]],
    latitude: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/), Validators.min(-90), Validators.max(90)]],
    longitude: ['', [Validators.required, Validators.pattern(/^-?\d+(\.\d+)?$/), Validators.min(-180), Validators.max(180)]],
  })

  ngOnInit(): void {
    this.load()

    this.api.getLocations().subscribe({
      next: (res) => {
        this.locations.set(res.status === 200 ? (res.data ?? []) : [])
        this.form.controls.location_id.updateValueAndValidity()
      },
      error: () => {
        this.locations.set([])
        this.form.controls.location_id.updateValueAndValidity()
      },
    })

    this.categoriesLoading.set(true)
    this.categoriesError.set(false)
    this.api.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.status === 200 ? (res.data ?? []) : [])
        this.categoriesError.set(res.status !== 200)
        this.categoriesLoading.set(false)
        this.form.controls.store_category.updateValueAndValidity()
      },
      error: () => {
        this.categories.set([])
        this.categoriesError.set(true)
        this.categoriesLoading.set(false)
        this.form.controls.store_category.updateValueAndValidity()
      },
    })

    this.api.getSubCategories().subscribe({
      next: (res) => {
        this.subcategories.set(res.status === 200 ? (res.data ?? []) : [])
        this.form.controls.subcategory.updateValueAndValidity()
      },
      error: () => {
        this.subcategories.set([])
        this.form.controls.subcategory.updateValueAndValidity()
      },
    })
  }

  load(): void {
    this.loading.set(true)
    this.api.getVendors().subscribe({
      next: (res) => {
        this.loading.set(false)
        this.rows.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => this.loading.set(false),
    })
  }

  private resetSelectedImages(): void {
    Object.keys(this.selectedImages).forEach((key) => {
      this.selectedImages[key] = null
    })
  }

  private resetImageDisplay(): void {
    this.imageNames.set({ shop_image: '', shop_interior_image1: '', shop_interior_image2: '', shop_interior_image3: '' })
    this.imagePreviews.set({ shop_image: '', shop_interior_image1: '', shop_interior_image2: '', shop_interior_image3: '' })
  }

  private getImageName(value: string): string {
    if (!value) return ''
    const cleanValue = value.split('?')[0]
    return decodeURIComponent(cleanValue.split('/').pop() ?? '')
  }

  private getImagePreview(value: string): string {
    if (!value || typeof value !== 'string') return ''
    const image = value.trim()
    if (/^(https?:\/\/|data:image\/)/i.test(image)) return image
    const backendOrigin = new URL(API_CONFIG.baseUrl).origin
    const cleanPath = image.replace(/^\/+/, '')
    return `${backendOrigin}/${cleanPath}`
  }

  private setImageDisplay(key: 'shop_image' | 'shop_interior_image1' | 'shop_interior_image2' | 'shop_interior_image3', name: string, preview: string): void {
    this.imageNames.update((current) => ({ ...current, [key]: name }))
    this.imagePreviews.update((current) => ({ ...current, [key]: preview }))
  }

  openAdd(): void {
    this.editingId.set(null)
    this.viewingMode.set(false)
    this.savedStoreType.set('')
    this.resetSelectedImages()
    this.resetImageDisplay()

    this.form.reset({
      vendor_name: '', vendor_mobile_number: '', vendor_mobile_number2: '', vendor_email: '', pwd: '',
      store_category: '', location_id: null, subcategory: '', filter: '', vendor_unique_code: '',
      vendor_address: '', special_offer: '', opening_time: '', closing_time: '',
      commission_percentage: 0, kyc_status: 0, fssai_license_number: '', gst_number: '', pan_number: '',
      shop_image: '', shop_interior_image1: '', shop_interior_image2: '', shop_interior_image3: '',
      bank_account_holder: '', bank_account_number: '', bank_ifsc_code: '', bank_name: '', upi_id: '',
      bank_details_image: '', admin_service: 0, packing_charges: 0, max_free_delivery_cost: 0,
      minimum_order_amount: 0, minimum_km: 0, minimum_delivery_charge: 0, per_km_charges: 0,
      maximum_delivery_km: 0, latitude: '', longitude: '',
    })

    this.form.enable()
    this.form.controls.pwd.setValidators(this.requiredText)
    this.form.controls.pwd.updateValueAndValidity()

    this.modalService.open(this.formModal(), { centered: true, size: 'lg', backdrop: 'static', scrollable: true })
  }

  openView(row: any): void {
    this.editingId.set(row.id)
    this.viewingMode.set(true)
    this.savedStoreType.set(row.store_category ?? '')
    
    const imageFields = ['shop_image', 'shop_interior_image1', 'shop_interior_image2', 'shop_interior_image3'] as const
    const names: Record<string, string> = {}
    const previews: Record<string, string> = {}
    imageFields.forEach((key) => {
      const value = row[key] ?? ''
      names[key] = this.getImageName(value)
      previews[key] = this.getImagePreview(value)
    })
    this.imageNames.set(names)
    this.imagePreviews.set(previews)

    this.form.reset({
      vendor_name: row.vendor_name ?? '', vendor_mobile_number: row.vendor_mobile_number ?? '',
      vendor_mobile_number2: row.vendor_mobile_number2 ?? '', vendor_email: row.vendor_email ?? '',
      pwd: '', store_category: row.store_category ?? '', location_id: row.location_id ?? null,
      subcategory: row.subcategory ?? '', filter: row.filter ?? '', vendor_unique_code: row.vendor_unique_code ?? '',
      vendor_address: row.vendor_address ?? '', special_offer: row.special_offer ?? '',
      opening_time: this.formatTime(row.opening_time), closing_time: this.formatTime(row.closing_time),
      commission_percentage: row.commission_percentage ?? null, kyc_status: row.kyc_status ?? null,
      fssai_license_number: row.fssai_license_number ?? '', gst_number: row.gst_number ?? '',
      pan_number: row.pan_number ?? '', shop_image: row.shop_image ?? '',
      shop_interior_image1: row.shop_interior_image1 ?? '', shop_interior_image2: row.shop_interior_image2 ?? '',
      shop_interior_image3: row.shop_interior_image3 ?? '', bank_account_holder: row.bank_account_holder ?? '',
      bank_account_number: row.bank_account_number ?? '', bank_ifsc_code: row.bank_ifsc_code ?? '',
      bank_name: row.bank_name ?? '', upi_id: row.upi_id ?? '', bank_details_image: row.bank_details_image ?? '',
      admin_service: row.admin_service ?? null, packing_charges: row.packing_charges ?? null,
      max_free_delivery_cost: row.max_free_delivery_cost ?? null, minimum_order_amount: row.minimum_order_amount ?? null,
      minimum_km: row.minimum_km ?? null, minimum_delivery_charge: row.minimum_delivery_charge ?? null,
      per_km_charges: row.per_km_charges ?? null, maximum_delivery_km: row.maximum_delivery_km ?? null,
      latitude: row.latitude ?? '', longitude: row.longitude ?? '',
    })

    this.form.disable()

    this.modalService.open(this.viewModal(), { centered: true, size: 'lg', backdrop: 'static', scrollable: true })
  }

  openEdit(row: any): void {
    this.editingId.set(row.id)
    this.viewingMode.set(false)
    this.savedStoreType.set(row.store_category ?? '')
    this.resetSelectedImages()

    const imageFields = ['shop_image', 'shop_interior_image1', 'shop_interior_image2', 'shop_interior_image3'] as const
    const names: Record<string, string> = {}
    const previews: Record<string, string> = {}
    imageFields.forEach((key) => {
      const value = row[key] ?? ''
      names[key] = this.getImageName(value)
      previews[key] = this.getImagePreview(value)
    })
    this.imageNames.set(names)
    this.imagePreviews.set(previews)

    this.form.reset({
      vendor_name: row.vendor_name ?? '', vendor_mobile_number: row.vendor_mobile_number ?? '',
      vendor_mobile_number2: row.vendor_mobile_number2 ?? '', vendor_email: row.vendor_email ?? '',
      pwd: '', store_category: row.store_category ?? '', location_id: row.location_id ?? null,
      subcategory: row.subcategory ?? '', filter: row.filter ?? '', vendor_unique_code: row.vendor_unique_code ?? '',
      vendor_address: row.vendor_address ?? '', special_offer: row.special_offer ?? '',
      opening_time: this.formatTime(row.opening_time), closing_time: this.formatTime(row.closing_time),
      commission_percentage: row.commission_percentage ?? null, kyc_status: row.kyc_status ?? null,
      fssai_license_number: row.fssai_license_number ?? '', gst_number: row.gst_number ?? '',
      pan_number: row.pan_number ?? '', shop_image: row.shop_image ?? '',
      shop_interior_image1: row.shop_interior_image1 ?? '', shop_interior_image2: row.shop_interior_image2 ?? '',
      shop_interior_image3: row.shop_interior_image3 ?? '', bank_account_holder: row.bank_account_holder ?? '',
      bank_account_number: row.bank_account_number ?? '', bank_ifsc_code: row.bank_ifsc_code ?? '',
      bank_name: row.bank_name ?? '', upi_id: row.upi_id ?? '', bank_details_image: row.bank_details_image ?? '',
      admin_service: row.admin_service ?? null, packing_charges: row.packing_charges ?? null,
      max_free_delivery_cost: row.max_free_delivery_cost ?? null, minimum_order_amount: row.minimum_order_amount ?? null,
      minimum_km: row.minimum_km ?? null, minimum_delivery_charge: row.minimum_delivery_charge ?? null,
      per_km_charges: row.per_km_charges ?? null, maximum_delivery_km: row.maximum_delivery_km ?? null,
      latitude: row.latitude ?? '', longitude: row.longitude ?? '',
    })

    this.form.enable()
    this.form.controls.pwd.clearValidators()
    this.form.controls.pwd.updateValueAndValidity()

    this.modalService.open(this.formModal(), { centered: true, size: 'lg', backdrop: 'static', scrollable: true })
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

  private selectImage(controlName: VendorImageField, file: File): boolean {
    this.selectedImages[controlName] = file
    const control = this.form.controls[controlName]
    control.setValue(file.name)
    control.markAsTouched()
    this.setImageDisplay(controlName, file.name, '')
    return control.valid
  }

  onShopImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (!this.selectImage('shop_image', file)) return
    const reader = new FileReader()
    reader.onload = () => {
      this.setImageDisplay('shop_image', file.name, typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }

  onInteriorImageSelected(event: Event, controlName: 'shop_interior_image1' | 'shop_interior_image2' | 'shop_interior_image3'): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]
    if (!file) return
    if (!this.selectImage(controlName, file)) return
    const reader = new FileReader()
    reader.onload = () => {
      this.setImageDisplay(controlName, file.name, typeof reader.result === 'string' ? reader.result : '')
    }
    reader.readAsDataURL(file)
  }

  private formatTime(value: any): string {
    if (!value) return ''
    if (typeof value === 'string' && value.length >= 5) return value.substring(0, 5)
    return ''
  }

  fieldError(field: keyof typeof this.form.controls, label: string): string {
    const control = this.form.controls[field]
    if (!control.touched || !control.errors) return ''
    if (control.hasError('format')) return control.getError('format')
    if (control.hasError('required')) return `${label} is required.`
    if (control.hasError('selection')) return `Select a valid ${label.toLowerCase()}.`
    if (control.hasError('image')) return `Choose a non-empty image file for ${label.toLowerCase()}.`
    if (control.hasError('unsupportedUpload')) return 'New uploads for Interior Image 3 are unavailable.'
    if (control.hasError('email')) return 'Enter a valid email address.'
    if (field === 'fssai_license_number') return 'Enter a 14-digit FSSAI license number.'
    if (field === 'gst_number') return 'Enter a valid 15-character GST number.'
    if (control.hasError('maxlength')) return `${label} must not exceed ${control.getError('maxlength').requiredLength} characters.`
    if (field === 'bank_account_holder') return 'Enter the account holder name using letters and at most 255 characters.'
    if (field === 'bank_name') return 'Enter a bank name of at most 150 characters without control characters.'
    if (field === 'pan_number') return 'Enter a valid PAN number (for example, ABCDE1234F).'
    if (field === 'bank_account_number') return 'Enter an account number containing 9 to 18 digits.'
    if (field === 'bank_ifsc_code') return 'Enter a valid 11-character IFSC code (for example, SBIN0001234).'
    if (field === 'upi_id') return 'Enter a valid UPI ID (for example, shop@bank).'
    if (field === 'vendor_mobile_number2') return 'Enter a valid 10-digit alternative contact number.'
    if (field === 'opening_time' || field === 'closing_time') return `Enter a valid ${label.toLowerCase()}.`
    if (field === 'latitude') return 'Enter a valid latitude between -90 and 90.'
    if (field === 'longitude') return 'Enter a valid longitude between -180 and 180.'
    if (control.hasError('max')) return `${label} must be between 0 and 100.`
    if (control.hasError('min') || control.hasError('number')) return `${label} must be a non-negative number.`
    return `${label} must not be blank.`
  }

  normalizeIdentityDetails(): void {
    for (const field of ['pan_number', 'bank_ifsc_code', 'bank_account_number', 'bank_account_holder', 'bank_name'] as const) {
      const control = this.form.get(field)
      if (!control || typeof control.value !== 'string') continue
      let value = control.value.trim()
      if (field === 'pan_number' || field === 'bank_ifsc_code') value = value.toUpperCase()
      if (value !== control.value) control.setValue(value)
    }
  }

  submit(): void {
    if (this.viewingMode()) return;
    this.normalizeIdentityDetails()
    if (this.saving()) return
    Object.values(this.form.controls).forEach((control) => control.updateValueAndValidity())
    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const id = this.editingId()
    const raw = this.form.getRawValue()
    const payload = new FormData()

    Object.entries(raw).forEach(([key, value]) => {
      if (key === 'shop_image' || key === 'shop_interior_image1' || key === 'shop_interior_image2' || key === 'shop_interior_image3') return
      if (key === 'pwd' && id) return
      payload.append(key, value == null ? '' : String(value))
    })

    if (id) payload.append('id', String(id))

    this.supportedImageFields.forEach((key) => {
      const file = this.selectedImages[key]
      if (file) payload.append(key, file)
    })

    this.saving.set(true)
    const request = id ? this.api.updateVendor(payload) : this.api.addVendor(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success(id ? 'Vendor updated' : 'Vendor added')
          this.modalService.dismissAll()
          this.load()
        } else {
          for (const [field, message] of Object.entries((res as any).errors ?? {})) {
            const control = this.form.get(field)
            if (control && typeof message === 'string') {
              control.setErrors({ format: message })
              control.markAsTouched()
            }
          }
          this.notify.error('Could not save vendor', res.message)
        }
      },
      error: (error) => {
        this.saving.set(false)
        console.error('Vendor save error:', error)
        this.notify.error('Could not save vendor', 'Please try again.')
      },
    })
  }

  toggleActive(row: any, checked: boolean): void {
    const value = checked ? 1 : 0
    this.api.updateVendorActiveStatus({ id: row.id, value }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          row.active_status = value
          this.notify.success('Vendor active status updated')
        } else {
          this.notify.error('Could not update status', res.message)
        }
      },
      error: () => this.notify.error('Could not update status', 'Please try again.'),
    })
  }

  toggleLogin(row: any, checked: boolean): void {
    const value = checked ? 1 : 0
    this.api.updateVendorLoginStatus({ id: row.id, value }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          row.login_status = value
          this.notify.success('Vendor login status updated')
        } else {
          this.notify.error('Could not update status', res.message)
        }
      },
      error: () => this.notify.error('Could not update status', 'Please try again.'),
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(`"${row.vendor_name}" will be removed.`)
    if (!confirmed) return

    this.api.deleteVendor(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Vendor deleted')
          this.load()
        } else {
          this.notify.error('Could not delete vendor', res.message)
        }
      },
      error: () => this.notify.error('Could not delete vendor', 'Please try again.'),
    })
  }

  // ADDED: Download Function
  downloadVendorDetails(): void {
    this.notify.success('Generating Vendor Profile...');
    setTimeout(() => {
      const form = this.form.getRawValue();
      const content = `
=========================================
        VENDOR PROFILE
=========================================
Name         : ${form.vendor_name || '-'}
Mobile       : ${form.vendor_mobile_number || '-'}
Alt Mobile   : ${form.vendor_mobile_number2 || '-'}
Email        : ${form.vendor_email || '-'}
Vendor Code  : ${form.vendor_unique_code || '-'}
Category     : ${form.store_category || '-'}
Subcategory  : ${form.subcategory || '-'}
-----------------------------------------
SHOP DETAILS
-----------------------------------------
Address      : ${form.vendor_address || '-'}
Offer        : ${form.special_offer || '-'}
Timing       : ${form.opening_time || '-'} to ${form.closing_time || '-'}
Commission   : ${form.commission_percentage || 0}%
KYC Status   : ${form.kyc_status === 1 ? 'Verified' : 'Pending'}
Location ID  : ${form.location_id || '-'}
Coordinates  : ${form.latitude || '-'}, ${form.longitude || '-'}
-----------------------------------------
COMPLIANCE
-----------------------------------------
FSSAI        : ${form.fssai_license_number || '-'}
GST          : ${form.gst_number || '-'}
PAN          : ${form.pan_number || '-'}
-----------------------------------------
BANK DETAILS
-----------------------------------------
Holder Name  : ${form.bank_account_holder || '-'}
Account No   : ${form.bank_account_number || '-'}
IFSC Code    : ${form.bank_ifsc_code || '-'}
Bank Name    : ${form.bank_name || '-'}
UPI ID       : ${form.upi_id || '-'}
=========================================
      `;
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Vendor_${form.vendor_name?.replace(/\s+/g, '_') || 'Profile'}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 500);
  }
}