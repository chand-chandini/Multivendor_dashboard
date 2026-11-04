import { chartjs } from '@/app/components/chartjs/chartjs'
import { PageBreadcrumb } from '@/app/components/page-breadcrumb/page-breadcrumb'
import { Component } from '@angular/core'
import { basicBarChartOptions, borderedRadiusChartOptions, floatingChartOptions, horizontalChartOptions, stackedChartOptions, stackedGroupsChartOptions, verticalChartOptions } from './data'

@Component({
  selector: 'app-bar',
  imports: [PageBreadcrumb, chartjs],
  templateUrl: './bar.html',
  styles: ``,
})
export class Bar {
  basicBarChartOptions = basicBarChartOptions
  borderedRadiusChartOptions = borderedRadiusChartOptions
  floatingChartOptions = floatingChartOptions
  horizontalChartOptions = horizontalChartOptions
  stackedChartOptions = stackedChartOptions
  stackedGroupsChartOptions = stackedGroupsChartOptions
  verticalChartOptions = verticalChartOptions
}
