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
import { estimateData, EstimateType } from '../../data'

@Component({
  selector: 'app-estimations-table',
  imports: [AsyncPipe, FormsModule, FlatpickrDirective, NgbSortableHeader, CustomPagination, RouterLink, Icon],
  providers: [TableService],
  templateUrl: './estimations-table.html',
  styles: ``,
})
export class EstimationsTable {
  estimateData = estimateData

  selectAll = false
  filterStatus = ''
  filterBudgetRange = ''

  estimateData$: Observable<EstimateType[]>
  total$: Observable<number>
  selectedIds = new Set<number>()

  private modalService = inject(NgbModal)

  openEstimationModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' })
  }

  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  constructor(public tableService: TableService<EstimateType>) {
    this.estimateData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.estimateData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked

    this.selectedIds.clear()

    if (checked) {
      this.estimateData.forEach((_, index) => this.selectedIds.add(index))
    }
  }

  toggleSingleSelection(i: number) {
    if (this.selectedIds.has(i)) {
      this.selectedIds.delete(i)
    } else {
      this.selectedIds.add(i)
    }
    this.selectAll = this.selectedIds.size === this.estimateData.length
  }

  deleteSelected() {
    this.estimateData = this.estimateData.filter((_, index) => !this.selectedIds.has(index))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.estimateData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
