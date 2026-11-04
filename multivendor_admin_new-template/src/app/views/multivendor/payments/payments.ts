import {
Component,
computed,
inject,
OnInit,
signal,
TemplateRef,
ViewChild,
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
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
selector: 'app-mv-payments',
imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
templateUrl: './payments.html',
styles: ``,
})
export class Payments implements OnInit {
private api = inject(MultivendorService)
private notify = inject(NotifyService)
private fb = inject(FormBuilder)
private modalService = inject(NgbModal)

readonly rows = signal<any[]>([])
readonly loading = signal(true)
readonly selectedPayment = signal<any | null>(null)

@ViewChild('paymentDetailsModal')
paymentDetailsModal!: TemplateRef<any>

readonly totalPayments = computed(() => this.rows().length)

readonly successfulPayments = computed(() =>
this.rows().filter(
(row) => Number(row.payment_status) === 1
).length
)

readonly totalAmount = computed(() =>
this.rows().reduce(
(sum, row) => sum + Number(row.amount ?? 0),
0
)
)

readonly totalAmountLabel = computed(
() =>
'₹' +
this.totalAmount().toLocaleString('en-IN', {
minimumFractionDigits: 2,
maximumFractionDigits: 2,
})
)

/**

* Payments table columns
* These fields directly match the payments table.
  */
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
  width: '15%',
  },
  ]

/**

* Only View action
  */
  readonly actions: DataTableAction[] = [
  {
  key: 'view',
  icon: 'eye',
  label: 'View',
  },
  ]

/**

* Filters matching the payments table.
  */
  readonly filters = this.fb.nonNullable.group({
  payment_gateway: [null as string | null],
  payment_status: [null as number | null],
  from_date: [''],
  to_date: [''],
  })

ngOnInit(): void {
this.load()
}

load(): void {
this.loading.set(true)

const {
  payment_gateway,
  payment_status,
  from_date,
  to_date,
} = this.filters.getRawValue()

const payload: Record<string, unknown> = {}

if (payment_gateway) {
  payload['payment_gateway'] = payment_gateway
}

if (payment_status !== null && payment_status !== undefined) {
  payload['payment_status'] = payment_status
}

if (from_date) {
  payload['from_date'] = from_date
}

if (to_date) {
  payload['to_date'] = to_date
}

this.api.getPayments(payload).subscribe({
  next: (res) => {
    this.loading.set(false)

    if (res.status === 200) {
      const payments = (res.data ?? []).map((payment: any) => ({
        ...payment,
        payment_status_label:
          this.getPaymentStatusLabel(
            payment.payment_status
          ),
      }))

      this.rows.set(payments)
    } else {
      this.rows.set([])

      this.notify.error(
        'Could not load payments',
        res.message
      )
    }
  },

  error: () => {
    this.loading.set(false)
    this.rows.set([])

    this.notify.error(
      'Could not load payments',
      'Please try again.'
    )
  },
})

}

/**

* Convert payment_status number into readable text.
  */
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

/**

* View payment details.
  */
  onAction(event: any): void {
  if (event.key === 'view') {
  this.selectedPayment.set(event.row)

  this.modalService.open(this.paymentDetailsModal, {
  centered: true,
  size: 'lg',
  backdrop: 'static',
  })
  }
  }

/**

* Reset payment filters.
  */
  resetFilters(): void {
  this.filters.reset({
  payment_gateway: null,
  payment_status: null,
  from_date: '',
  to_date: '',
  })

this.load()

}
}
