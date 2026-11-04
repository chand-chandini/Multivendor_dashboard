import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { DealsTable } from './components/deals-table/deals-table'
import { DealsWidget } from './components/deals-widget/deals-widget'
import { dealStatData } from './data'

@Component({
  selector: 'app-deals',
  imports: [PageBreadcrumb, DealsTable, DealsWidget],
  templateUrl: './deals.html',
  styles: ``,
})
export class Deals {
  dealStatData = dealStatData
}
