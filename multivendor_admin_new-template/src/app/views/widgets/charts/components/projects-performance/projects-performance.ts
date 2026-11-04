import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { dashProjectsOverviewChart, performanceData } from '../../data'

@Component({
  selector: 'app-projects-performance',
  imports: [Icon, RouterLink, NgbDropdownModule, CountUpDirective, Apexchart],
  templateUrl: './projects-performance.html',
  styles: ``,
})
export class ProjectsPerformance {
  performanceData = performanceData
  Number = Number
  dashProjectsOverviewChart = dashProjectsOverviewChart
}
