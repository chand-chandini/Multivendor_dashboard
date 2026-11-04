import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { weeklyPerformanceChart } from '../../data'

@Component({
  selector: 'app-weekly-performance',
  imports: [Apexchart, Icon, RouterLink, NgbDropdownModule],
  templateUrl: './weekly-performance.html',
  styles: ``,
})
export class WeeklyPerformance {
  weeklyPerformanceChart = weeklyPerformanceChart
}
