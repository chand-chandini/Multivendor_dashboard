import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { LeadsTable } from './components/leads-table/leads-table'
import { LeadsWidget } from './components/leads-widget/leads-widget'
import { leadStatData } from './data'

@Component({
  selector: 'app-leads',
  imports: [PageBreadcrumb, LeadsWidget, LeadsTable],
  templateUrl: './leads.html',
  styles: ``,
})
export class Leads {
  leadStatData = leadStatData
}
