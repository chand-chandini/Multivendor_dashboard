import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Component, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { RevenueStatisticType } from '../../data'

@Component({
  selector: 'app-statistic-widget-chart-left',
  imports: [CountUpDirective, Apexchart],
  templateUrl: './statistic-widget-chart-left.html',
  styles: ``,
})
export class StatisticWidgetChartLeft {
  @Input() item!: RevenueStatisticType
}
