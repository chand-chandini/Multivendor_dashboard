import { Component } from '@angular/core'
import { chartjs } from '@app/components/chartjs/chartjs'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { basicChartOptions, boundaryChartOptions, differentDataSetChartOptions, drowTimeChartOptions, stackedChartOptions } from './data'

@Component({
  selector: 'app-area',
  imports: [PageBreadcrumb, chartjs],
  templateUrl: './area.html',
  styles: ``,
})
export class Area {
  basicChartOptions = basicChartOptions
  differentDataSetChartOptions = differentDataSetChartOptions
  stackedChartOptions = stackedChartOptions
  boundaryChartOptions = boundaryChartOptions
  drowTimeChartOptions = drowTimeChartOptions
}
