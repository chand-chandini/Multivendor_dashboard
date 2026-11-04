import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { Component } from '@angular/core'
import { FinancialOverview } from './components/financial-overview/financial-overview'
import { ProjectStatus } from './components/project-status/project-status'
import { ProjectsPerformance } from './components/projects-performance/projects-performance'
import { SalesReport } from './components/sales-report/sales-report'
import { StatisticCard1 } from './components/statistic-card1/statistic-card1'
import { StatisticWidgetChartLeft } from './components/statistic-widget-chart-left/statistic-widget-chart-left'
import { StatisticWidgetChartRight } from './components/statistic-widget-chart-right/statistic-widget-chart-right'
import { StorePerformance } from './components/store-performance/store-performance'
import { revenueStatisticData, statData } from './data'

@Component({
  selector: 'app-charts',
  imports: [PageBreadcrumb, StatisticCard1, StatisticWidgetChartRight, StatisticWidgetChartLeft, ProjectStatus, ProjectsPerformance, StorePerformance, SalesReport, FinancialOverview],
  templateUrl: './charts.html',
  styles: ``,
})
export class Charts {
  statData = statData
  revenueStatisticData = revenueStatisticData
}
