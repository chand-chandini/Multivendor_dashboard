import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { Component } from '@angular/core'
import { OngoingProject } from './components/ongoing-project/ongoing-project'
import { ProjectPerformance } from './components/project-performance/project-performance'
import { ProjectStat } from './components/project-stat/project-stat'
import { ProjectStatus } from './components/project-status/project-status'
import { Schedule } from './components/schedule/schedule'
import { Task } from './components/task/task'

@Component({
  selector: 'app-projects',
  imports: [PageBreadcrumb, ProjectStat, ProjectStatus, ProjectPerformance, Schedule, OngoingProject, Task],
  templateUrl: './projects.html',
  styles: ``,
})
export class Projects {}
