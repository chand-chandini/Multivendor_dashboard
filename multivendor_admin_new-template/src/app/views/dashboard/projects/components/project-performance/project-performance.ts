import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { dashProjectsOverview, performanceData } from '../../data'

@Component({
  selector: 'app-project-performance',
  imports: [Icon, RouterLink, CountUpDirective, Apexchart, NgbDropdownModule],
  templateUrl: './project-performance.html',
  styles: ``,
})
export class ProjectPerformance {
  performanceData = performanceData
  dashProjectsOverview = dashProjectsOverview
  Number = Number
}
