import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { FlatpickrDirective } from 'angularx-flatpickr'
import { scheduleData } from '../../data'

@Component({
  selector: 'app-schedule',
  imports: [RouterLink, Icon, FlatpickrDirective],
  templateUrl: './schedule.html',
  styles: ``,
})
export class Schedule {
  scheduleData = scheduleData

  flatpickrOptions = {
    inline: true,
    noCalendar: false,
    dateFormat: 'd M, Y',
    defaultDate: 'today',
    allowInput: false,
    monthSelectorType: 'dropdown' as const,
  }
}
