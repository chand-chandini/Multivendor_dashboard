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
import { departmentData, DepartmentType } from './data'

@Component({
  selector: 'app-departments',
  imports: [PageBreadcrumb, RouterLink, Icon, FlatpickrDirective, NgbSortableHeader, FormsModule, CommonModule, CustomPagination],
  providers: [TableService],
  templateUrl: './departments.html',
  styles: ``,
})
export class Departments {
  departmentData = departmentData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  departmentData$: Observable<DepartmentType[]>
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

  constructor(public tableService: TableService<DepartmentType>) {
    this.departmentData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.departmentData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.departmentData.forEach((exp) => this.selectedIds.add(exp.code))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(department: DepartmentType) {
    if (this.selectedIds.has(department.code)) {
      this.selectedIds.delete(department.code)
    } else {
      this.selectedIds.add(department.code)
    }
    this.selectAll = this.selectedIds.size === this.departmentData.length
  }

  deleteSelected() {
    this.departmentData = this.departmentData.filter((exp) => !this.selectedIds.has(exp.code))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.departmentData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
