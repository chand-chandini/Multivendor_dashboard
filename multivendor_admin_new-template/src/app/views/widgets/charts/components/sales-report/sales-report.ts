import { Apexchart } from '@/app/components/apexchart/apexchart'
import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { salesReportChart, salesReportData } from '../../data'

@Component({
  selector: 'app-sales-report',
  imports: [Apexchart, Icon, CountUpDirective, NgbNavModule],
  templateUrl: './sales-report.html',
  styles: ``,
})
export class SalesReport {
  salesReportData = salesReportData
  Number = Number
  active = 2
  salesReportChart = salesReportChart
}
