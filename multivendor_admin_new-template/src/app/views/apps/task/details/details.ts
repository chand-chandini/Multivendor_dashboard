import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { ProjectTabs } from './components/project-tabs/project-tabs'
import { TaskSidebar } from './components/task-sidebar/task-sidebar'

@Component({
  selector: 'app-details',
  imports: [PageBreadcrumb, TaskSidebar, ProjectTabs, RouterLink, Icon],
  templateUrl: './details.html',
  styles: ``,
})
export class Details {}
