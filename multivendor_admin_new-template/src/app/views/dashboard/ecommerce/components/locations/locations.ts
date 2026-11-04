import { Icon } from '@/app/components/icon/icon'
import { VectorMap } from '@/app/components/vector-map/vector-map'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import 'jsvectormap/dist/maps/world-merc.js'
import { countryData, getRevenueLocationOptions } from '../../data'

@Component({
  selector: 'app-locations',
  imports: [Icon, RouterLink, NgbDropdownModule, VectorMap, CommonModule],
  templateUrl: './locations.html',
  styles: ``,
})
export class Locations {
  countryData = countryData
  getRevenueLocationOptions = getRevenueLocationOptions
}
