import { CardWithAction } from '@/app/components/card-with-action/card-with-action'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { topCountryData } from '../../data'

@Component({
  selector: 'app-top-countries',
  imports: [RouterLink, CardWithAction],
  templateUrl: './top-countries.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TopCountries {
  topCountryData = topCountryData
}
