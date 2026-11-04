import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'

@Component({
  selector: 'app-statistic-card1',
  imports: [Icon, CountUpDirective],
  templateUrl: './statistic-card1.html',
  styles: ``,
})
export class StatisticCard1 {}
