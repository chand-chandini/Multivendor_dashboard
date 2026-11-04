import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { HolidayStatType } from '../../data'

@Component({
  selector: 'app-holiday-widget',
  imports: [Icon],
  templateUrl: './holiday-widget.html',
  styles: ``,
})
export class HolidayWidget {
  @Input() item!: HolidayStatType
}
