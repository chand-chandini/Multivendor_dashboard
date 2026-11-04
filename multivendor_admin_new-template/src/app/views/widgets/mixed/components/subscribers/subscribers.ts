import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { subscriberData } from '../../data'
@Component({
  selector: 'app-subscribers',
  imports: [CountUpDirective, Icon, NgbProgressbarModule],
  templateUrl: './subscribers.html',
  styles: ``,
})
export class Subscribers {
  subscriberData = subscriberData
}
