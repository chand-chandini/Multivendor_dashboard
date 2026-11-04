import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { LeaveStatType } from '../../data'

@Component({
  selector: 'app-leaves-widget',
  imports: [Icon],
  templateUrl: './leaves-widget.html',
  styles: ``,
})
export class LeavesWidget {
  @Input() leave!: LeaveStatType
}
