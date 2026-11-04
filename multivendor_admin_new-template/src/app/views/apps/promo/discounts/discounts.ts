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
import { FlatpickrDirective } from 'angularx-flatpickr'
import { Observable } from 'rxjs'
import { discountData, DiscountType } from './data'

@Component({
  selector: 'app-discounts',
  imports: [PageBreadcrumb, RouterLink, NgbSortableHeader, FormsModule, AsyncPipe, Icon, CustomPagination, FlatpickrDirective],
  providers: [TableService],
  templateUrl: './discounts.html',
  styles: ``,
})
export class Discounts {
  discountData = discountData

  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterType = ''
  filterCategory = ''
  discountData$: Observable<DiscountType[]>
  total$: Observable<number>
  selectedIds = new Set<number>()

  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg', centered: true })
  }

  constructor(public tableService: TableService<DiscountType>) {
    this.discountData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.discountData), 10)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    this.selectedIds.clear()
    if (checked) {
      this.discountData.forEach((_, index) => this.selectedIds.add(index))
    }
  }

  toggleSingleSelection(i: number) {
    if (this.selectedIds.has(i)) {
      this.selectedIds.delete(i)
    } else {
      this.selectedIds.add(i)
    }
    this.selectAll = this.selectedIds.size === this.discountData.length
  }

  deleteSelected() {
    this.discountData = this.discountData.filter((_, index) => !this.selectedIds.has(index))
    this.selectedIds.clear()
    this.selectAll = false
    this.tableService.setItems(structuredClone(this.discountData), 10)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
