import { Component } from '@angular/core'
import { chartjs } from '@app/components/chartjs/chartjs'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { basicLineChartOptions, interpolationChartOptions, lineSegmentChartOptions, multiAxesChartOptions, pointStyleChartOptions, steppedChartOptions } from './data'

@Component({
  selector: 'app-line',
  imports: [PageBreadcrumb, chartjs],
  templateUrl: './line.html',
  styles: ``,
})
export class Line {
  basicLineChartOptions = basicLineChartOptions
  interpolationChartOptions = interpolationChartOptions
  multiAxesChartOptions = multiAxesChartOptions
  pointStyleChartOptions = pointStyleChartOptions
  lineSegmentChartOptions = lineSegmentChartOptions
  steppedChartOptions = steppedChartOptions
}
