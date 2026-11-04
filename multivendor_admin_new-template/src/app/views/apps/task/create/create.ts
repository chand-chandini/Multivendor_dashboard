import { Component } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { FlatpickrDirective } from 'angularx-flatpickr'

@Component({
  selector: 'app-create',
  imports: [PageBreadcrumb, Icon, FlatpickrDirective],
  templateUrl: './create.html',
  styles: ``,
})
export class Create {
  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }
}
