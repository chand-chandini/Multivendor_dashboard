import { checkImageFile, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
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
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

/** Locations master - `locations` table via /dashboard_api. */
@Component({
selector: 'app-mv-locations',
imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
templateUrl: './locations.html',
styles: ``,
})
export class Locations implements OnInit {
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

// Image filename and preview displayed in the Add/Edit modal.
readonly existingImageName = signal('')
readonly imagePreview = signal('')

readonly columns: DataTableColumn[] = [
{
key: 'location_image',
label: 'Image',
type: 'image',
width: '10%',
align: 'center',
},
{
key: 'city',
label: 'Location Name',
width: '20%',
},
{
key: 'latitude',
label: 'Latitude',
width: '15%',
align: 'center',
},
{
key: 'longitude',
label: 'Longitude',
width: '15%',
align: 'center',
},
{
key: 'max_delivery_service_km',
label: 'Max Delivery Service',
width: '20%',
align: 'center',
},
{
key: 'active_status',
label: 'Location Status',
type: 'switch',
width: '12%',
align: 'center',
},
]

readonly actions: DataTableAction[] = [
{
key: 'edit',
icon: 'edit',
label: 'Edit',
permission: 'edit',
},
{
key: 'delete',
icon: 'trash',
label: 'Delete',
permission: 'delete',
className: 'text-danger',
},
]

readonly form = withValidation(this.fb.nonNullable.group({
location_image: [null as File | null],
city: ['', [Validators.required]],
latitude: [''],
longitude: [''],
max_delivery_service_km: [0 as number | null],
}), {
    city: { type: 'text' },
    latitude: { type: 'number', min: -90, max: 90 },
    longitude: { type: 'number', min: -180, max: 180 },
    max_delivery_service_km: { type: 'number', min: 0 },
    location_image: { type: 'image', saved: (): unknown => this.editingId() ? this.existingImageName() : '', accept: 'image/png,image/jpeg,image/jpg,image/webp' },
  })

ngOnInit(): void {
this.load()
}

load(): void {
this.loading.set(true)

this.api.getLocations().subscribe({
  next: (res) => {
    this.loading.set(false)
    this.rows.set(res.status === 200 ? (res.data ?? []) : [])
  },
  error: () => {
    this.loading.set(false)
  },
})

}

openAdd(): void {
this.editingId.set(null)
this.existingImageName.set('')
this.imagePreview.set('')

resetValidation(this.form)
this.form.reset({
  location_image: null,
  city: '',
  latitude: '',
  longitude: '',
  max_delivery_service_km: 0,
})

this.modalService.open(this.formModal(), {
  centered: true,
  size: 'lg',
  backdrop: 'static',
})

}

openEdit(row: any): void {
this.editingId.set(row.id)

resetValidation(this.form)
this.form.reset({
  location_image: null,
  city: row.city ?? '',
  latitude: row.latitude ?? '',
  longitude: row.longitude ?? '',
  max_delivery_service_km: row.max_delivery_service_km ?? null,
})

const currentImage = row.location_image ?? ''
this.existingImageName.set(this.getImageName(currentImage))
this.imagePreview.set(this.getImagePreview(currentImage))
this.form.controls.location_image.updateValueAndValidity()

this.modalService.open(this.formModal(), {
  centered: true,
  size: 'lg',
  backdrop: 'static',
})

}

onAction(event: DataTableActionEvent): void {
if (event.key === 'edit') {
this.openEdit(event.row)
} else if (event.key === 'delete') {
this.confirmDelete(event.row)
}
}

onStatusChange(event: { id: number; value: number }): void {
this.api
.updateLocationActiveStatus({
id: event.id,
value: event.value,
})
.subscribe({
next: (res) => {
if (res.status === 200) {
this.notify.success('Location status updated')
this.load()
} else {
this.notify.error(
'Could not update location status',
res.message
)
this.load()
}
},
error: () => {
this.notify.error(
'Could not update location status',
'Please try again.'
)
this.load()
},
})
}

onImageSelected(event: Event): void {
const input = event.target as HTMLInputElement
const file = input.files?.[0]

if (!file) return
    if (!checkImageFile(this.form.controls.location_image, file, 'image/png,image/jpeg,image/jpg,image/webp')) return


this.form.patchValue({
  location_image: file,
})

this.existingImageName.set(file.name)

const reader = new FileReader()
reader.onload = () => {
  this.imagePreview.set(
    typeof reader.result === 'string' ? reader.result : ''
  )
}
reader.readAsDataURL(file)

}

private getImageName(value: string): string {
if (!value) return ''

const cleanValue = value.split('?')[0].split('#')[0]
const lastPart = cleanValue.split('/').pop() ?? ''

try {
  return decodeURIComponent(lastPart)
} catch {
  return lastPart
}

}

private getImagePreview(value: string): string {
if (!value) return ''

// Keep complete URLs and Base64 image values unchanged.
if (/^(https?:)?\/\//i.test(value) || value.startsWith('data:image/')) {
  return value
}

// Resolve a relative image path against the current website.
return `${window.location.origin}/${value.replace(/^\/+/, '')}`

}

submit(): void {
if (!validateForm(this.form)) {
this.form.markAllAsTouched()
return
}

const id = this.editingId()
const values = this.form.getRawValue()

const payload = new FormData()

payload.append('city', values.city)
payload.append('latitude', values.latitude)
payload.append('longitude', values.longitude)
payload.append(
  'max_delivery_service_km',
  String(values.max_delivery_service_km)
)

if (values.location_image) {
  payload.append('location_image', values.location_image)
}

if (id) {
  payload.append('id', String(id))
}

this.saving.set(true)

const request = id
  ? this.api.updateLocation(payload)
  : this.api.addLocation(payload)

request.subscribe({
  next: (res) => {
    this.saving.set(false)

    if (res.status === 200) {
      this.notify.success(id ? 'Location updated' : 'Location added')
      this.modalService.dismissAll()
      this.load()
    } else {
      this.notify.error('Could not save location', res.message)
    }
  },
  error: () => {
    this.saving.set(false)
    this.notify.error(
      'Could not save location',
      'Please try again.'
    )
  },
})

}

private async confirmDelete(row: any): Promise<void> {
const confirmed = await this.notify.confirmDelete(
`"${row.city}" will be removed.`
)

if (!confirmed) return

this.api.deleteLocation(row.id).subscribe({
  next: (res) => {
    if (res.status === 200) {
      this.notify.success('Location deleted')
      this.load()
    } else {
      this.notify.error(
        'Could not delete location',
        res.message
      )
    }
  },
  error: () => {
    this.notify.error(
      'Could not delete location',
      'Please try again.'
    )
  },
})

}
}
