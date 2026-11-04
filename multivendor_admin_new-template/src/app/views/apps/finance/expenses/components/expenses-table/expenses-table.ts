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
import { expenseData, ExpenseType } from '../../data'

@Component({
  selector: 'app-expenses-table',
  imports: [CustomPagination, Icon, NgbSortableHeader, AsyncPipe, FormsModule, RouterLink, FlatpickrDirective],
  providers: [TableService],
  templateUrl: './expenses-table.html',
  styles: ``,
})
export class ExpensesTable {
  expenseData = expenseData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterCategory = ''
  expenseData$: Observable<ExpenseType[]>
  total$: Observable<number>
  selectedIds = new Set<string>()

  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  private modalService = inject(NgbModal)

  openExpenseModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  constructor(public tableService: TableService<ExpenseType>) {
    this.expenseData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.expenseData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.expenseData.forEach((exp) => this.selectedIds.add(exp.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(expense: ExpenseType) {
    if (this.selectedIds.has(expense.id)) {
      this.selectedIds.delete(expense.id)
    } else {
      this.selectedIds.add(expense.id)
    }
    this.selectAll = this.selectedIds.size === this.expenseData.length
  }

  deleteSelected() {
    this.expenseData = this.expenseData.filter((exp) => !this.selectedIds.has(exp.id))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.expenseData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
