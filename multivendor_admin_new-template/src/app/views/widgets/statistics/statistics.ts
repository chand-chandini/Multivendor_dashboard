import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { StatisticCard1 } from './components/statistic-card1/statistic-card1'
import { StatisticCard2 } from './components/statistic-card2/statistic-card2'
import { StatisticCard3 } from './components/statistic-card3/statistic-card3'
import { StatisticCard4 } from './components/statistic-card4/statistic-card4'
import { StatisticCard5 } from './components/statistic-card5/statistic-card5'
import { StatisticCard6 } from './components/statistic-card6/statistic-card6'
import { StatisticCard7 } from './components/statistic-card7/statistic-card7'
import { StatisticCard8 } from './components/statistic-card8/statistic-card8'
import { businessStatData, dealStatData, metricData, miniStatData, progressData, statData, summaryData } from './data'

@Component({
  selector: 'app-statistics',
  imports: [PageBreadcrumb, StatisticCard1, StatisticCard2, StatisticCard3, StatisticCard4, StatisticCard5, StatisticCard6, StatisticCard7, StatisticCard8],
  templateUrl: './statistics.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Statistics {
  summaryData = summaryData
  progressData = progressData
  metricData = metricData
  dealStatData = dealStatData
  statData = statData
  miniStatData = miniStatData
  businessStatData = businessStatData
}
