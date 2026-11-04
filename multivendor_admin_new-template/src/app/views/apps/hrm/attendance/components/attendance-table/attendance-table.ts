import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component, inject, TemplateRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { NgbModal, NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { FlatpickrDirective } from 'angularx-flatpickr'
import { Observable } from 'rxjs'
import { attendanceData, AttendanceType } from '../../data'

@Component({
  selector: 'app-attendance-table',
  imports: [AsyncPipe, NgbProgressbarModule, Icon, CustomPagination, NgbSortableHeader, FormsModule, FlatpickrDirective],
  providers: [TableService],
  templateUrl: './attendance-table.html',
  styles: ``,
})
export class AttendanceTable {
  attendanceData = attendanceData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterCategory = ''
  attendanceData$: Observable<AttendanceType[]>
  total$: Observable<number>
  selectedIds = new Set<string>()

  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  launchTimeOptions = {
    enableTime: true,
    noCalendar: true,
    dateFormat: 'H:i',
    defaultDate: new Date(),
  }

  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  constructor(public tableService: TableService<AttendanceType>) {
    this.attendanceData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.attendanceData), 10)
  }

  deleteSelected() {
    this.attendanceData = this.attendanceData.filter((exp) => !this.selectedIds.has(exp.date))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.attendanceData), 10)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
