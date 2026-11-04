import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { cityWeatherData } from '../../data'

@Component({
  selector: 'app-statistic-card4',
  imports: [CommonModule],
  templateUrl: './statistic-card4.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatisticCard4 {
  cityWeatherData = cityWeatherData
}
