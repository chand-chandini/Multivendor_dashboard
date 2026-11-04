import { CardWithAction } from '@/app/components/card-with-action/card-with-action'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { trafficData } from '../../data'

@Component({
  selector: 'app-traffic-sources',
  imports: [RouterLink, CountUpDirective, CardWithAction, NgbProgressbarModule],
  templateUrl: './traffic-sources.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class TrafficSources {
  trafficData = trafficData
}
