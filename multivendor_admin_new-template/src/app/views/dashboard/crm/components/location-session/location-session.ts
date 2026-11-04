import { Icon } from '@/app/components/icon/icon'
import { VectorMap } from '@/app/components/vector-map/vector-map'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import 'jsvectormap/dist/maps/world.js'
import { countryData, getSessionByCountryOptions } from '../../data'

@Component({
  selector: 'app-location-session',
  imports: [Icon, RouterLink, NgbDropdownModule, VectorMap],
  templateUrl: './location-session.html',
  styles: ``,
})
export class LocationSession {
  countryData = countryData
  getSessionByCountryOptions = getSessionByCountryOptions
}
