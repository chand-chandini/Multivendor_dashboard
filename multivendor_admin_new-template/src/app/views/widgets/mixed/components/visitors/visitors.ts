import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { CountUpDirective } from 'ngx-countup'
import { visitorData } from '../../data'
@Component({
  selector: 'app-visitors',
  imports: [Icon, CountUpDirective, NgbProgressbarModule],
  templateUrl: './visitors.html',
  styles: ``,
})
export class Visitors {
  visitorData = visitorData
}
