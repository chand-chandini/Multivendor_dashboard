import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Component, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { RevenueStatisticType } from '../../data'

@Component({
  selector: 'app-statistic-widget-chart-right',
  imports: [CountUpDirective, Apexchart],
  templateUrl: './statistic-widget-chart-right.html',
  styles: ``,
})
export class StatisticWidgetChartRight {
  @Input() item!: RevenueStatisticType
}
