import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { Observable } from 'rxjs'
import { taskData, TaskType } from './data'

@Component({
  selector: 'app-list',
  imports: [PageBreadcrumb, Icon, RouterLink, NgbSortableHeader, FormsModule, AsyncPipe, CustomPagination],
  providers: [TableService],
  templateUrl: './list.html',
  styles: ``,
})
export class List {
  taskData = taskData
  filterStatus = 'All'
  filterPriority = 'All'
  selectAll = false

  taskData$: Observable<TaskType[]>
  total$: Observable<number>
  selectedIds = new Set<number>()

  constructor(public tableService: TableService<TaskType>) {
    this.taskData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.taskData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    this.selectedIds.clear()
    if (checked) {
      this.taskData.forEach((_, index) => this.selectedIds.add(index))
    }
  }

  toggleSingleSelection(i: number) {
    if (this.selectedIds.has(i)) {
      this.selectedIds.delete(i)
    } else {
      this.selectedIds.add(i)
    }
    this.selectAll = this.selectedIds.size === this.taskData.length
  }

  deleteSelected() {
    this.taskData = this.taskData.filter((_, index) => !this.selectedIds.has(index))
    this.selectedIds.clear()
    this.selectAll = false
    this.tableService.setItems(structuredClone(this.taskData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
