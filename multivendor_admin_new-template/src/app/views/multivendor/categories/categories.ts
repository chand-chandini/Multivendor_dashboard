import { checkImageFile, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import {
  Component,
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
import { NgbModal, NgbNavModule } from '@ng-bootstrap/ng-bootstrap'

type CategorySection = 'category' | 'subcategory' | 'mainfilter'

@Component({
  selector: 'app-mv-categories',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule, NgbNavModule],
  templateUrl: './categories.html',
  styles: ``,
})
export class Categories implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')

  activeTab = 'categories'

  readonly categories = signal<any[]>([])
  readonly subCategories = signal<any[]>([])
  readonly mainFilters = signal<any[]>([])

  readonly loading = signal(true)
  readonly saving = signal(false)

  readonly editingId = signal<number | null>(null)
  readonly editingSection = signal<CategorySection>('category')

  // Image preview and filename for Add/Edit popups
  readonly imagePreview = signal<string>('')
  readonly existingImageName = signal<string>('')

  readonly categoryColumns: DataTableColumn[] = [
    {
      key: 'category_name',
      label: 'Category',
      width: '35%',
    },
    {
      key: 'category_image',
      label: 'Image',
      type: 'image',
      width: '15%',
      align: 'center',
    },
  ]

  readonly subCategoryColumns: DataTableColumn[] = [
    {
      key: 'parent_category_name',
      label: 'Category',
      width: '30%',
    },
    {
      key: 'category_name',
      label: 'Sub Category',
      width: '30%',
    },
    {
      key: 'category_image',
      label: 'Image',
      type: 'image',
      width: '15%',
      align: 'center',
    },
  ]

  readonly mainFilterColumns: DataTableColumn[] = [
    {
      key: 'category_name',
      label: 'Category',
      width: '40%',
    },
    {
      key: 'filter_name',
      label: 'Main Filter',
      width: '40%',
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
    category_name: ['', [Validators.required]],
    parent_id: [null as number | null],
    category_image: [null as File | string | null],
    filter_name: [''],
  }), {
    category_name: { when: (): boolean => this.editingSection() !== 'mainfilter' },
    parent_id: { when: (): boolean => this.editingSection() !== 'category', choices: () => this.categories().map((item) => item.id) },
    filter_name: { when: (): boolean => this.editingSection() === 'mainfilter' },
    category_image: { type: 'image', when: (): boolean => this.editingSection() !== 'mainfilter', saved: (): unknown => this.editingId() ? this.form?.controls.category_image.value : '', accept: 'image/png,image/jpeg,image/jpg,image/webp' },
  })

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)

    this.api.getCategories().subscribe({
      next: (res) => {
        this.categories.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => {
        this.categories.set([])
      },
    })

    this.api.getSubCategories().subscribe({
      next: (res) => {
        this.subCategories.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => {
        this.subCategories.set([])
      },
    })

    this.api.getMainFilters().subscribe({
      next: (res) => {
        this.mainFilters.set(res.status === 200 ? (res.data ?? []) : [])
        this.loading.set(false)
      },
      error: () => {
        this.mainFilters.set([])
        this.loading.set(false)
      },
    })
  }

  openAdd(section: CategorySection): void {
    this.editingId.set(null)
    this.editingSection.set(section)

    this.imagePreview.set('')
    this.existingImageName.set('')

    resetValidation(this.form)
    this.form.reset({
      category_name: '',
      parent_id: null,
      category_image: null,
      filter_name: '',
    })

    this.updateValidators(section)

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  openEdit(row: any, section: CategorySection): void {
    this.editingId.set(row.id)
    this.editingSection.set(section)

    const existingImage = row.category_image ?? ''

    resetValidation(this.form)
    this.form.reset({
      category_name: row.category_name ?? '',
      parent_id: row.parent_id ?? row.category_id ?? null,
      category_image: existingImage,
      filter_name: row.filter_name ?? '',
    })

    // Show the existing filename and preview when editing.
    this.existingImageName.set(this.getImageName(existingImage))
    this.imagePreview.set(this.getExistingImagePreview(existingImage))

    this.updateValidators(section)

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  private getImageName(value: string | File | null): string {
    if (!value || value instanceof File) {
      return ''
    }

    const cleanValue = value.split('?')[0].split('#')[0]
    return cleanValue.split('/').pop() || ''
  }

  private getExistingImagePreview(value: string | File | null): string {
    if (!value || value instanceof File) {
      return ''
    }

    // Base64 image data can be displayed directly.
    if (value.startsWith('data:image/')) {
      return value
    }

    // Keep a complete HTTP/HTTPS image URL unchanged.
    if (/^https?:\/\//i.test(value)) {
      return value
    }

    // Relative paths are resolved using the browser's current origin.
    // If the stored value is only a filename, this uses that filename.
    return value.startsWith('/')
      ? `${window.location.origin}${value}`
      : `${window.location.origin}/${value}`
  }

  private updateValidators(section: CategorySection): void {
    this.form.controls.category_name.clearValidators()
    this.form.controls.parent_id.clearValidators()
    this.form.controls.filter_name.clearValidators()

    if (section === 'category') {
      this.form.controls.category_name.setValidators([Validators.required])
    }

    if (section === 'subcategory') {
      this.form.controls.category_name.setValidators([Validators.required])
      this.form.controls.parent_id.setValidators([Validators.required])
    }

    if (section === 'mainfilter') {
      this.form.controls.parent_id.setValidators([Validators.required])
      this.form.controls.filter_name.setValidators([Validators.required])
    }

    this.form.controls.category_name.updateValueAndValidity()
    this.form.controls.parent_id.updateValueAndValidity()
    this.form.controls.filter_name.updateValueAndValidity()
  }

  onAction(event: DataTableActionEvent, section: CategorySection): void {
    if (event.key === 'edit') {
      this.openEdit(event.row, section)
    } else if (event.key === 'delete') {
      this.confirmDelete(event.row, section)
    }
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) {
      return
    }
    if (!checkImageFile(this.form.controls.category_image, file, 'image/png,image/jpeg,image/jpg,image/webp')) return


    this.form.patchValue({
      category_image: file,
    })

    // Update the filename immediately.
    this.existingImageName.set(file.name)

    // Generate a local preview without uploading the image yet.
    const reader = new FileReader()

    reader.onload = () => {
      this.imagePreview.set(reader.result as string)
    }

    reader.onerror = () => {
      this.imagePreview.set('')
    }

    reader.readAsDataURL(file)
  }

  submit(): void {
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    const id = this.editingId()
    const section = this.editingSection()

    this.saving.set(true)

    let request: any

    if (section === 'category') {
      const formData = new FormData()

      formData.append(
        'category_name',
        this.form.controls.category_name.value || ''
      )

      const image = this.form.controls.category_image.value

      if (image instanceof File) {
        formData.append('category_image', image)
      }

      if (id) {
        formData.append('id', String(id))
      }

      request = id
        ? this.api.updateCategory(formData as any)
        : this.api.addCategory(formData as any)
    } else if (section === 'subcategory') {
      const formData = new FormData()

      formData.append(
        'category_name',
        this.form.controls.category_name.value || ''
      )

      formData.append(
        'parent_id',
        String(this.form.controls.parent_id.value || '')
      )

      const image = this.form.controls.category_image.value

      if (image instanceof File) {
        formData.append('category_image', image)
      }

      if (id) {
        formData.append('id', String(id))
      }

      request = id
        ? this.api.updateSubCategory(formData as any)
        : this.api.addSubCategory(formData as any)
    } else {
      const payload = {
        category_id: this.form.controls.parent_id.value,
        filter_name: this.form.controls.filter_name.value,
        ...(id ? { id } : {}),
      }

      request = id
        ? this.api.updateMainFilter(payload)
        : this.api.addMainFilter(payload)
    }

    request.subscribe({
      next: (res: any) => {
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

  private async confirmDelete(
    row: any,
    section: CategorySection
  ): Promise<void> {
    const name =
      section === 'mainfilter'
        ? row.filter_name
        : row.category_name

    const confirmed = await this.notify.confirmDelete(
      `"${name}" will be removed.`
    )

    if (!confirmed) return

    let request: any

    if (section === 'category') {
      request = this.api.deleteCategory(row.id)
    } else if (section === 'subcategory') {
      request = this.api.deleteSubCategory(row.id)
    } else {
      request = this.api.deleteMainFilter(row.id)
    }

    request.subscribe({
      next: (res: any) => {
        if (res.status === 200) {
          this.notify.success('Deleted successfully')
          this.load()
        } else {
          this.notify.error('Could not delete', res.message)
        }
      },
      error: () => {
        this.notify.error('Could not delete', 'Please try again.')
      },
    })
  }
}