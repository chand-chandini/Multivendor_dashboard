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
import { incomeData, IncomeType } from '../../data'

@Component({
  selector: 'app-income-table',
  imports: [Icon, CustomPagination, RouterLink, FlatpickrDirective, NgbSortableHeader, AsyncPipe, FormsModule],
  providers: [TableService],
  templateUrl: './income-table.html',
  styles: ``,
})
export class IncomeTable {
  incomeData = incomeData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterCategory = ''
  incomeData$: Observable<IncomeType[]>
  total$: Observable<number>
  selectedIds = new Set<string>()

  flatPickrOptions = {
    dateFormat: 'd M, Y H:i',
    enableTime: true,
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  private modalService = inject(NgbModal)

  openIncomeModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  constructor(public tableService: TableService<IncomeType>) {
    this.incomeData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.incomeData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.incomeData.forEach((exp) => this.selectedIds.add(exp.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(income: IncomeType) {
    if (this.selectedIds.has(income.id)) {
      this.selectedIds.delete(income.id)
    } else {
      this.selectedIds.add(income.id)
    }
    this.selectAll = this.selectedIds.size === this.incomeData.length
  }

  deleteSelected() {
    this.incomeData = this.incomeData.filter((exp) => !this.selectedIds.has(exp.id))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.incomeData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
