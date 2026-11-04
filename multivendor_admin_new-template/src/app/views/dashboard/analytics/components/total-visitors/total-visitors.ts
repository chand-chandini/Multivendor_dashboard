import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { visitorData } from '../../data'

@Component({
  selector: 'app-total-visitors',
  imports: [NgbProgressbarModule, Icon, CountUpDirective],
  templateUrl: './total-visitors.html',
  styles: ``,
})
export class TotalVisitors {
  visitorData = visitorData
}
