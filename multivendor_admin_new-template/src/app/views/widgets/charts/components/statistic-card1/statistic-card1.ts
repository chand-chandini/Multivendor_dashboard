import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { StatType } from '../../data'

@Component({
  selector: 'app-statistic-card1',
  imports: [Icon, CountUpDirective, Apexchart],
  templateUrl: './statistic-card1.html',
  styles: ``,
})
export class StatisticCard1 {
  @Input() item!: StatType
  @Input() index!: number
  Number = Number
}
