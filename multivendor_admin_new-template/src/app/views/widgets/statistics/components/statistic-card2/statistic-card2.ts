import { Icon } from '@/app/components/icon/icon'
import { Component, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { SummaryType } from '../../data'

@Component({
  selector: 'app-statistic-card2',
  imports: [Icon, CountUpDirective],
  templateUrl: './statistic-card2.html',
  styles: ``,
})
export class StatisticCard2 {
  @Input() item!: SummaryType
  Number = Number
}
