import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { SellerContacts } from './components/seller-contacts/seller-contacts'
import { SellerOverview } from './components/seller-overview/seller-overview'
import { SellerTable } from './components/seller-table/seller-table'
import { SellerWidget } from './components/seller-widget/seller-widget'
import { sellerStatData, SellerStatType } from './data'

@Component({
  selector: 'app-seller-details',
  imports: [PageBreadcrumb, SellerContacts, SellerWidget, SellerOverview, SellerTable],
  templateUrl: './seller-details.html',
  styles: ``,
})
export class SellerDetails {
  seller!: SellerStatType
  sellerStatData = sellerStatData
}
