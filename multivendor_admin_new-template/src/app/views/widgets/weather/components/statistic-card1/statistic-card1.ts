import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { WeatherStatType } from '../../data'

@Component({
  selector: 'app-statistic-card1',
  imports: [CommonModule],
  templateUrl: './statistic-card1.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatisticCard1 {
  @Input() item!: WeatherStatType
}
