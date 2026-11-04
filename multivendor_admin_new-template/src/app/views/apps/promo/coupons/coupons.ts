import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { CouponsTable } from './components/coupons-table/coupons-table'
import { CouponsWidget } from './components/coupons-widget/coupons-widget'
import { couponStatData } from './data'

@Component({
  selector: 'app-coupons',
  imports: [PageBreadcrumb, CouponsWidget, CouponsTable],
  templateUrl: './coupons.html',
  styles: ``,
})
export class Coupons {
  couponStatData = couponStatData
}
