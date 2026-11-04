import { CommonModule } from '@angular/common'
import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, computed, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

/** Products master - `products` table via /dashboard_api. */
@Component({
  selector: 'app-mv-products',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule, CommonModule],
  templateUrl: './products.html',
  styles: `
    .product-form {
      display: flex;
      flex-direction: column;
      min-height: 0;
      max-height: min(70vh, 42rem);
      max-height: min(70dvh, 42rem);
      overflow: hidden;
    }

    .product-form .modal-body {
      min-height: 0;
      overflow-y: auto;
    }

    .product-form .modal-footer {
      flex-shrink: 0;
    }

    .product-form .text-danger.fs-xs {
      line-height: 1.25;
    }

    /* Hides the default internal search bar and search icon block inside the data table component */
    .hide-table-search app-data-table ::ng-deep .input-group,
    .hide-table-search app-data-table ::ng-deep input[placeholder*="Search"],
    .hide-table-search app-data-table ::ng-deep .bi-search {
      display: none !important;
    }
  `,
})
export class Products implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)
  protected permissions = inject(PermissionService)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')
  readonly viewModal = viewChild.required<TemplateRef<any>>('viewModal')
  readonly activeCell = viewChild.required<TemplateRef<any>>('activeCell')

  readonly rows = signal<any[]>([])
  readonly vendors = signal<any[]>([])
  readonly categories = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  // Filter Signals
  readonly selectedProductFilter = signal<string>('')
  readonly selectedVendorFilter = signal<string>('')
  readonly selectedCategoryFilter = signal<string>('')
  readonly selectedSearchFilter = signal<string>('')

  readonly cellTemplates = computed(() => ({ active_status: this.activeCell() }))

  // Filtered rows computed based on selections
  readonly filteredRows = computed(() => {
    const pFilter = this.selectedProductFilter();
    const vId = this.selectedVendorFilter();
    const cId = this.selectedCategoryFilter();
    const search = this.selectedSearchFilter().toLowerCase().trim();

    return this.rows().filter(row => {
      // Product dropdown filtering
      let matchesProductDropdown = true;
      if (pFilter) {
        matchesProductDropdown = String(row.product_name) === pFilter;
      }

      // Vendor dropdown filtering
      let matchesVendorDropdown = true;
      if (vId) {
        const selectedVendorObj = this.vendors().find(v => String(v.id) === String(vId));
        const vName = selectedVendorObj ? selectedVendorObj.vendor_name.toLowerCase() : '';
        const rowVId = String(row.vendor_id ?? '');
        const rowVName = (row.vendor_name || '').toLowerCase();
        
        matchesVendorDropdown = rowVId === String(vId) || (vName !== '' && rowVName.includes(vName));
      }

      // Category dropdown filtering
      let matchesCategoryDropdown = true;
      if (cId) {
        const selectedCatObj = this.categories().find(c => String(c.id) === String(cId));
        const cName = selectedCatObj ? selectedCatObj.category_name.toLowerCase() : '';
        const rowCId = String(row.category_id ?? '');
        const rowCName = (row.category_name || '').toLowerCase();

        matchesCategoryDropdown = rowCId === String(cId) || (cName !== '' && rowCName.includes(cName));
      }

      // Global search bar
      const productName = (row.product_name || '').toLowerCase();
      const productCode = (row.product_code || '').toLowerCase();
      const vendorName = (row.vendor_name || '').toLowerCase();
      const categoryName = (row.category_name || '').toLowerCase();

      const matchesSearch = !search || 
        productName.includes(search) || 
        productCode.includes(search) || 
        vendorName.includes(search) || 
        categoryName.includes(search);

      return matchesProductDropdown && matchesVendorDropdown && matchesCategoryDropdown && matchesSearch;
    });
  });

  clearFilters(): void {
    this.selectedProductFilter.set('');
    this.selectedVendorFilter.set('');
    this.selectedCategoryFilter.set('');
    this.selectedSearchFilter.set('');
  }

  readonly columns: DataTableColumn[] = [
    { key: 'product_name', label: 'Product', width: '22%' },
    { key: 'vendor_name', label: 'Vendor', width: '16%' },
    { key: 'category_name', label: 'Category', width: '14%' },
    { key: 'base_price', label: 'Price', type: 'currency', width: '11%', align: 'end' },
    { key: 'discount_price', label: 'Offer Price', type: 'currency', width: '11%', align: 'end' },
    { key: 'stock_quantity', label: 'Stock', width: '9%', align: 'center' },
    { key: 'is_veg', label: 'Veg', type: 'badge', width: '8%', align: 'center', format: (v) => (Number(v) === 1 ? 'Veg' : 'Non-veg'), badgeClass: (v) => (Number(v) === 1 ? 'badge bg-success-subtle text-success' : 'badge bg-secondary-subtle text-secondary') },
    { key: 'active_status', label: 'Active', width: '9%', align: 'center', sortable: false },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'view', icon: 'eye', label: 'View', permission: 'view', className: 'text-primary' },
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    { key: 'delete', icon: 'trash', label: 'Delete', permission: 'delete', className: 'text-danger' },
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
    this.api.getVendors().subscribe({
      next: (res) => this.vendors.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.vendors.set([]),
    })
    this.api.getCategories().subscribe({
      next: (res) => this.categories.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.categories.set([]),
    })
  }

  load(): void {
    this.loading.set(true)
    this.api.getProducts().subscribe({
      next: (res) => {
        this.loading.set(false)
        this.rows.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => this.loading.set(false),
    })
  }

  openAdd(): void {
    this.editingId.set(null)
    resetValidation(this.form)
    this.form.reset({ vendor_id: null, category_id: null, base_price: 0, stock_quantity: 0, is_veg: 0, is_returnable: 0, is_featured: 0, discount_price: null })
    this.form.controls.vendor_id.enable()
    this.modalService.open(this.formModal(), { centered: true, size: 'lg', backdrop: 'static', scrollable: true })
  }

  openView(row: any): void {
    this.editingId.set(row.id)
    resetValidation(this.form)
    this.form.reset({
      vendor_id: row.vendor_id ?? null,
      category_id: row.category_id ?? null,
      product_name: row.product_name ?? '',
      product_code: row.product_code ?? '',
      description: row.description ?? '',
      base_price: row.base_price ?? null,
      discount_price: row.discount_price ?? null,
      stock_quantity: row.stock_quantity ?? null,
      is_veg: row.is_veg ?? null,
      is_returnable: row.is_returnable ?? null,
      is_featured: row.is_featured ?? null,
    })
    this.form.disable()
    this.modalService.open(this.viewModal(), { centered: true, size: 'lg', backdrop: 'static', scrollable: true })
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
      base_price: row.base_price ?? null,
      discount_price: row.discount_price ?? null,
      stock_quantity: row.stock_quantity ?? null,
      is_veg: row.is_veg ?? null,
      is_returnable: row.is_returnable ?? null,
      is_featured: row.is_featured ?? null,
    })
    this.form.enable()
    this.form.controls.vendor_id.disable()
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

  submit(): void {
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    const id = this.editingId()
    const payload = { ...this.form.getRawValue(), ...(id ? { id } : {}) }
    this.saving.set(true)

    const request = id ? this.api.updateProduct(payload) : this.api.addProduct(payload)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success(id ? 'Product updated' : 'Product added')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not save product', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not save product', 'Please try again.')
      },
    })
  }

  toggleActive(row: any, checked: boolean): void {
    const active_status = checked ? 1 : 0
    this.api.updateProductActiveStatus({ id: row.id, active_status }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          row.active_status = active_status
          this.notify.success('Product status updated')
        } else {
          this.notify.error('Could not update status', res.message)
        }
      },
      error: () => this.notify.error('Could not update status', 'Please try again.'),
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(`"${row.product_name}" will be removed.`)
    if (!confirmed) return

    this.api.deleteProduct(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Product deleted')
          this.load()
        } else {
          this.notify.error('Could not delete product', res.message)
        }
      },
      error: () => this.notify.error('Could not delete product', 'Please try again.'),
    })
  }
}