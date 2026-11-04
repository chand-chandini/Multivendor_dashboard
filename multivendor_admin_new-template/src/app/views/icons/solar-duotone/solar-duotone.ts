import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { solarDuotoneIconData } from './data'

@Component({
  selector: 'app-solar-duotone',
  imports: [PageBreadcrumb],
  templateUrl: './solar-duotone.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class SolarDuotone {
  solarDuotoneIconData = solarDuotoneIconData
}
