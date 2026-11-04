import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { ProgressType } from '../../data'

@Component({
  selector: 'app-statistic-card3',
  imports: [NgbProgressbarModule],
  templateUrl: './statistic-card3.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatisticCard3 {
  @Input() item!: ProgressType
}
