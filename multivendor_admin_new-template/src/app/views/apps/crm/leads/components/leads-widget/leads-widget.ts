import { Component, Input } from '@angular/core'
import { CountUpDirective } from 'ngx-countup'
import { LeadStatType } from '../../data'

@Component({
  selector: 'app-leads-widget',
  imports: [CountUpDirective],
  templateUrl: './leads-widget.html',
  styles: ``,
})
export class LeadsWidget {
  @Input() lead!: LeadStatType
}
