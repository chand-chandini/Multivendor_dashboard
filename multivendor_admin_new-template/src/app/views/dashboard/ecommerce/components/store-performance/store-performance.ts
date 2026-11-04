import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { totalSalesChart } from '../../data'

@Component({
  selector: 'app-store-performance',
  imports: [Icon, Apexchart],
  templateUrl: './store-performance.html',
  styles: ``,
})
export class StorePerformance {
  totalSalesChart = totalSalesChart
  isReloading = false

  reload() {
    this.isReloading = true
    setTimeout(() => {
      this.isReloading = false
    }, 1500)
  }
}
