import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { OverviewType } from '../../data'

@Component({
  selector: 'app-statistic-card2',
  imports: [RouterLink, CommonModule],
  templateUrl: './statistic-card2.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class StatisticCard2 {
  @Input() item!: OverviewType
}
