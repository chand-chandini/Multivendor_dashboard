import { Component, OnInit, inject, signal } from '@angular/core'
import { DataTable, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'

type SettlementTab = 'settlements' | 'history'

@Component({
  selector: 'app-mv-cod-settlements',
  imports: [PageBreadcrumb, DataTable],
  templateUrl: './cod-settlements.html',
  styles: ``,
})
export class CodSettlements implements OnInit {
  private api = inject(MultivendorService)
  private notify = inject(NotifyService)

  readonly activeTab = signal<SettlementTab>('settlements')

  readonly settlements = signal<any[]>([])
  readonly history = signal<any[]>([])
  readonly loading = signal(true)
readonly payingId = signal<number | null>(null)
readonly settlementActions = [
  {
    key: 'pay',
    icon: 'ri-bank-card-line',
    label: 'Pay',
    className: 'btn btn-sm btn-success',
  },
]
  readonly settlementColumns: DataTableColumn[] = [
    {
      key: 'settlement_period_start',
      label: 'Date',
      type: 'date',
      width: '15%',
    },
    {
      key: 'delivery_partner_name',
      label: 'Name',
      width: '20%',
    },
    {
      key: 'mobile_number',
      label: 'Phone Number',
      width: '18%',
    },
    {
      key: 'total_orders',
      label: 'COD Orders',
      width: '13%',
      align: 'center',
    },
    {
      key: 'cod_amount_collected',
      label: 'COD Amount',
      type: 'currency',
      width: '17%',
      align: 'end',
    },
    {
      key: 'net_payable',
      label: 'Pay Amount',
      type: 'currency',
      width: '17%',
      align: 'end',
    },
   
  ]

  readonly historyColumns: DataTableColumn[] = [
    {
      key: 'paid_at',
      label: 'Settled Date',
      type: 'date',
      width: '14%',
    },
    {
      key: 'order_date',
      label: 'Order Date',
      type: 'date',
      width: '14%',
    },
    {
      key: 'delivery_partner_name',
      label: 'Name',
      width: '16%',
    },
    {
      key: 'mobile_number',
      label: 'Phone Number',
      width: '16%',
    },
    {
      key: 'total_orders',
      label: 'COD Orders',
      width: '12%',
      align: 'center',
    },
    {
      key: 'net_payable',
      label: 'Amount',
      type: 'currency',
      width: '14%',
      align: 'end',
    },
    {
      key: 'profile_image',
      label: 'Image',
      type: 'image',
      width: '14%',
      sortable: false,
      align: 'center',
    },
  ]

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)

    this.api.getCodSettlements().subscribe({
      next: (res) => {
        this.loading.set(false)

        if (res.status === 200) {
         this.settlements.set(res['settlements'] ?? [])
this.history.set(res['history'] ?? [])
        } else {
          this.settlements.set([])
          this.history.set([])

          this.notify.error(
            'Could not load COD settlements',
            res.message
          )
        }
      },

      error: () => {
        this.loading.set(false)
        this.settlements.set([])
        this.history.set([])

        this.notify.error(
          'Could not load COD settlements',
          'Please try again.'
        )
      },
    })
  }

  selectTab(tab: SettlementTab): void {
    this.activeTab.set(tab)
  }
  onSettlementAction(event: { key: string; row: any }): void {
  if (event.key === 'pay') {
    this.paySettlement(event.row)
  }
}
  paySettlement(row: any): void {
  const settlementId = Number(row.id)

  if (!settlementId) {
    this.notify.error('Payment failed', 'Settlement ID is missing.')
    return
  }

  this.payingId.set(settlementId)

  this.api.payCodSettlement(settlementId).subscribe({
    next: (res) => {
      this.payingId.set(null)

      if (res.status === 200) {
     this.notify.success('COD settlement has been paid.')

        this.load()
      } else {
        this.notify.error(
          'Payment failed',
          res.message || 'Could not settle the payment.'
        )
      }
    },

    error: () => {
      this.payingId.set(null)

      this.notify.error(
        'Payment failed',
        'Please try again.'
      )
    },
  })
}
}