import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { EstimationsTable } from './components/estimations-table/estimations-table'
import { EstimationsWidget } from './components/estimations-widget/estimations-widget'
import { estimationStatData } from './data'

@Component({
  selector: 'app-estimations',
  imports: [PageBreadcrumb, EstimationsTable, EstimationsWidget],
  templateUrl: './estimations.html',
  styles: ``,
})
export class Estimations {
  estimationStatData = estimationStatData
}
