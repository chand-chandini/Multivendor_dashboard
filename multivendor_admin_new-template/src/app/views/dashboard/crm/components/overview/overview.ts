import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { CountUpDirective } from 'ngx-countup'
import { dashRevenueChart, overviewData, OverviewType } from '../../data'

@Component({
  selector: 'app-overview',
  imports: [RouterLink, Icon, Apexchart, CommonModule, CountUpDirective],
  templateUrl: './overview.html',
  styles: ``,
})
export class Overview {
  dashRevenueChart = dashRevenueChart
  Number = Number
  overviewData = overviewData
  chunkArray = <T>(arr: T[], size: number): T[][] => {
    return Array.from({ length: Math.ceil(arr.length / size) }, (_, i) => arr.slice(i * size, i * size + size))
  }

  overviewChunks: OverviewType[][] = this.chunkArray(overviewData, 4)

  isReloading = false

  reload() {
    this.isReloading = true
    setTimeout(() => {
      this.isReloading = false
    }, 1500)
  }
}
