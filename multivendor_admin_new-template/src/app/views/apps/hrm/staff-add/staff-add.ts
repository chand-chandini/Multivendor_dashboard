import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { FlatpickrDirective } from 'angularx-flatpickr'

@Component({
  selector: 'app-staff-add',
  imports: [PageBreadcrumb, NgbNavModule, FlatpickrDirective],
  templateUrl: './staff-add.html',
  styles: ``,
})
export class StaffAdd {
  active = 1
  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }
}
