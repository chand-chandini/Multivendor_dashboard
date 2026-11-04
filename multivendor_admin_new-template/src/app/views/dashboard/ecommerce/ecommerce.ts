import { Icon } from '@/app/components/icon/icon'
import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { META_DATA } from '@/app/constants'
import { Component, OnDestroy, OnInit, signal } from '@angular/core'
import { EcommerceStat } from './components/ecommerce-stat/ecommerce-stat'
import { Locations } from './components/locations/locations'
import { RecentActivity } from './components/recent-activity/recent-activity'
import { RecentOrders } from './components/recent-orders/recent-orders'
import { SalesReport } from './components/sales-report/sales-report'
import { StorePerformance } from './components/store-performance/store-performance'
import { TopSellingProducts } from './components/top-selling-products/top-selling-products'
import { WeeklyPerformance } from './components/weekly-performance/weekly-performance'
import { stateData } from './data'

@Component({
  selector: 'app-ecommerce',
  standalone: true,
  imports: [StorePerformance, WeeklyPerformance, EcommerceStat, SalesReport, TopSellingProducts, RecentOrders, Locations, RecentActivity, Icon, PageBreadcrumb],
  templateUrl: './ecommerce.html',
  styles: ``,
})
export class Ecommerce implements OnInit, OnDestroy {
  username = META_DATA.username
  stateData = stateData
  currentDate: string

  time = signal('')

  private intervalId!: ReturnType<typeof setInterval>

  constructor() {
    const now = new Date()

    this.currentDate = now.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })

    this.time.set(
      now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    )
  }

  ngOnInit(): void {
    // Update time every second
    this.intervalId = setInterval(() => {
      const now = new Date()
      this.time.set(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      )
    }, 1000)
  }

  ngOnDestroy(): void {
    clearInterval(this.intervalId)
  }
}
