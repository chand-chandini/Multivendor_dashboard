import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { MiniStatType } from '../../data'

@Component({
  selector: 'app-statistic-card7',
  imports: [CountUpDirective],
  templateUrl: './statistic-card7.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatisticCard7 {
  @Input() item!: MiniStatType
  Number = Number
}
