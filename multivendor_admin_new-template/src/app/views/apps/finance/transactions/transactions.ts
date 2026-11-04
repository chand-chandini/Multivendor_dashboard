import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { TransactionsTable } from './components/transactions-table/transactions-table'
import { TransactionsWidget } from './components/transactions-widget/transactions-widget'
import { transactionStatData } from './data'

@Component({
  selector: 'app-transactions',
  imports: [PageBreadcrumb, TransactionsWidget, TransactionsTable],
  templateUrl: './transactions.html',
  styles: ``,
})
export class Transactions {
  transactionStatData = transactionStatData
}
