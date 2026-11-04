import { Apexchart } from '@/app/components/apexchart/apexchart'
import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { FinanceStatType } from '../../data'

@Component({
  selector: 'app-finance-stat',
  imports: [Apexchart, CountUpDirective, CommonModule],
  templateUrl: './finance-stat.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FinanceStat {
  @Input() card!: FinanceStatType
  Number = Number
}
