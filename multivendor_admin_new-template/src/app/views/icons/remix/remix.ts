import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { remixIconData } from './data'

@Component({
  selector: 'app-remix',
  imports: [PageBreadcrumb],
  templateUrl: './remix.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class Remix {
  remixIconData = remixIconData
}
