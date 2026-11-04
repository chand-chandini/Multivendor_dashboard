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
  selector: 'app-mv-payment-history',
  imports: [
    PageBreadcrumb,
    DataTable,
    ReactiveFormsModule,
  ],
  templateUrl: './payment-history.html',
  styles: ``,
})
export class PaymentHistory implements OnInit {
  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly rows = signal<any[]>([])
  readonly loading = signal(true)

  readonly locations = signal<any[]>([])
  readonly categories = signal<any[]>([])
  readonly vendors = signal<any[]>([])

  readonly selectedSettlement = signal<any | null>(null)

  readonly detailsModal =
    viewChild.required<TemplateRef<any>>('detailsModal')

  readonly filterForm = this.fb.nonNullable.group({
    from_date: [''],
    to_date: [''],
    location_id: [''],
    category_id: [''],
    vendor_id: [''],
  })

readonly columns: DataTableColumn[] = [
  {
    key: 'id',
    label: 'Payment ID',
    width: '10%',
    align: 'center',
  },
  {
    key: 'order_id',
    label: 'Order ID',
    width: '12%',
    align: 'center',
  },
  {
    key: 'payment_gateway',
    label: 'Payment Gateway',
    width: '15%',
  },
  {
    key: 'gateway_payment_id',
    label: 'Gateway Payment ID',
    width: '18%',
  },
  {
    key: 'amount',
    label: 'Amount',
    type: 'currency',
    width: '12%',
    align: 'end',
  },
  {
    key: 'currency',
    label: 'Currency',
    width: '10%',
    align: 'center',
  },
  {
    key: 'payment_status_label',
    label: 'Payment Status',
    width: '13%',
  },
  {
    key: 'paid_at',
    label: 'Paid At',
    type: 'datetime',
    width: '15%',
  },
]

  readonly actions: DataTableAction[] = [
    {
      key: 'view',
      icon: 'eye',
      label: 'View details',
    },
  ]

  ngOnInit(): void {
    this.load()

    this.api.getLocations().subscribe({
      next: (res) => {
        this.locations.set(
          res.status === 200 ? (res.data ?? []) : []
        )
      },
      error: () => this.locations.set([]),
    })

    this.api.getCategories().subscribe({
      next: (res) => {
        this.categories.set(
          res.status === 200 ? (res.data ?? []) : []
        )
      },
      error: () => this.categories.set([]),
    })

    this.api.getVendors().subscribe({
      next: (res) => {
        this.vendors.set(
          res.status === 200 ? (res.data ?? []) : []
        )
      },
      error: () => this.vendors.set([]),
    })
  }

  load(): void {
    const filters = this.filterForm.getRawValue()

    if (
      (filters.from_date && !filters.to_date) ||
      (!filters.from_date && filters.to_date)
    ) {
      this.notify.error(
        'Incomplete date range',
        'Enter both From Date and To Date.'
      )
      return
    }

    this.loading.set(true)

    const payload: Record<string, unknown> = {}

    if (filters.from_date && filters.to_date) {
      payload['from_date'] = filters.from_date
      payload['to_date'] = filters.to_date
    }

    if (filters.location_id) {
      payload['location_id'] = Number(filters.location_id)
    }

    if (filters.category_id) {
      payload['category_id'] = Number(filters.category_id)
    }

    if (filters.vendor_id) {
      payload['vendor_id'] = Number(filters.vendor_id)
    }

this.api.getPayments(payload).subscribe({
        next: (res) => {
        this.loading.set(false)

        if (res.status === 200) {
          const data = res.data ?? []

        this.rows.set(
  data.map((row: any) => ({
    ...row,

    payment_status_label:
      this.getPaymentStatusLabel(row.payment_status),
  }))
)
        } else {
          this.rows.set([])

          this.notify.error(
            'Could not load payment history',
            res.message
          )
        }
      },

      error: () => {
        this.loading.set(false)
        this.rows.set([])

        this.notify.error(
          'Could not load payment history',
          'Please try again.'
        )
      },
    })
  }
private getPaymentStatusLabel(status: any): string {
  switch (Number(status)) {
    case 0:
      return 'Pending'
    case 1:
      return 'Success'
    case 2:
      return 'Failed'
    case 3:
      return 'Refunded'
    default:
      return '-'
  }
}
  resetFilters(): void {
    this.filterForm.reset({
      from_date: '',
      to_date: '',
      location_id: '',
      category_id: '',
      vendor_id: '',
    })

    this.load()
  }

  private formatDate(value: any): string {
    if (!value) return '-'

    const date = new Date(value)

    if (Number.isNaN(date.getTime())) {
      return String(value)
    }

    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'view') {
      this.openDetails(event.row)
    }
  }

  openDetails(row: any): void {
    this.selectedSettlement.set(row)

    this.modalService.open(this.detailsModal(), {
      centered: true,
      size: 'lg',
      scrollable: true,
    })
  }
}