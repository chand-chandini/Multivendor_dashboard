import {
  Component,
  OnInit,
  TemplateRef,
  ViewChild,
  inject,
  signal,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  DataTable,
  DataTableAction,
  DataTableColumn,
} from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-mv-delivery-boy-payments',
imports: [PageBreadcrumb, DataTable, FormsModule],
  templateUrl: './delivery-boy-payments.html',
  styles: ``,
})
export class DeliveryBoyPayments implements OnInit {
  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)

  readonly rows = signal<any[]>([])
  readonly loading = signal(true)
  readonly selectedPayment = signal<any | null>(null)
readonly locations = signal<any[]>([])
selectedLocationId = ''
 readonly columns: DataTableColumn[] = [
  {
    key: 'delivery_partner_name',
    label: 'Delivery Boy',
    width: '17%',
  },
  {
    key: 'mobile_number',
    label: 'Phone Number',
    width: '14%',
  },
  {
    key: 'settlement_period_start',
    label: 'Dates',
    width: '16%',
    format: (value, row) => {
      const from = row.settlement_period_start || '-'
      const to = row.settlement_period_end || '-'

      return `${from} - ${to}`
    },
  },
  {
    key: 'total_amount',
    label: 'Total Amount',
    type: 'currency',
    width: '13%',
    align: 'end',
  },
  {
    key: 'total_orders',
    label: 'Total Orders',
    width: '11%',
    align: 'center',
  },
  {
    key: 'amount_per_order',
    label: 'Amount Per Order',
    type: 'currency',
    width: '13%',
    align: 'end',
  },
  {
    key: 'net_pay',
    label: 'Net Pay',
    type: 'currency',
    width: '11%',
    align: 'end',
  },
]

 readonly actions: DataTableAction[] = [
  {
    key: 'view',
    icon: 'eye',
    label: 'View',
    className: 'text-primary',
  },
]

ngOnInit(): void {
  this.loadLocations()
  this.load()
}
loadLocations(): void {
  this.api.getLocations().subscribe({
    next: (res) => {
      if (res.status === 200) {
        this.locations.set(res.data ?? [])
      } else {
        this.locations.set([])
      }
    },
    error: () => {
      this.locations.set([])
    },
  })
}
  load(): void {
    this.loading.set(true)

this.api.getDeliveryBoyPayments({
  location_id: this.selectedLocationId || '',
}).subscribe({
          next: (res) => {
        this.loading.set(false)

        if (res.status === 200) {
          this.rows.set(res.data ?? [])
        } else {
          this.rows.set([])

          this.notify.error(
            'Could not load delivery boy payments',
            res.message
          )
        }
      },

      error: () => {
        this.loading.set(false)
        this.rows.set([])

        this.notify.error(
          'Could not load delivery boy payments',
          'Please try again.'
        )
      },
    })
  }

  onAction(event: any): void {
    if (event.key === 'view') {
      this.selectedPayment.set(event.row)

     this.modalService.open(
  this.paymentDetailsModal,
  {
    centered: true,
    size: 'lg',
    backdrop: 'static',
  }
)
    }
  }

@ViewChild('paymentDetailsModal')
paymentDetailsModal!: TemplateRef<any>
}