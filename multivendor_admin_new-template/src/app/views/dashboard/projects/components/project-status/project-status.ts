import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { projectStatusChart } from '../../data'

@Component({
  selector: 'app-project-status',
  imports: [Icon, RouterLink, Apexchart, NgbDropdownModule],
  templateUrl: './project-status.html',
  styles: ``,
})
export class ProjectStatus {
  projectStatusChart = projectStatusChart
}
