import { Icon } from '@/app/components/icon/icon'
import { Component, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { StatType } from '../../data'

@Component({
  selector: 'app-statistic-card6',
  imports: [Icon, CountUpDirective],
  templateUrl: './statistic-card6.html',
  styles: ``,
})
export class StatisticCard6 {
  @Input() item!: StatType
  Number = Number
}
