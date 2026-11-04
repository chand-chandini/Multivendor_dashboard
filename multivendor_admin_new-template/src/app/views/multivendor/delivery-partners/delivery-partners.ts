import { checkImageFile, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import {
  DataTable,
  DataTableAction,
  DataTableActionEvent,
  DataTableColumn,
} from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { API_CONFIG } from '@/app/config/api.config'

type ImageField =
  | 'aadhar_image'
  | 'pan_image'
  | 'bank_details_image'
  | 'driving_license_image'

type PartnerImages = Record<ImageField, string>

/** Delivery partners - delivery_partners table via /dashboard_api. */
@Component({
  selector: 'app-mv-delivery-partners',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './delivery-partners.html',
  styles: ``,
})
export class DeliveryPartners implements OnInit {
  readonly fieldError = fieldError

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
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  // State for View Mode
  readonly selectedRow = signal<any | null>(null)

  readonly vehicleTypes = ['bike', 'bicycle', 'van', 'auto', 'car']

  // Existing image URLs displayed while editing.
  readonly savedImages = signal<PartnerImages>({
    aadhar_image: '',
    pan_image: '',
    bank_details_image: '',
    driving_license_image: '',
  })

  // Existing image filenames displayed inside the filename fields.
  readonly savedImageNames = signal<PartnerImages>({
    aadhar_image: '',
    pan_image: '',
    bank_details_image: '',
    driving_license_image: '',
  })

  // Temporary preview URLs for newly selected image files.
  readonly selectedImagePreviews = signal<PartnerImages>({
    aadhar_image: '',
    pan_image: '',
    bank_details_image: '',
    driving_license_image: '',
  })

  // Actual filenames of newly selected files.
  readonly selectedImageNames = signal<PartnerImages>({
    aadhar_image: '',
    pan_image: '',
    bank_details_image: '',
    driving_license_image: '',
  })

  readonly cellTemplates = computed(() => ({
    active_status: this.activeCell(),
    login_status: this.loginCell(),
  }))

  readonly columns: DataTableColumn[] = [
    { key: 'name', label: 'Name', width: '12%' },
    { key: 'mobile_number', label: 'Phone Number', width: '10%' },
    { key: 'address', label: 'Address', width: '15%' },
    { key: 'location_name', label: 'Location', width: '10%' },
    {
      key: 'cod_limit',
      label: 'COD Limit',
      type: 'currency',
      width: '9%',
      align: 'end',
    },
    { key: 'aadhar_display', label: 'Aadhar Number', width: '11%' },
    {
      key: 'aadhar_image',
      label: 'Aadhar Image',
      type: 'image',
      width: '8%',
      sortable: false,
      align: 'center',
    },
    { key: 'pan_number', label: 'Pancard Number', width: '9%' },
    {
      key: 'pan_image',
      label: 'Pancard Image',
      type: 'image',
      width: '8%',
      sortable: false,
      align: 'center',
    },
    { key: 'bank_account_number', label: 'Bank Details', width: '10%' },
    {
      key: 'bank_details_image',
      label: 'Bank Image',
      type: 'image',
      width: '8%',
      sortable: false,
      align: 'center',
    },
    {
      key: 'driving_license_number',
      label: 'Driving License',
      width: '10%',
    },
    {
      key: 'driving_license_image',
      label: 'Driving License Image',
      type: 'image',
      width: '8%',
      sortable: false,
      align: 'center',
    },
    {
      key: 'login_status',
      label: 'Login Status',
      width: '8%',
      align: 'center',
      sortable: false,
    },
    {
      key: 'active_status',
      label: 'Active Status',
      width: '8%',
      align: 'center',
      sortable: false,
    },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'view', icon: 'eye', label: 'View', permission: 'view', className: 'text-primary' },
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    {
      key: 'delete',
      icon: 'trash',
      label: 'Delete',
      permission: 'delete',
      className: 'text-danger',
    },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    mobile_number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    pwd: [''],
    address: [''],
    location_id: [null as number | null],
    cod_limit: [0 as number | null],
    aadhar_number: [''],
    aadhar_image: [null as File | null],
    driving_license_number: [''],
    driving_license_image: [null as File | null],
    pan_number: [''],
    pan_image: [null as File | null],
    bank_account_number: [''],
    bank_ifsc_code: [''],
    bank_details_image: [null as File | null],
  }), {
    name: { pattern: /^(?=[\s\S]{1,255}$)(?=[\s\S]*\p{L})[^\x00-\x1f\x7f]+$/u, formatMessage: 'Enter a name of at most 255 characters.' },
    address: { type: 'text' },
    driving_license_number: { pattern: /^(?:[A-Z]{2}[ -]?\d{1,3}[ /-]?(?:19|20)\d{2}[ /-]?\d{1,7}|(?=.{5,50}$)(?=(?:\D*\d){4})[A-Z0-9]+(?:[ /-][A-Z0-9]+)+)$/i, formatMessage: 'Enter a standard Indian driving licence number or its separated legacy format.' },
    mobile_number: { type: 'phone' },
    pwd: { when: (): boolean => !this.editingId() },
    location_id: { choices: () => this.locations().map((item) => item.id) },
    cod_limit: { type: 'number', min: 0 },
    aadhar_number: { pattern: /^[2-9]\d{11}$/, formatMessage: 'Enter 12 Aadhaar digits beginning with 2 to 9; spaces are allowed.' },
    pan_number: { pattern: /^[A-Z]{5}\d{4}[A-Z]$/i, formatMessage: 'Enter a valid PAN number (for example, ABCDE1234F).' },
    bank_account_number: { pattern: /^\d{9,18}$/, formatMessage: 'Enter an account number containing 9 to 18 digits.' },
    bank_ifsc_code: { pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/i, formatMessage: 'Enter a valid 11-character IFSC code.' },
    aadhar_image: { type: 'image', saved: (): unknown => this.editingId() ? this.savedImages().aadhar_image : '', accept: 'image/png,image/jpeg,image/jpg,image/webp', maxBytes: 8 * 1024 * 1024 },
    pan_image: { type: 'image', saved: (): unknown => this.editingId() ? this.savedImages().pan_image : '', accept: 'image/png,image/jpeg,image/jpg,image/webp', maxBytes: 8 * 1024 * 1024 },
    driving_license_image: { type: 'image', saved: (): unknown => this.editingId() ? this.savedImages().driving_license_image : '', accept: 'image/png,image/jpeg,image/jpg,image/webp', maxBytes: 8 * 1024 * 1024 },
    bank_details_image: { type: 'image', saved: (): unknown => this.editingId() ? this.savedImages().bank_details_image : '', accept: 'image/png,image/jpeg,image/jpg,image/webp', maxBytes: 8 * 1024 * 1024 },
  })

  ngOnInit(): void {
    this.load()

    this.api.getLocations().subscribe({
      next: (res) =>
        this.locations.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.locations.set([]),
    })
  }

  private emptyImages(): PartnerImages {
    return {
      aadhar_image: '',
      pan_image: '',
      bank_details_image: '',
      driving_license_image: '',
    }
  }

  private getImageUrl(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') {
      return ''
    }

    const imageValue = value.trim()

    if (!imageValue) {
      return ''
    }

    // Preserve complete HTTP/HTTPS URLs and Base64 images.
    if (/^(https?:\/\/|data:image\/)/i.test(imageValue)) {
      return imageValue
    }

    const backendOrigin = new URL(API_CONFIG.baseUrl).origin
    const cleanPath = imageValue.replace(/^\/+/, '')

    // Preserve paths that already contain an upload folder.
    if (/^(upload_files|uploads)\//i.test(cleanPath)) {
      return `${backendOrigin}/${cleanPath}`
    }

    // Treat a bare filename as an image under uploads.
    return `${backendOrigin}/uploads/${cleanPath}`
  }

  private getImageName(value: string | null | undefined): string {
    if (!value || typeof value !== 'string') {
      return ''
    }

    const cleanValue = value.trim()

    if (!cleanValue) {
      return ''
    }

    try {
      const pathname = /^https?:\/\//i.test(cleanValue)
        ? new URL(cleanValue).pathname
        : cleanValue.split(/[?#]/)[0]

      return decodeURIComponent(
        pathname.split('/').filter(Boolean).pop() ?? '',
      )
    } catch {
      return cleanValue.split('/').pop()?.split(/[?#]/)[0] ?? ''
    }
  }

  load(): void {
    this.loading.set(true)

    this.api.getDeliveryPartners().subscribe({
      next: (res) => {
        this.loading.set(false)

        if (res.status === 200) {
          const data = (res.data ?? []).map((row: any) => ({
            ...row,
            aadhar_display: row.aadhar_number ? '********' + String(row.aadhar_number).replace(/ /g, '').slice(-4) : '-',
            aadhar_image: this.getImageUrl(row.aadhar_image),
            pan_image: this.getImageUrl(row.pan_image),
            bank_details_image: this.getImageUrl(row.bank_details_image),
            driving_license_image: this.getImageUrl(
              row.driving_license_image,
            ),
          }))

          this.rows.set(data)
        } else {
          this.rows.set([])
        }
      },
      error: () => {
        this.loading.set(false)
        this.rows.set([])
      },
    })
  }

  private clearSelectedImagePreviews(): void {
    const previews = this.selectedImagePreviews()

    Object.values(previews).forEach((url) => {
      if (url) {
        URL.revokeObjectURL(url)
      }
    })

    this.selectedImagePreviews.set(this.emptyImages())
    this.selectedImageNames.set(this.emptyImages())
  }

  openAdd(): void {
    this.clearSelectedImagePreviews()
    this.editingId.set(null)
    this.savedImages.set(this.emptyImages())
    this.savedImageNames.set(this.emptyImages())

    resetValidation(this.form)
    this.form.reset({
      name: '',
      mobile_number: '',
      pwd: '',
      address: '',
      location_id: null,
      cod_limit: 0,
      aadhar_number: '',
      aadhar_image: null,
      driving_license_number: '',
      driving_license_image: null,
      pan_number: '',
      pan_image: null,
      bank_account_number: '',
      bank_ifsc_code: '',
      bank_details_image: null,
    })

    this.form.controls.pwd.setValidators([Validators.required])
    this.form.controls.pwd.updateValueAndValidity()

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
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
    this.clearSelectedImagePreviews()
    this.editingId.set(row.id)

    const savedImages: PartnerImages = {
      aadhar_image: this.getImageUrl(row.aadhar_image),
      pan_image: this.getImageUrl(row.pan_image),
      bank_details_image: this.getImageUrl(row.bank_details_image),
      driving_license_image: this.getImageUrl(row.driving_license_image),
    }

    this.savedImages.set(savedImages)

    this.savedImageNames.set({
      aadhar_image: this.getImageName(row.aadhar_image),
      pan_image: this.getImageName(row.pan_image),
      bank_details_image: this.getImageName(row.bank_details_image),
      driving_license_image: this.getImageName(row.driving_license_image),
    })

    resetValidation(this.form)
    this.form.reset({
      name: row.name ?? '',
      mobile_number: row.mobile_number ?? '',
      pwd: '',
      address: row.address ?? '',
      location_id: row.location_id ?? null,
      cod_limit: row.cod_limit ?? null,
      aadhar_number: row.aadhar_number ?? '',
      aadhar_image: null,
      driving_license_number: row.driving_license_number ?? '',
      driving_license_image: null,
      pan_number: row.pan_number ?? '',
      pan_image: null,
      bank_account_number: row.bank_account_number ?? '',
      bank_ifsc_code: row.bank_ifsc_code ?? '',
      bank_details_image: null,
    })

    this.form.controls.pwd.clearValidators()
    this.form.controls.pwd.updateValueAndValidity()

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
      scrollable: true,
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

  // ADDED: Download Partner Details function
  downloadPartnerDetails(row: any): void {
    this.notify.success(`Generating profile for ${row.name}...`)
    
    setTimeout(() => {
      const content = `
=========================================
        DELIVERY PARTNER PROFILE
=========================================
Name         : ${row.name || '-'}
Mobile       : ${row.mobile_number || '-'}
Location     : ${row.location_name || '-'}
Address      : ${row.address || '-'}
COD Limit    : ₹${row.cod_limit || 0}
-----------------------------------------
IDENTITY DETAILS
-----------------------------------------
Aadhar No    : ${row.aadhar_number || '-'}
PAN No       : ${row.pan_number || '-'}
License No   : ${row.driving_license_number || '-'}
-----------------------------------------
BANK DETAILS
-----------------------------------------
Account No   : ${row.bank_account_number || '-'}
IFSC Code    : ${row.bank_ifsc_code || '-'}
=========================================
      `;
      
      const blob = new Blob([content], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Partner_${row.name?.replace(/\s+/g, '_') || row.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 500);
  }

  onImageSelected(event: Event, field: ImageField): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      return
    }
    if (!checkImageFile(this.form.controls[field], file, 'image/png,image/jpeg,image/jpg,image/webp', 8 * 1024 * 1024)) return


    // Only accept image files.
    if (!file.type.startsWith('image/')) {
      this.notify.error('Invalid file', 'Please select an image file.')
      input.value = ''
      return
    }

    const previewUrl = URL.createObjectURL(file)
    const previousUrl = this.selectedImagePreviews()[field]

    if (previousUrl) {
      URL.revokeObjectURL(previousUrl)
    }

    this.selectedImagePreviews.update((images) => ({
      ...images,
      [field]: previewUrl,
    }))

    this.selectedImageNames.update((names) => ({
      ...names,
      [field]: file.name,
    }))

    this.form.controls[field].setValue(file)
    this.form.controls[field].markAsDirty()
    this.form.controls[field].updateValueAndValidity()
  }

  normalizeIdentityDetails(): void {
    for (const field of ['pan_number', 'bank_ifsc_code', 'bank_account_number', 'aadhar_number', 'driving_license_number', 'name', 'mobile_number', 'address'] as const) {
      const control = this.form.get(field)
      if (!control || typeof control.value !== 'string') continue
      let value = control.value.trim()
      if (field === 'pan_number' || field === 'bank_ifsc_code' || field === 'driving_license_number') value = value.toUpperCase()
      if (field === 'aadhar_number') value = value.replace(/ /g, '')
      if (field === 'driving_license_number') value = value.replace(/ *([/-]) */g, '$1').replace(/ +/g, ' ')
      if (value !== control.value) control.setValue(value)
    }
  }

  submit(): void {
    this.normalizeIdentityDetails()
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    const id = this.editingId()
    const values = this.form.getRawValue()
    const payload = new FormData()

    payload.append('name', values.name)
    payload.append('mobile_number', values.mobile_number)
    payload.append('address', values.address ?? '')
    payload.append(
      'location_id',
      values.location_id !== null ? String(values.location_id) : '',
    )
    payload.append('cod_limit', String(values.cod_limit ?? 0))
    payload.append('aadhar_number', values.aadhar_number ?? '')
    payload.append(
      'driving_license_number',
      values.driving_license_number ?? '',
    )
    payload.append('pan_number', values.pan_number ?? '')
    payload.append('bank_account_number', values.bank_account_number ?? '')
    payload.append('bank_ifsc_code', values.bank_ifsc_code ?? '')

    if (!id && values.pwd) {
      payload.append('pwd', values.pwd)
    }

    if (values.aadhar_image instanceof File) {
      payload.append('aadhar_image', values.aadhar_image)
    }

    if (values.driving_license_image instanceof File) {
      payload.append('driving_license_image', values.driving_license_image)
    }

    if (values.pan_image instanceof File) {
      payload.append('pan_image', values.pan_image)
    }

    if (values.bank_details_image instanceof File) {
      payload.append('bank_details_image', values.bank_details_image)
    }

    if (id) {
      payload.append('id', String(id))
    }

    this.saving.set(true)

    const request = id
      ? this.api.updateDeliveryPartner(payload)
      : this.api.addDeliveryPartner(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)

        if (res.status === 200) {
          this.notify.success(
            id ? 'Delivery partner updated' : 'Delivery partner added',
          )

          this.modalService.dismissAll()
          this.clearSelectedImagePreviews()
          this.load()
        } else {
          for (const [field, message] of Object.entries((res as any).errors ?? {})) {
            const control = this.form.get(field)
            if (control && typeof message === 'string') {
              control.setErrors({ format: message })
              control.markAsTouched()
            }
          }
          this.notify.error('Could not save delivery partner', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error(
          'Could not save delivery partner',
          'Please try again.',
        )
      },
    })
  }

  toggleActive(row: any, checked: boolean): void {
    const value = checked ? 1 : 0

    this.api
      .updateDeliveryPartnerActiveStatus({ id: row.id, value })
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            row.active_status = value
            this.notify.success('Status updated')
          } else {
            this.notify.error('Could not update status', res.message)
          }
        },
        error: () =>
          this.notify.error('Could not update status', 'Please try again.'),
      })
  }

  toggleLogin(row: any, checked: boolean): void {
    const value = checked ? 1 : 0

    this.api
      .updateDeliveryPartnerLoginStatus({ id: row.id, value })
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            row.login_status = value
            this.notify.success('Login status updated')
          } else {
            this.notify.error('Could not update status', res.message)
          }
        },
        error: () =>
          this.notify.error('Could not update status', 'Please try again.'),
      })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(
      `"${row.name}" will be removed.`,
    )

    if (!confirmed) {
      return
    }

    this.api.deleteDeliveryPartner(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Delivery partner deleted')
          this.load()
        } else {
          this.notify.error('Could not delete', res.message)
        }
      },
      error: () =>
        this.notify.error('Could not delete', 'Please try again.'),
    })
  }
}