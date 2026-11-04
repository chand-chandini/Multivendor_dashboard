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
import { giftCardData, GiftCardType } from './data'

@Component({
  selector: 'app-gift-cards',
  imports: [PageBreadcrumb, RouterLink, Icon, CustomPagination, NgbSortableHeader, FormsModule, FlatpickrDirective, AsyncPipe],
  providers: [TableService],
  templateUrl: './gift-cards.html',
  styles: ``,
})
export class GiftCards {
  giftCardData = giftCardData

  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterType = ''
  filterCategory = ''
  giftCardData$: Observable<GiftCardType[]>
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

  constructor(public tableService: TableService<GiftCardType>) {
    this.giftCardData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.giftCardData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.giftCardData.forEach((exp) => this.selectedIds.add(exp.code))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(gift: GiftCardType) {
    if (this.selectedIds.has(gift.code)) {
      this.selectedIds.delete(gift.code)
    } else {
      this.selectedIds.add(gift.code)
    }
    this.selectAll = this.selectedIds.size === this.giftCardData.length
  }

  deleteSelected() {
    this.giftCardData = this.giftCardData.filter((exp) => !this.selectedIds.has(exp.code))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.giftCardData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
