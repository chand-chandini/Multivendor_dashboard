import { Component, Input } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { TicketCardType } from '../../data'

@Component({
  selector: 'app-ticket-widget',
  imports: [Icon],
  templateUrl: './ticket-widget.html',
  styles: ``,
})
export class TicketWidget {
  @Input() ticket!: TicketCardType
}
