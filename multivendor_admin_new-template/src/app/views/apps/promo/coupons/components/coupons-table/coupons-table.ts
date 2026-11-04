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
import { couponData, CouponType } from '../../data'

@Component({
  selector: 'app-coupons-table',
  imports: [Icon, NgbSortableHeader, FormsModule, AsyncPipe, RouterLink, CustomPagination, FlatpickrDirective],
  providers: [TableService],
  templateUrl: './coupons-table.html',
  styles: ``,
})
export class CouponsTable {
  couponData = couponData

  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterType = ''
  filterCategory = ''
  couponData$: Observable<CouponType[]>
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

  constructor(public tableService: TableService<CouponType>) {
    this.couponData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.couponData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.couponData.forEach((exp) => this.selectedIds.add(exp.code))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(item: CouponType) {
    if (this.selectedIds.has(item.code)) {
      this.selectedIds.delete(item.code)
    } else {
      this.selectedIds.add(item.code)
    }
    this.selectAll = this.selectedIds.size === this.couponData.length
  }

  deleteSelected() {
    this.couponData = this.couponData.filter((exp) => !this.selectedIds.has(exp.code))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.couponData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
