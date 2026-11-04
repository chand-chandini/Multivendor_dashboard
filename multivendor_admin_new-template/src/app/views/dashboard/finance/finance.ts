import { Icon } from '@/app/components/icon/icon'
import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbAlert } from '@ng-bootstrap/ng-bootstrap'
import { BalanceInfo } from './components/balance-info/balance-info'
import { FinanceStat } from './components/finance-stat/finance-stat'
import { FinancialOverview } from './components/financial-overview/financial-overview'
import { FinancialStatistics } from './components/financial-statistics/financial-statistics'
import { RecentTransactions } from './components/recent-transactions/recent-transactions'
import { TargetStat } from './components/target-stat/target-stat'
import { financeStatData, targetData } from './data'

@Component({
  selector: 'app-finance',
  imports: [RouterLink, NgbAlert, Icon, BalanceInfo, FinancialOverview, FinancialStatistics, RecentTransactions, TargetStat, PageBreadcrumb, FinanceStat],
  templateUrl: './finance.html',
  styles: ``,
})
export class Finance {
  username = META_DATA.username
  showAlert = true
  financeStatData = financeStatData
  targetData = targetData
}
