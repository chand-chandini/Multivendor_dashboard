import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { CommonModule } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { financialOverviewChart, overviewData } from '../../data'

@Component({
  selector: 'app-financial-overview',
  imports: [RouterLink, Icon, NgbDropdownModule, CountUpDirective, CommonModule, Apexchart],
  templateUrl: './financial-overview.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class FinancialOverview {
  overviewData = overviewData
  financialOverviewChart = financialOverviewChart
  Number = Number
}
