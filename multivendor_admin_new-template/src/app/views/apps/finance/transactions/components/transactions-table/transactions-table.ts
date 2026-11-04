import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component, inject, TemplateRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { FlatpickrDirective } from 'angularx-flatpickr'
import { Observable } from 'rxjs'
import { transactionData, TransactionType } from '../../data'

@Component({
  selector: 'app-transactions-table',
  imports: [Icon, RouterLink, NgbSortableHeader, CustomPagination, FormsModule, AsyncPipe, FlatpickrDirective],
  providers: [TableService],
  templateUrl: './transactions-table.html',
  styles: ``,
})
export class TransactionsTable {
  transactionData = transactionData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterCategory = ''
  transactionData$: Observable<TransactionType[]>
  total$: Observable<number>
  selectedIds = new Set<string>()

  flatPickrOptions = {
    dateFormat: 'd M, Y H:i',
    enableTime: true,
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  private modalService = inject(NgbModal)

  openTransactionModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  constructor(public tableService: TableService<TransactionType>) {
    this.transactionData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.transactionData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.transactionData.forEach((exp) => this.selectedIds.add(exp.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(income: TransactionType) {
    if (this.selectedIds.has(income.id)) {
      this.selectedIds.delete(income.id)
    } else {
      this.selectedIds.add(income.id)
    }
    this.selectAll = this.selectedIds.size === this.transactionData.length
  }

  deleteSelected() {
    this.transactionData = this.transactionData.filter((exp) => !this.selectedIds.has(exp.id))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.transactionData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
