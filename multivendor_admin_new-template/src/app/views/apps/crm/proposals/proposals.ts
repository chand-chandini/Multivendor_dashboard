import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { ProposalsTable } from './components/proposals-table/proposals-table'
import { ProposalsWidget } from './components/proposals-widget/proposals-widget'
import { proposalStatData } from './data'

@Component({
  selector: 'app-proposals',
  imports: [PageBreadcrumb, ProposalsWidget, ProposalsTable],
  templateUrl: './proposals.html',
  styles: ``,
})
export class Proposals {
  proposalStatData = proposalStatData
}
