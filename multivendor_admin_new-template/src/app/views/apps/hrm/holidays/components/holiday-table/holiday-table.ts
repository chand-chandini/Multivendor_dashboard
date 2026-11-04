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
import { holidayData, HolidayType } from '../../data'

@Component({
  selector: 'app-holiday-table',
  imports: [Icon, CustomPagination, FlatpickrDirective, NgbSortableHeader, FormsModule, RouterLink, AsyncPipe],
  providers: [TableService],
  templateUrl: './holiday-table.html',
  styles: ``,
})
export class HolidayTable {
  holidayData = holidayData
  selectAll = false
  searchTerm = ''
  holidayData$: Observable<HolidayType[]>
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

  constructor(public tableService: TableService<HolidayType>) {
    this.holidayData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.holidayData), 10)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.holidayData.forEach((exp) => this.selectedIds.add(exp.name))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(holiday: HolidayType) {
    if (this.selectedIds.has(holiday.name)) {
      this.selectedIds.delete(holiday.name)
    } else {
      this.selectedIds.add(holiday.name)
    }
    this.selectAll = this.selectedIds.size === this.holidayData.length
  }

  deleteSelected() {
    this.holidayData = this.holidayData.filter((exp) => !this.selectedIds.has(exp.name))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.holidayData), 10)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
