import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { saleReportData, salesReportChart } from '../../data'

@Component({
  selector: 'app-sales-report',
  imports: [CountUpDirective, Icon, Apexchart, NgbNavModule],
  templateUrl: './sales-report.html',
  styles: ``,
})
export class SalesReport {
  saleReportData = saleReportData
  salesReportChart = salesReportChart
  active = 2
  Number = Number
}
