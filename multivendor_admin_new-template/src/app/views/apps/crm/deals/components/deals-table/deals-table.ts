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
import { dealData, DealType } from '../../data'

@Component({
  selector: 'app-deals-table',
  imports: [CustomPagination, Icon, AsyncPipe, RouterLink, FormsModule, FlatpickrDirective, NgbSortableHeader],
  providers: [TableService],
  templateUrl: './deals-table.html',
  styles: ``,
})
export class DealsTable {
  selectAll = false
  filterStage = 'All'
  filterAmountRange = 'All'
  selectedIds = new Set<number>()
  dealData = dealData

  dealData$: Observable<DealType[]>
  total$: Observable<number>
  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }
  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' })
  }

  constructor(public tableService: TableService<DealType>) {
    this.dealData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.dealData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked

    this.selectedIds.clear()

    if (checked) {
      this.dealData.forEach((_, index) => this.selectedIds.add(index))
    }
  }

  toggleSingleSelection(i: number) {
    if (this.selectedIds.has(i)) {
      this.selectedIds.delete(i)
    } else {
      this.selectedIds.add(i)
    }
    this.selectAll = this.selectedIds.size === this.dealData.length
  }

  deleteSelected() {
    this.dealData = this.dealData.filter((_, index) => !this.selectedIds.has(index))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.dealData), 10)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  buildProbBars(prob: number): ('full' | 'half' | 'empty')[] {
    const fullBars = Math.floor(prob / 20)
    const remainder = prob % 20
    const halfBar = remainder >= 10 ? 1 : 0
    const emptyBars = 5 - fullBars - halfBar

    return [...Array(fullBars).fill('full'), ...Array(halfBar).fill('half'), ...Array(emptyBars).fill('empty')]
  }
}
