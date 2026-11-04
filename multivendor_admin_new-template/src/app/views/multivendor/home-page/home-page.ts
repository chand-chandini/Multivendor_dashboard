import { beginImageRead, completeImageRead, failImageRead, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
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

@Component({
  selector: 'app-mv-home-page',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './home-page.html',
  styles: ``,
})
export class HomePage implements OnInit {
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
    {
      key: 'image',
      label: 'Image',
      type: 'image',
      width: '10%',
      sortable: false,
      align: 'center',
    },
    {
      key: 'section_key',
      label: 'Section',
      width: '16%',
    },
    {
      key: 'heading',
      label: 'Heading',
      width: '22%',
    },
    {
      key: 'subheading',
      label: 'Subheading',
      width: '28%',
    },
    {
      key: 'display_order',
      label: 'Order',
      width: '8%',
      align: 'center',
    },
    {
      key: 'status',
      label: 'Status',
      type: 'badge',
      width: '10%',
      align: 'center',
      format: (v) => (Number(v) === 1 ? 'Active' : 'Inactive'),
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
    section_key: ['', [Validators.required]],
    heading: [''],
    subheading: [''],
    image: [''],
    display_order: [1 as number | null],
    status: [1 as number | null],
  }), {
    section_key: { type: 'text' },
    heading: { type: 'text' },
    subheading: { type: 'text' },
    image: { type: 'image', saved: (): unknown => this.editingId() ? this.form?.controls.image.value : '', accept: 'image/*' },
    display_order: { type: 'integer', min: 0 },
    status: { choices: () => [0, 1] },
  })

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)

    this.api.getWebsiteHomeSections().subscribe({
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
      section_key: '',
      heading: '',
      subheading: '',
      image: '',
      display_order: 1,
      status: 1,
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
      section_key: row.section_key ?? '',
      heading: row.heading ?? '',
      subheading: row.subheading ?? '',
      image: row.image ?? '',
      display_order: (row.display_order == null || row.display_order === '' ? null : Number(row.display_order)),
      status: (row.status == null || row.status === '' ? null : Number(row.status)),
    })

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  async onHomeImageSelected(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      return
    }
    if (!beginImageRead(this.form.controls.image, file, 'image/*')) return


    if (!file.type.startsWith('image/')) {
      this.notify.error('Invalid image', 'Please select an image file.')
      input.value = ''
      return
    }

    try {
      const value = await this.fileToBase64(file)

      completeImageRead(this.form.controls.image, value, file)
      this.form.controls.image.markAsDirty()
    } catch (error) {
      failImageRead(this.form.controls.image, file)
      console.error('Home page image conversion error:', error)

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
      this.form.markAllAsTouched()
      return
    }

    const id = this.editingId()
    const payload = this.form.getRawValue()

    this.saving.set(true)

    const request = id
      ? this.api.updateWebsiteHomeSection(id, payload)
      : this.api.saveWebsiteHomeSection(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)

        if (res.status === 200) {
          this.notify.success(
            id ? 'Home Section updated' : 'Home Section added'
          )

          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error(
            'Could not save home section',
            res.message
          )
        }
      },

      error: () => {
        this.saving.set(false)

        this.notify.error(
          'Could not save home section',
          'Please try again.'
        )
      },
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(
      `"${row.section_key}" will be removed.`
    )

    if (!confirmed) {
      return
    }

    this.api.deleteWebsiteHomeSection(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Home Section deleted')
          this.load()
        } else {
          this.notify.error(
            'Could not delete home section',
            res.message
          )
        }
      },

      error: () => {
        this.notify.error(
          'Could not delete home section',
          'Please try again.'
        )
      },
    })
  }
}
