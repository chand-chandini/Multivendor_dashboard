import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { trafficSourceData } from '../../data'

@Component({
  selector: 'app-traffic-sources',
  imports: [Icon, RouterLink, NgbDropdownModule, NgbTooltipModule],
  templateUrl: './traffic-sources.html',
  styles: ``,
})
export class TrafficSources {
  trafficSourceData = trafficSourceData

  chunkArray = <T>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))
  }

  sourcesChunks = this.chunkArray(trafficSourceData, 5)
}
