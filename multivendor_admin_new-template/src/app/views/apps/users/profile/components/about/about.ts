import { Component } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { timelineData } from '../../data'
import { TaskOverview } from '../task-overview/task-overview'

@Component({
  selector: 'app-about',
  imports: [TaskOverview, Icon],
  templateUrl: './about.html',
  styles: ``,
})
export class About {
  timelineData = timelineData
}
