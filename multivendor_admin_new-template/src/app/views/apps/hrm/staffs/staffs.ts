import { toPascalCase } from '@/app/utils/string'
import { CommonModule } from '@angular/common'
import { Component, inject, TemplateRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { FlatpickrDirective } from 'angularx-flatpickr'
import { Observable } from 'rxjs'
import { staffListData, StaffType } from './data'

@Component({
  selector: 'app-staffs',
  imports: [PageBreadcrumb, CommonModule, RouterLink, Icon, CustomPagination, FlatpickrDirective, NgbSortableHeader, FormsModule],
  providers: [TableService],
  templateUrl: './staffs.html',
  styles: ``,
})
export class Staffs {
  staffListData = staffListData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterCategory = ''
  staffListData$: Observable<StaffType[]>
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

  constructor(public tableService: TableService<StaffType>) {
    this.staffListData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.staffListData), 10)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.staffListData.forEach((exp) => this.selectedIds.add(exp.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(staff: StaffType) {
    if (this.selectedIds.has(staff.id)) {
      this.selectedIds.delete(staff.id)
    } else {
      this.selectedIds.add(staff.id)
    }
    this.selectAll = this.selectedIds.size === this.staffListData.length
  }

  deleteSelected() {
    this.staffListData = this.staffListData.filter((exp) => !this.selectedIds.has(exp.id))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.staffListData), 10)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
