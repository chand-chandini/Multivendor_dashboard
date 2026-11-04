import { Icon } from '@/app/components/icon/icon'
import { VectorMap } from '@/app/components/vector-map/vector-map'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule, NgbProgressbarModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import 'jsvectormap/dist/maps/world.js'
import { countryData, getSessionByCountryChartOptions } from '../../data'

@Component({
  selector: 'app-user-geography',
  imports: [NgbTooltipModule, Icon, RouterLink, NgbDropdownModule, NgbProgressbarModule, VectorMap],
  templateUrl: './user-geography.html',
  styles: ``,
})
export class UserGeography {
  countryData = countryData
  getSessionByCountryChartOptions = getSessionByCountryChartOptions
}
