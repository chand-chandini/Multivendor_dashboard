import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { AttendanceStatType } from '../../data'

@Component({
  selector: 'app-attendance-widget',
  imports: [Icon],
  templateUrl: './attendance-widget.html',
  styles: ``,
})
export class AttendanceWidget {
  @Input() attendance!: AttendanceStatType
}
