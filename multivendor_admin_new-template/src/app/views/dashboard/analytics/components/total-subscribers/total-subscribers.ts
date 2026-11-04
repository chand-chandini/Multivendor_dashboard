import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { subscriberData } from '../../data'

@Component({
  selector: 'app-total-subscribers',
  imports: [Icon, NgbProgressbarModule, CountUpDirective],
  templateUrl: './total-subscribers.html',
  styles: ``,
})
export class TotalSubscribers {
  subscriberData = subscriberData
}
