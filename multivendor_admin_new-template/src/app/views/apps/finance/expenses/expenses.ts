import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { ExpensesTable } from './components/expenses-table/expenses-table'
import { ExpensesWidget } from './components/expenses-widget/expenses-widget'
import { expenseStatData } from './data'

@Component({
  selector: 'app-expenses',
  imports: [PageBreadcrumb, ExpensesWidget, ExpensesTable],
  templateUrl: './expenses.html',
  styles: ``,
})
export class Expenses {
  expenseStatData = expenseStatData
}
