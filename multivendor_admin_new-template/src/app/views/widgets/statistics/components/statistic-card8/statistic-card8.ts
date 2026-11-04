import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { BusinessStatType } from '../../data'

@Component({
  selector: 'app-statistic-card8',
  imports: [CountUpDirective],
  templateUrl: './statistic-card8.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatisticCard8 {
  @Input() item!: BusinessStatType
  Number = Number
}
