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
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'
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

/**
 * Shop Items master - the `shopitems` table, served by the existing
 * getshopitems / addshopitem / updateshopitem / deleteshopitem /
 * updateshopitemactivestatus endpoints.
 *
 * The add/update endpoints support multipart image upload through
 * the existing `shop_image` field.
 */
@Component({
  selector: 'app-mv-shop-items',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './shop-items.html',
  styles: ``,
})
export class ShopItems implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  protected permissions = inject(PermissionService)

  readonly formModal =
    viewChild.required<TemplateRef<any>>('formModal')

  readonly activeCell =
    viewChild.required<TemplateRef<any>>('activeCell')

  readonly rows = signal<any[]>([])

  readonly subcategories =
    signal<any[]>([])

  readonly filters =
    signal<any[]>([])

  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId =
    signal<number | null>(null)

  private selectedShopImage: File | null = null

  readonly cellTemplates = computed(() => ({
    active_status: this.activeCell(),
  }))

  readonly columns: DataTableColumn[] = [
    {
      key: 'shop_image',
      label: 'Image',
      type: 'image',
      width: '7%',
      sortable: false,
      align: 'center',
    },
    {
      key: 'subcategory',
      label: 'Subcategory',
      width: '11%',
    },
    {
      key: 'filter',
      label: 'Filter',
      width: '8%',
    },
    {
      key: 'item',
      label: 'Item',
      width: '10%',
    },
    {
      key: 'description',
      label: 'Description',
      width: '13%',
    },
    {
      key: 'measurement',
      label: 'Measurement',
      width: '8%',
    },
    {
      key: 'actual_price',
      label: 'Actual Price',
      type: 'currency',
      width: '9%',
      align: 'end',
    },
    {
      key: 'selling_price',
      label: 'Selling Price',
      type: 'currency',
      width: '9%',
      align: 'end',
    },
    {
      key: 'available_time',
      label: 'Available Time',
      width: '11%',
    },
    {
      key: 'discount_percentage',
      label: 'Discount (%)',
      width: '7%',
      align: 'end',
      format: (v) =>
        v === null ||
        v === undefined ||
        v === ''
          ? '-'
          : Number(v) + '%',
    },
    {
      key: 'discount_amount',
      label: 'Discount Amount',
      type: 'currency',
      width: '9%',
      align: 'end',
    },
    {
      key: 'active_status',
      label: 'Active',
      width: '7%',
      align: 'center',
      sortable: false,
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
    shop_image: [''],

    subcategory: [
      '',
      [Validators.required],
    ],

    filter: [''],

    item: [
      '',
      [Validators.required],
    ],

    description: [''],

    measurement: [''],

    actual_price: [
      0 as number | null,
      [
        Validators.required,
        Validators.min(0),
      ],
    ],

    selling_price: [
      0 as number | null,
      [
        Validators.required,
        Validators.min(0),
      ],
    ],

    available_time: [''],

    discount_percentage: [
      0 as number | null,
      [Validators.min(0)],
    ],

    discount_amount: [
      0 as number | null,
      [Validators.min(0)],
    ],
  }), {
    item: { type: 'text' },
    description: { type: 'text' },
    measurement: { type: 'text' },
    available_time: { type: 'text' },
    subcategory: { choices: () => this.subcategories().map((item) => item.category_name) },
    filter: { choices: () => this.filters().map((item) => item.filter_name) },
    actual_price: { type: 'number', min: 0 },
    selling_price: { type: 'number', min: 0, maxField: 'actual_price' },
    discount_percentage: { type: 'number', min: 0, max: 100 },
    discount_amount: { type: 'number', min: 0, maxField: 'actual_price' },
    shop_image: { type: 'image', saved: (): unknown => this.editingId() ? this.form?.controls.shop_image.value : '', file: () => this.selectedShopImage, accept: 'image/*' },
  })

  ngOnInit(): void {
    this.load()

    this.api.getSubCategories().subscribe({
      next: (res) => {
        this.subcategories.set(
          res.status === 200
            ? (res.data ?? [])
            : [],
        )
      },

      error: () => {
        this.subcategories.set([])
      },
    })

    this.api.getMainFilters().subscribe({
      next: (res) => {
        this.filters.set(
          res.status === 200
            ? (res.data ?? [])
            : [],
        )
      },

      error: () => {
        this.filters.set([])
      },
    })
  }

  load(): void {
    this.loading.set(true)

    this.api.getShopItems().subscribe({
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

  openAdd(): void {
    this.editingId.set(null)

    this.selectedShopImage = null

    resetValidation(this.form)
    this.form.reset({
      shop_image: '',
      subcategory: '',
      filter: '',
      item: '',
      description: '',
      measurement: '',
      actual_price: 0,
      selling_price: 0,
      available_time: '',
      discount_percentage: 0,
      discount_amount: 0,
    })

    this.modalService.open(
      this.formModal(),
      {
        centered: true,
        size: 'lg',
        backdrop: 'static',
      },
    )
  }

  openEdit(row: any): void {
    this.editingId.set(row.id)

    this.selectedShopImage = null

    resetValidation(this.form)
    this.form.reset({
      shop_image:
        row.shop_image ?? '',

      subcategory:
        row.subcategory ?? '',

      filter:
        row.filter ?? '',

      item:
        row.item ?? '',

      description:
        row.description ?? '',

      measurement:
        row.measurement ?? '',

      actual_price:
        (row.actual_price == null || row.actual_price === '' ? null : Number(row.actual_price)),

      selling_price:
        (row.selling_price == null || row.selling_price === '' ? null : Number(row.selling_price)),

      available_time:
        row.available_time ?? '',

      discount_percentage:
        (row.discount_percentage == null || row.discount_percentage === '' ? null : Number(row.discount_percentage)),

      discount_amount:
        (row.discount_amount == null || row.discount_amount === '' ? null : Number(row.discount_amount)),
    })

    this.modalService.open(
      this.formModal(),
      {
        centered: true,
        size: 'lg',
        backdrop: 'static',
      },
    )
  }

  onShopImageSelected(
    event: Event,
  ): void {
    const input =
      event.target as HTMLInputElement

    const file =
      input.files?.[0]

    if (!file) {
      return
    }
    if (!checkImageFile(this.form.controls.shop_image, file, 'image/*')) return


    this.selectedShopImage = file

    this.form.controls.shop_image.setValue(
      file.name,
    )
  }

  onAction(
    event: DataTableActionEvent,
  ): void {
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

    const raw =
      this.form.getRawValue()

    const formData = new FormData()

    formData.append(
      'subcategory',
      raw.subcategory,
    )

    formData.append(
      'filter',
      raw.filter,
    )

    formData.append(
      'item',
      raw.item,
    )

    formData.append(
      'description',
      raw.description,
    )

    formData.append(
      'measurement',
      raw.measurement,
    )

    formData.append(
      'actual_price',
      String(raw.actual_price),
    )

    formData.append(
      'selling_price',
      String(raw.selling_price),
    )

    formData.append(
      'available_time',
      raw.available_time,
    )

    formData.append(
      'discount_percentage',
      String(
        raw.discount_percentage,
      ),
    )

    formData.append(
      'discount_amount',
      String(
        raw.discount_amount,
      ),
    )

    if (id) {
      formData.append(
        'id',
        String(id),
      )

      if (
        !this.selectedShopImage &&
        raw.shop_image
      ) {
        formData.append(
          'existing_shop_image',
          raw.shop_image,
        )
      }
    }

    if (this.selectedShopImage) {
      formData.append(
        'shop_image',
        this.selectedShopImage,
        this.selectedShopImage.name,
      )
    }

    this.saving.set(true)

    const request = id
      ? this.api.updateShopItem(formData)
      : this.api.addShopItem(formData)

    request.subscribe({
      next: (res) => {
        this.saving.set(false)

        if (res.status === 200) {
          this.notify.success(
            id
              ? 'Shop item updated'
              : 'Shop item added',
          )

          this.modalService.dismissAll()

          this.load()
        } else {
          this.notify.error(
            'Could not save shop item',
            res.message,
          )
        }
      },

      error: () => {
        this.saving.set(false)

        this.notify.error(
          'Could not save shop item',
          'Please try again.',
        )
      },
    })
  }

  toggleActive(
    row: any,
    checked: boolean,
  ): void {
    const value =
      checked ? 1 : 0

    this.api
      .updateShopItemActiveStatus({
        id: row.id,
        value,
      })
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            row.active_status =
              value

            this.notify.success(
              'Shop item status updated',
            )
          } else {
            this.notify.error(
              'Could not update status',
              res.message,
            )
          }
        },

        error: () => {
          this.notify.error(
            'Could not update status',
            'Please try again.',
          )
        },
      })
  }

  private async confirmDelete(
    row: any,
  ): Promise<void> {
    const confirmed =
      await this.notify.confirmDelete(
        `"${row.item}" will be permanently deleted.`,
      )

    if (!confirmed) {
      return
    }

    this.api
      .deleteShopItem(row.id)
      .subscribe({
        next: (res) => {
          if (res.status === 200) {
            this.notify.success(
              'Shop item deleted',
            )

            this.load()
          } else {
            this.notify.error(
              'Could not delete shop item',
              res.message,
            )
          }
        },

        error: () => {
          this.notify.error(
            'Could not delete shop item',
            'Please try again.',
          )
        },
      })
  }
}
