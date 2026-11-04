import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { WeatherType } from '../../data'

@Component({
  selector: 'app-statistic-card2',
  imports: [],
  templateUrl: './statistic-card2.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatisticCard2 {
  @Input() item!: WeatherType
}
