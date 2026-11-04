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
import { NgbModal, NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap'
import { FlatpickrDirective } from 'angularx-flatpickr'
import { Observable } from 'rxjs'
import { customerData, CustomerType } from './data'

@Component({
  selector: 'app-customers',
  imports: [PageBreadcrumb, CustomPagination, FormsModule, RouterLink, NgbPaginationModule, NgbSortableHeader, AsyncPipe, FlatpickrDirective, Icon],
  providers: [TableService],
  templateUrl: './customers.html',
  styles: ``,
})
export class Customers {
  customerData = customerData
  statusType = ''
  filterByCountry = 'All'
  selectAll = false

  customerData$: Observable<CustomerType[]>
  total$: Observable<number>
  selectedIds = new Set<number>()

  private modalService = inject(NgbModal)

  openAddCustomerModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' })
  }

  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  constructor(public tableService: TableService<CustomerType>) {
    this.customerData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.customerData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked

    this.selectedIds.clear()

    if (checked) {
      this.customerData.forEach((_, index) => this.selectedIds.add(index))
    }
  }

  toggleSingleSelection(i: number) {
    if (this.selectedIds.has(i)) {
      this.selectedIds.delete(i)
    } else {
      this.selectedIds.add(i)
    }
    this.selectAll = this.selectedIds.size === this.customerData.length
  }

  deleteSelected() {
    this.customerData = this.customerData.filter((_, index) => !this.selectedIds.has(index))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.customerData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
