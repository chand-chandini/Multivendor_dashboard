import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { SimplebarAngularModule } from 'simplebar-angular'
import { countryWeatherData } from '../../data'

@Component({
  selector: 'app-weather-by-country',
  imports: [RouterLink, NgbDropdownModule, SimplebarAngularModule],
  templateUrl: './weather-by-country.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class WeatherByCountry {
  countryWeatherData = countryWeatherData
}
