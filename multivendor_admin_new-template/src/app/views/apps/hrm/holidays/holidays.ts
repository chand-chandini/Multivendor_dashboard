import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { HolidayTable } from './components/holiday-table/holiday-table'
import { HolidayWidget } from './components/holiday-widget/holiday-widget'
import { holidayStatData } from './data'

@Component({
  selector: 'app-holidays',
  imports: [PageBreadcrumb, HolidayWidget, HolidayTable],
  templateUrl: './holidays.html',
  styles: ``,
})
export class Holidays {
  holidayStatData = holidayStatData
}
