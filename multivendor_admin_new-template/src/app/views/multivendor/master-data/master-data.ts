import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
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
import { PermissionService } from '@core/services/permission.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-mv-master-data',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './master-data.html',
  styles: ``,
})
export class MasterData implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  protected permissions = inject(PermissionService)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')

  readonly rows = signal<any[]>([])
  readonly vendors = signal<any[]>([])
  readonly categories = signal<any[]>([])

  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  readonly columns: DataTableColumn[] = [
    {
      key: 'product_name',
      label: 'Product',
      width: '22%',
    },
    {
      key: 'product_code',
      label: 'Product Code',
      width: '13%',
    },
    {
      key: 'vendor_name',
      label: 'Vendor',
      width: '15%',
    },
    {
      key: 'category_name',
      label: 'Category',
      width: '15%',
    },
    {
      key: 'description',
      label: 'Description',
      width: '17%',
    },
    {
      key: 'base_price',
      label: 'Price',
      type: 'currency',
      width: '9%',
      align: 'end',
    },
    {
      key: 'discount_price',
      label: 'Offer Price',
      type: 'currency',
      width: '9%',
      align: 'end',
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
    vendor_id: [null as number | null, [Validators.required]],
    category_id: [null as number | null, [Validators.required]],
    product_name: ['', [Validators.required]],
    product_code: [''],
    description: [''],
    base_price: [0 as number | null, [Validators.required, Validators.min(0)]],
    discount_price: [null as number | null],
    stock_quantity: [0 as number | null],
    is_veg: [0 as number | null],
    is_returnable: [0 as number | null],
    is_featured: [0 as number | null],
  }), {
    vendor_id: { choices: () => this.vendors().map((item) => item.id) },
    category_id: { choices: () => this.categories().map((item) => item.id) },
    product_name: { type: 'text' },
    product_code: { type: 'text' },
    description: { type: 'text' },
    base_price: { type: 'number', min: 0 },
    discount_price: { type: 'number', min: 0, maxField: 'base_price' },
    stock_quantity: { type: 'integer', min: 0 },
    is_veg: { choices: () => [0, 1] },
    is_returnable: { choices: () => [0, 1] },
    is_featured: { choices: () => [0, 1] },
  })

  ngOnInit(): void {
    this.load()
    this.loadVendors()
    this.loadCategories()
  }

  load(): void {
    this.loading.set(true)

    this.api.getProducts().subscribe({
      next: (res) => {
        this.loading.set(false)

        this.rows.set(
          res.status === 200
            ? (res.data ?? [])
            : [],
        )
      },

      error: () => {
        this.loading.set(false)
        this.rows.set([])
      },
    })
  }

  loadVendors(): void {
    this.api.getVendors().subscribe({
      next: (res) => {
        this.vendors.set(
          res.status === 200
            ? (res.data ?? [])
            : [],
        )
      },

      error: () => {
        this.vendors.set([])
      },
    })
  }

  loadCategories(): void {
    this.api.getCategories().subscribe({
      next: (res) => {
        this.categories.set(
          res.status === 200
            ? (res.data ?? [])
            : [],
        )
      },

      error: () => {
        this.categories.set([])
      },
    })
  }

  openAdd(): void {
    this.editingId.set(null)

    resetValidation(this.form)
    this.form.reset({
      vendor_id: null,
      category_id: null,
      product_name: '',
      product_code: '',
      description: '',
      base_price: 0,
      discount_price: null,
      stock_quantity: 0,
      is_veg: 0,
      is_returnable: 0,
      is_featured: 0,
    })

    this.form.controls.vendor_id.enable()

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
      vendor_id: row.vendor_id ?? null,
      category_id: row.category_id ?? null,
      product_name: row.product_name ?? '',
      product_code: row.product_code ?? '',
      description: row.description ?? '',
      base_price: (row.base_price == null || row.base_price === '' ? null : Number(row.base_price)),
      discount_price:
        row.discount_price === null ||
        row.discount_price === undefined ||
        row.discount_price === ''
          ? null
          : Number(row.discount_price),
      stock_quantity: (row.stock_quantity == null || row.stock_quantity === '' ? null : Number(row.stock_quantity)),
      is_veg: (row.is_veg == null || row.is_veg === '' ? null : Number(row.is_veg)),
      is_returnable: (row.is_returnable == null || row.is_returnable === '' ? null : Number(row.is_returnable)),
      is_featured: (row.is_featured == null || row.is_featured === '' ? null : Number(row.is_featured)),
    })

    // Keep the existing product vendor unchanged while editing.
    this.form.controls.vendor_id.disable()

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
      ? this.api.updateProduct(payload)
      : this.api.addProduct(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)

        if (res.status === 200) {
          this.notify.success(
            id
              ? 'Product updated'
              : 'Product added',
          )

          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error(
            'Could not save product',
            res.message || 'Please try again.',
          )
        }
      },

      error: () => {
        this.saving.set(false)

        this.notify.error(
          'Could not save product',
          'Please try again.',
        )
      },
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(
      `"${row.product_name}" will be permanently deleted.`,
    )

    if (!confirmed) {
      return
    }

    this.api.deleteProduct(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Product deleted')
          this.load()
        } else {
          this.notify.error(
            'Could not delete product',
            res.message || 'Please try again.',
          )
        }
      },

      error: () => {
        this.notify.error(
          'Could not delete product',
          'Please try again.',
        )
      },
    })
  }
}