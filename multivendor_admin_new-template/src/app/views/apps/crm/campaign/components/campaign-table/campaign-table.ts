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
import { campaignData, CampaignType } from '../../data'

@Component({
  selector: 'app-campaign-table',
  imports: [CustomPagination, Icon, AsyncPipe, FormsModule, FlatpickrDirective, NgbSortableHeader, RouterLink],
  providers: [TableService],
  templateUrl: './campaign-table.html',
  styles: ``,
})
export class CampaignTable {
  campaignData = campaignData
  selectAll = false
  filterStatus = ''
  filterBudgetRange = ''

  campaignData$: Observable<CampaignType[]>
  total$: Observable<number>
  selectedIds = new Set<number>()

  private modalService = inject(NgbModal)

  openCampaignModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' })
  }

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

  constructor(public tableService: TableService<CampaignType>) {
    this.campaignData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.campaignData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked

    this.selectedIds.clear()

    if (checked) {
      this.campaignData.forEach((_, index) => this.selectedIds.add(index))
    }
  }

  toggleSingleSelection(i: number) {
    if (this.selectedIds.has(i)) {
      this.selectedIds.delete(i)
    } else {
      this.selectedIds.add(i)
    }
    this.selectAll = this.selectedIds.size === this.campaignData.length
  }

  deleteSelected() {
    this.campaignData = this.campaignData.filter((_, index) => !this.selectedIds.has(index))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.campaignData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
