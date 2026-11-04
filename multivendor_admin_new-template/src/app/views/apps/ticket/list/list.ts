import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { TicketTable } from './components/ticket-table/ticket-table'
import { TicketWidget } from './components/ticket-widget/ticket-widget'
import { ticketCardData } from './data'

@Component({
  selector: 'app-list',
  imports: [PageBreadcrumb, TicketTable, TicketWidget],
  templateUrl: './list.html',
  styles: ``,
})
export class List {
  ticketCardData = ticketCardData
}
