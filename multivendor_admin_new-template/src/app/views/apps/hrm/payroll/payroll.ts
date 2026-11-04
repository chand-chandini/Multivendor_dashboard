import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component, inject, TemplateRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { Observable } from 'rxjs'
import { payrollData, PayrollType } from './data'

@Component({
  selector: 'app-payroll',
  imports: [PageBreadcrumb, AsyncPipe, NgbSortableHeader, Icon, FormsModule, CustomPagination, RouterLink],
  providers: [TableService],
  templateUrl: './payroll.html',
  styles: ``,
})
export class Payroll {
  payrollData = payrollData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterCategory = ''
  filterPeriod = ''
  payrollData$: Observable<PayrollType[]>
  total$: Observable<number>
  selectedIds = new Set<string>()

  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  constructor(public tableService: TableService<PayrollType>) {
    this.payrollData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.payrollData), 10)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.payrollData.forEach((exp) => this.selectedIds.add(exp.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(item: PayrollType) {
    if (this.selectedIds.has(item.id)) {
      this.selectedIds.delete(item.id)
    } else {
      this.selectedIds.add(item.id)
    }
    this.selectAll = this.selectedIds.size === this.payrollData.length
  }

  deleteSelected() {
    this.payrollData = this.payrollData.filter((exp) => !this.selectedIds.has(exp.id))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.payrollData), 10)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
