import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { NgbSortableHeader } from '@/app/core/directive/sortable.directive'
import { TableService } from '@/app/core/services/table.service'
import { AsyncPipe } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'
import { analyticData, AnalyticType } from '../../data'

@Component({
  selector: 'app-analytics-overview',
  imports: [Icon, NgbSortableHeader, RouterLink, CustomPagination, AsyncPipe, FormsModule],
  providers: [TableService],
  templateUrl: './analytics-overview.html',
  styles: ``,
})
export class AnalyticsOverview {
  selectAll = false
  selectedIds = new Set<number>()
  analyticData = analyticData
  analyticData$: Observable<AnalyticType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<AnalyticType>) {
    this.analyticData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.analyticData), 5)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked

    this.selectedIds.clear()

    if (checked) {
      this.analyticData.forEach((_, index) => this.selectedIds.add(index))
    }
  }

  toggleSingleSelection(i: number) {
    if (this.selectedIds.has(i)) {
      this.selectedIds.delete(i)
    } else {
      this.selectedIds.add(i)
    }
    this.selectAll = this.selectedIds.size === this.analyticData.length
  }

  deleteSelected() {
    this.analyticData = this.analyticData.filter((_, index) => !this.selectedIds.has(index))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.analyticData), 10)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }
}
