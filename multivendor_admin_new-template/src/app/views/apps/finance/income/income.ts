import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { IncomeTable } from './components/income-table/income-table'
import { IncomeWidget } from './components/income-widget/income-widget'
import { incomeStatData } from './data'

@Component({
  selector: 'app-income',
  imports: [PageBreadcrumb, IncomeWidget, IncomeTable],
  templateUrl: './income.html',
  styles: ``,
})
export class Income {
  incomeStatData = incomeStatData
}
