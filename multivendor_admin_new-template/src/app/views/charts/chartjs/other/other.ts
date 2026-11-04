import { Component } from '@angular/core'
import { chartjs } from '@app/components/chartjs/chartjs'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { bubbleChartOptions, comboBarAndLineChartOptions, donutChartOptions, multiSeriesPieChartOptions, pieChartOptions, polarChartOptions, radarChartOptions, scatterChartOptions, stackedBarAndLineChartOptions } from './data'

@Component({
  selector: 'app-other',
  imports: [chartjs, PageBreadcrumb],
  templateUrl: './other.html',
  styles: ``,
})
export class Other {
  bubbleChartOptions = bubbleChartOptions
  ComboBarAndLineChartOptions = comboBarAndLineChartOptions
  stackedBarAndLineChartOptions = stackedBarAndLineChartOptions
  donutChartOptions = donutChartOptions
  multiSeriesPieChartOptions = multiSeriesPieChartOptions
  pieChartOptions = pieChartOptions
  polarChartOptions = polarChartOptions
  scatterChartOptions = scatterChartOptions
  radarChartOptions = radarChartOptions
}
