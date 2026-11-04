import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { LeavesTable } from './components/leaves-table/leaves-table'
import { LeavesWidget } from './components/leaves-widget/leaves-widget'
import { leaveStatData } from './data'

@Component({
  selector: 'app-leaves',
  imports: [PageBreadcrumb, LeavesWidget, LeavesTable],
  templateUrl: './leaves.html',
  styles: ``,
})
export class Leaves {
  leaveStatData = leaveStatData
}
