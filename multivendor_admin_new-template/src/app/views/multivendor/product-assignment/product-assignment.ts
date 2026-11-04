import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, computed, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'

@Component({
  selector: 'app-mv-product-assignment',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './product-assignment.html',
  styles: ``,
})
export class ProductAssignment implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private fb = inject(FormBuilder)

  protected permissions = inject(PermissionService)

  readonly selectCell = viewChild.required<TemplateRef<any>>('selectCell')

  readonly items = signal<any[]>([])
  readonly categories = signal<any[]>([])
  readonly shops = signal<any[]>([])

  readonly loading = signal(false)
  readonly submitting = signal(false)

  readonly productsLoaded = signal(false)

  readonly selectedIds = signal<Set<number>>(new Set())
  readonly selectedCount = computed(() => this.selectedIds().size)

  readonly cellTemplates = computed(() => ({
    select: this.selectCell(),
  }))

  readonly columns: DataTableColumn[] = [
    {
      key: 'select',
      label: '',
      width: '4%',
      sortable: false,
      align: 'center',
    },
    {
      key: 'shop_image',
      label: 'Item Image',
      type: 'image',
      width: '10%',
      sortable: false,
      align: 'center',
    },
    {
      key: 'subcategory',
      label: 'Subcategory',
      width: '15%',
    },
    {
      key: 'item',
      label: 'Item Name',
      width: '15%',
    },
    {
      key: 'description',
      label: 'Item Description',
      width: '23%',
    },
    {
      key: 'actual_price',
      label: 'Actual Price',
      type: 'currency',
      width: '13%',
      align: 'end',
    },
    {
      key: 'selling_price',
      label: 'Selling Price',
      type: 'currency',
      width: '13%',
      align: 'end',
    },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    category_id: [null as number | null, [Validators.required]],
    shop_id: [null as number | null, [Validators.required]],
    phone_address: [''],
  }), {
    category_id: { choices: () => this.categories().map((item) => item.id) },
    shop_id: { choices: () => this.shops().map((item) => item.id) },
  })

  ngOnInit(): void {
    this.loadCategories()
    this.loadShops()

    this.form.controls.shop_id.valueChanges.subscribe((shopId) => {
      this.onShopChange(shopId)
    })
  }

  private loadCategories(): void {
    this.api.getCategories().subscribe({
      next: (res) => {
        this.categories.set(
          res.status === 200 ? (res.data ?? []) : [],
        )
      },
      error: () => {
        this.categories.set([])
      },
    })
  }

  private loadShops(): void {
    this.api.getVendors().subscribe({
      next: (res) => {
        this.shops.set(
          res.status === 200 ? (res.data ?? []) : [],
        )
      },
      error: () => {
        this.shops.set([])
      },
    })
  }

  /**
   * When a shop is selected, automatically fill
   * Phone / Address from the vendor record.
   */
  private onShopChange(shopId: number | null): void {
    if (!shopId) {
      this.form.controls.phone_address.setValue('')
      return
    }

    const shop = this.shops().find(
      (item) => Number(item.id) === Number(shopId),
    )

    if (!shop) {
      this.form.controls.phone_address.setValue('')
      return
    }

    const phone = shop.vendor_mobile_number ?? ''
    const address = shop.vendor_address ?? ''

    let phoneAddress = ''

    if (phone && address) {
      phoneAddress = `${phone} / ${address}`
    } else if (phone) {
      phoneAddress = phone
    } else {
      phoneAddress = address
    }

    this.form.controls.phone_address.setValue(phoneAddress)
  }

  /**
   * Products should NOT load when the page opens.
   * They load only after clicking Get Products.
   */
getProducts(): void {
  if (!validateForm(this.form)) {
    this.form.markAllAsTouched()
    return
  }

  const { category_id, shop_id } = this.form.getRawValue()

  if (category_id === null || shop_id === null) {
    this.form.markAllAsTouched()
    return
  }

  this.loading.set(true)
  this.productsLoaded.set(false)
  this.selectedIds.set(new Set())

  this.api.getProductAssignment({
    category_id,
    shop_id,
  }).subscribe({
    next: (res) => {
      this.loading.set(false)

      if (res.status === 200) {
        const products = res.data ?? []

        this.items.set(products)
        this.productsLoaded.set(products.length > 0)
      } else {
        this.items.set([])
        this.productsLoaded.set(false)

        this.notify.error(
          'Could not get products',
          res.message || 'No products found.',
        )
      }
    },

    error: () => {
      this.loading.set(false)
      this.items.set([])
      this.productsLoaded.set(false)

      this.notify.error(
        'Could not get products',
        'Please try again.',
      )
    },
  })
}

  isSelected(row: any): boolean {
    return this.selectedIds().has(Number(row.id))
  }

  toggleRow(row: any, checked: boolean): void {
    const next = new Set(this.selectedIds())

    if (checked) {
      next.add(Number(row.id))
    } else {
      next.delete(Number(row.id))
    }

    this.selectedIds.set(next)
  }

  get allSelected(): boolean {
    const rows = this.items()

    return (
      rows.length > 0 &&
      rows.every((row) =>
        this.selectedIds().has(Number(row.id)),
      )
    )
  }

  toggleAll(checked: boolean): void {
    if (checked) {
      this.selectedIds.set(
        new Set(
          this.items().map((row) => Number(row.id)),
        ),
      )
    } else {
      this.selectedIds.set(new Set())
    }
  }

  submit(): void {
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()

      this.notify.error(
        'Category and Shop are required',
        'Please select Category and Shop.',
      )

      return
    }

    const selected = this.items().filter((row) =>
      this.selectedIds().has(Number(row.id)),
    )

    if (selected.length === 0) {
      this.notify.error(
        'No products selected',
        'Please select at least one product.',
      )

      return
    }

    const {
      category_id,
      shop_id,
      phone_address,
    } = this.form.getRawValue()

    this.submitting.set(true)

    this.api.submitProductAssignment({
      category_id,
      shop_id,
      phone_address,
      products: selected,
    }).subscribe({
      next: (res) => {
        this.submitting.set(false)

        if (res.status === 200) {
          this.notify.success(
            res.message || 'Products assigned successfully',
          )

          this.selectedIds.set(new Set())
        } else {
          this.notify.error(
            'Could not assign products',
            res.message || 'Please try again.',
          )
        }
      },

      error: () => {
        this.submitting.set(false)

        this.notify.error(
          'Could not assign products',
          'Please try again.',
        )
      },
    })
  }
}