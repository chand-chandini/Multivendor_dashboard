import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component, OnDestroy, OnInit } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { insightData, totalUserChart } from '../../data'

@Component({
  selector: 'app-audience-insights',
  standalone: true,
  imports: [RouterLink, Icon, NgbDropdownModule, Apexchart, CountUpDirective],
  templateUrl: './audience-insights.html',
  styles: ``,
})
export class AudienceInsights implements OnInit, OnDestroy {
  activeUsers = 125
  activeViews = 125

  totalUserChart = totalUserChart
  insightData = insightData

  private intervalId!: number

  ngOnInit() {
    this.intervalId = window.setInterval(() => {
      const ac = Math.floor(Math.random() * 150 + 150)
      const views = Math.floor(Math.random() * ac + 25)

      this.animateCounter('users', ac)
      this.animateCounter('views', views)
    }, 2000)
  }

  ngOnDestroy() {
    clearInterval(this.intervalId)
  }

  private animateCounter(type: 'users' | 'views', target: number) {
    let start = type === 'users' ? this.activeUsers : this.activeViews
    const step = Math.ceil((target - start) / 20)

    const counter = setInterval(() => {
      start += step

      if (start >= target) {
        start = target
        clearInterval(counter)
      }

      if (type === 'users') {
        this.activeUsers = start
      } else {
        this.activeViews = start
      }
    }, 30)
  }
}
