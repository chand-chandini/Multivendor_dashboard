import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { Observable } from 'rxjs'
import { ticketData, TicketType } from '../../data'

@Component({
  selector: 'app-ticket-table',
  imports: [RouterLink, AsyncPipe, FormsModule, NgbSortableHeader, Icon, CustomPagination],
  providers: [TableService],
  templateUrl: './ticket-table.html',
  styles: ``,
})
export class TicketTable {
  ticketData = ticketData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterPriority = ''
  ticketData$: Observable<TicketType[]>
  total$: Observable<number>
  selectedIds = new Set<string>()

  constructor(public tableService: TableService<TicketType>) {
    this.ticketData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.ticketData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.ticketData.forEach((ticket) => this.selectedIds.add(ticket.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(ticket: TicketType) {
    if (this.selectedIds.has(ticket.id)) {
      this.selectedIds.delete(ticket.id)
    } else {
      this.selectedIds.add(ticket.id)
    }
    this.selectAll = this.selectedIds.size === this.ticketData.length
  }

  deleteSelected() {
    this.ticketData = this.ticketData.filter((ticket) => !this.selectedIds.has(ticket.id))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.ticketData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }
  protected readonly toPascalCase = toPascalCase
}
