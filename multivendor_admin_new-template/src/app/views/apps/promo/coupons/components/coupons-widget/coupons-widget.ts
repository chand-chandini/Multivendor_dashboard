import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { CouponStatType } from '../../data'

@Component({
  selector: 'app-coupons-widget',
  imports: [Icon],
  templateUrl: './coupons-widget.html',
  styles: ``,
})
export class CouponsWidget {
  @Input() item!: CouponStatType
}
