import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { boxIconData } from './data'

@Component({
  selector: 'app-boxicons',
  imports: [PageBreadcrumb],
  templateUrl: './boxicons.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Boxicons {
  boxIconData = boxIconData
}
