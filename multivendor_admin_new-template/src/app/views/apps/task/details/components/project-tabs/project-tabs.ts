import { Component } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { Activity } from '../activity/activity'
import { Comments } from '../comments/comments'

@Component({
  selector: 'app-project-tabs',
  imports: [Icon, NgbNavModule, Comments, Activity],
  templateUrl: './project-tabs.html',
  styles: ``,
})
export class ProjectTabs {
  active = 1
}
