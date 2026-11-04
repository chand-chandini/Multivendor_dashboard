import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { hourlyWeatherData } from '../../data'

@Component({
  selector: 'app-statistic-card3',
  imports: [NgbNavModule],
  templateUrl: './statistic-card3.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatisticCard3 {
  hourlyWeatherData = hourlyWeatherData
  activeTab = 'today'
}
