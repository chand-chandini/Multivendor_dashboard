import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { FlatpickrDirective, provideFlatpickrDefaults } from 'angularx-flatpickr'
import dayjs, { Dayjs } from 'dayjs'
import { ColorEvent } from 'ngx-color'
import { ColorChromeModule } from 'ngx-color/chrome'
import { ColorSketchModule } from 'ngx-color/sketch'
import { ColorSliderModule } from 'ngx-color/slider'
import { ColorTwitterModule } from 'ngx-color/twitter'
import { NgxDaterangepickerBootstrapDirective } from 'ngx-daterangepicker-bootstrap'

@Component({
  selector: 'app-pickers',
  imports: [FlatpickrDirective, FormsModule, ColorSketchModule, ColorChromeModule, ColorSliderModule, ColorTwitterModule, NgxDaterangepickerBootstrapDirective, PageBreadcrumb, Icon],
  providers: [provideFlatpickrDefaults()],
  templateUrl: './pickers.html',
  styles: ``,
})
export class Pickers {
  date = dayjs().startOf('day')
  date2 = dayjs().startOf('day')
  date3 = dayjs().startOf('day')

  basicDate = new Date()
  disableDate = new Date()
  multipleDate = new Date()
  dateTime = new Date()
  humanFriendlyDate = new Date()
  timepicker = new Date()

  color = '#2889e9'

  selectedRangeCalendarTimeRight = dayjs().startOf('day')
  localeTime = {
    firstDay: 1,
    startDate: dayjs().startOf('day'),
    endDate: dayjs().endOf('day'),
    format: 'DD.MM.YYYY HH:mm:ss',
    applyLabel: 'Apply',
    cancelLabel: 'Cancel',
    fromLabel: 'From',
    toLabel: 'To',
  }

  ranges: Record<string, [Dayjs, Dayjs]> = {
    Today: [dayjs().startOf('day'), dayjs().endOf('day')],
    Yesterday: [dayjs().startOf('day').subtract(1, 'day'), dayjs().endOf('day').subtract(1, 'day')],
    'Last 7 days': [dayjs().startOf('day').subtract(6, 'days'), dayjs().endOf('day')],
    'Last 30 days': [dayjs().startOf('day').subtract(29, 'days'), dayjs().endOf('day')],
    'This month': [dayjs().startOf('month'), dayjs().endOf('month')],
    'Last month': [dayjs().startOf('month').subtract(1, 'month'), dayjs().endOf('month').subtract(1, 'month')],
  }

  onColorChange($event: ColorEvent): void {
    console.log('Selected Color:', $event)
    this.color = $event.color.hex
  }
}
