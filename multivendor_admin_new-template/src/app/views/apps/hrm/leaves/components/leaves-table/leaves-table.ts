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
import { leaveData, LeaveType } from '../../data'

@Component({
  selector: 'app-leaves-table',
  imports: [Icon, CustomPagination, RouterLink, NgbSortableHeader, FormsModule, AsyncPipe, FlatpickrDirective],
  providers: [TableService],
  templateUrl: './leaves-table.html',
  styles: ``,
})
export class LeavesTable {
  leaveData = leaveData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterType = ''
  filterCategory = ''
  leaveData$: Observable<LeaveType[]>
  total$: Observable<number>
  selectedIds = new Set<string>()

  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  constructor(public tableService: TableService<LeaveType>) {
    this.leaveData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.leaveData), 10)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.leaveData.forEach((exp) => this.selectedIds.add(exp.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(item: LeaveType) {
    if (this.selectedIds.has(item.id)) {
      this.selectedIds.delete(item.id)
    } else {
      this.selectedIds.add(item.id)
    }
    this.selectAll = this.selectedIds.size === this.leaveData.length
  }

  deleteSelected() {
    this.leaveData = this.leaveData.filter((exp) => !this.selectedIds.has(exp.id))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.leaveData), 10)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
