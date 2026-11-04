import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { solarBrokenIconData } from './data'

@Component({
  selector: 'app-solar-broken',
  imports: [PageBreadcrumb],
  templateUrl: './solar-broken.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SolarBroken {
  solarBrokenIconData = solarBrokenIconData
}
