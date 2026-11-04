import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { totalOrdersChart } from './data'

@Component({
  selector: 'app-total-order',
  imports: [Icon, Apexchart, CountUpDirective],
  templateUrl: './total-order.html',
  styles: ``,
})
export class TotalOrder {
  totalOrdersChart = totalOrdersChart
}
