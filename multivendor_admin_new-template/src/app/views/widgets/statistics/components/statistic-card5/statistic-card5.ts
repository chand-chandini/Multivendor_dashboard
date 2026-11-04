import { Icon } from '@/app/components/icon/icon'
import { Component, Input } from '@angular/core'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { DealStatType } from '../../data'

@Component({
  selector: 'app-statistic-card5',
  imports: [Icon, NgbProgressbarModule],
  templateUrl: './statistic-card5.html',
  styles: ``,
})
export class StatisticCard5 {
  @Input() item!: DealStatType
}
