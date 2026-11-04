import { beginImageRead, completeImageRead, failImageRead, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
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
  selector: 'app-mv-website-banners',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './website-banners.html',
  styles: ``,
})
export class WebsiteBanners implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')

  readonly rows = signal<any[]>([])
  readonly filteredRows = signal<any[]>([])
  readonly locations = signal<any[]>([])

  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  readonly selectedLocationId = signal<string>('')

  readonly columns: DataTableColumn[] = [
    {
      key: 'location',
      label: 'Location',
      width: '40%',
    },
    {
      key: 'banner_image',
      label: 'Banner Image',
      type: 'image',
      width: '40%',
      sortable: false,
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
    location_id: [''],
    banner_image: [''],
  }), {
    location_id: { choices: () => this.locations().map((item) => item.id) },
    banner_image: { type: 'image', saved: (): unknown => this.editingId() ? this.form?.controls.banner_image.value : '', accept: 'image/*' },
  })

  ngOnInit(): void {
    this.load()
    this.loadLocations()
  }

  load(): void {
    this.loading.set(true)

    this.api.getWebsiteBanners().subscribe({
      next: (res) => {
        this.loading.set(false)

        const data = res.status === 200
          ? (res.data ?? [])
          : []

        this.rows.set(data)
        this.filteredRows.set(data)
      },

      error: () => {
        this.loading.set(false)
        this.rows.set([])
        this.filteredRows.set([])
      },
    })
  }

  loadLocations(): void {
    this.api.getLocations().subscribe({
      next: (res) => {
        this.locations.set(
          res.status === 200
            ? (res.data ?? [])
            : []
        )
      },

      error: () => {
        this.locations.set([])
      },
    })
  }

  onLocationChange(event: Event): void {
    const select = event.target as HTMLSelectElement

    this.selectedLocationId.set(select.value)
  }

  searchByLocation(): void {
    const locationId = this.selectedLocationId()

    if (!locationId) {
      this.filteredRows.set(this.rows())
      return
    }

    const filtered = this.rows().filter(
      (row) =>
        String(row.location_id) === String(locationId)
    )

    this.filteredRows.set(filtered)
  }

  openAdd(): void {
    this.editingId.set(null)

    resetValidation(this.form)
    this.form.reset({
      location_id: '',
      banner_image: '',
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
      location_id: String(row.location_id ?? ''),
      banner_image: row.banner_image ?? '',
    })

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  async onBannerImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      return
    }
    if (!beginImageRead(this.form.controls.banner_image, file, 'image/*')) return


    if (!file.type.startsWith('image/')) {
      this.notify.error(
        'Invalid image',
        'Please select an image file.'
      )

      input.value = ''
      return
    }

    try {
      const value = await this.fileToBase64(file)

      completeImageRead(this.form.controls.banner_image, value, file)
      this.form.controls.banner_image.markAsDirty()
    } catch (error) {
      failImageRead(this.form.controls.banner_image, file)
      console.error('Banner image conversion error:', error)

      this.notify.error(
        'Image error',
        'Could not read the selected image.'
      )

      input.value = ''
    }
  }

  private fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = () => {
        resolve(String(reader.result ?? ''))
      }

      reader.onerror = () => {
        reject(new Error('Could not read selected image.'))
      }

      reader.readAsDataURL(file)
    })
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
      return
    }
    const id = this.editingId()
    const values = this.form.getRawValue()

    const payload = {
      location_id: values.location_id,
      banner_image: values.banner_image,
    }

    this.saving.set(true)

    const request = id
      ? this.api.updateWebsiteBanner(id, payload)
      : this.api.saveWebsiteBanner(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)

        if (res.status === 200) {
          this.notify.success(
            id ? 'Banner updated' : 'Banner added'
          )

          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error(
            'Could not save banner',
            res.message
          )
        }
      },

      error: () => {
        this.saving.set(false)

        this.notify.error(
          'Could not save banner',
          'Please try again.'
        )
      },
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(
      `"${row.location || 'This banner'}" will be removed.`
    )

    if (!confirmed) {
      return
    }

    this.api.deleteWebsiteBanner(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Banner deleted')
          this.load()
        } else {
          this.notify.error(
            'Could not delete banner',
            res.message
          )
        }
      },

      error: () => {
        this.notify.error(
          'Could not delete banner',
          'Please try again.'
        )
      },
    })
  }
}
