import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { insightData, totalSalesChart } from '../../data'

@Component({
  selector: 'app-store-performance',
  imports: [Apexchart, RouterLink, Icon],
  templateUrl: './store-performance.html',
  styles: ``,
})
export class StorePerformance {
  insightData = insightData
  totalSalesChart = totalSalesChart
}
