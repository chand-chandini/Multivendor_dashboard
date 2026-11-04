import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { StatisticCard1 } from './components/statistic-card1/statistic-card1'
import { StatisticCard2 } from './components/statistic-card2/statistic-card2'
import { StatisticCard3 } from './components/statistic-card3/statistic-card3'
import { StatisticCard4 } from './components/statistic-card4/statistic-card4'
import { TopCitiesWeather } from './components/top-cities-weather/top-cities-weather'
import { WeatherByCountry } from './components/weather-by-country/weather-by-country'
import { weatherData, weatherStatData } from './data'

@Component({
  selector: 'app-weather',
  imports: [PageBreadcrumb, StatisticCard1, StatisticCard2, StatisticCard3, WeatherByCountry, StatisticCard4, TopCitiesWeather],
  templateUrl: './weather.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Weather {
  weatherStatData = weatherStatData
  weatherData = weatherData
}
