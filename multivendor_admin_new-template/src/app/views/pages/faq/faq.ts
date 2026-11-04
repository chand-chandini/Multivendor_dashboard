import { Component } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { Customization } from './components/customization/customization'
import { General } from './components/general/general'
import { Payments } from './components/payments/payments'
import { Refunds } from './components/refunds/refunds'

@Component({
  selector: 'app-faq',
  imports: [PageBreadcrumb, General, Payments, Refunds, Customization, Icon],
  templateUrl: './faq.html',
  styles: ``,
})
export class Faq {}
