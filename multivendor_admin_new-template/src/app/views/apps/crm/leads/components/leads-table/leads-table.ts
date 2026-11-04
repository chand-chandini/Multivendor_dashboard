import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component, inject, TemplateRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { NgbModal, NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'
import { Observable } from 'rxjs'
import { leadData, LeadType } from '../../data'

@Component({
  selector: 'app-leads-table',
  imports: [AsyncPipe, FormsModule, RouterLink, NgbSortableHeader, CustomPagination, Icon, NgbTooltipModule],
  providers: [TableService],
  templateUrl: './leads-table.html',
  styles: ``,
})
export class LeadsTable {
  leadData = leadData

  selectAll = false
  searchTerm = ''
  filterStatus = ''
  filterAmountRange = ''
  selectedIds = new Set<string>()

  leadData$: Observable<LeadType[]>
  total$: Observable<number>

  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' })
  }

  constructor(public tableService: TableService<LeadType>) {
    this.leadData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.leadData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.leadData.forEach((exp) => this.selectedIds.add(exp.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(lead: LeadType) {
    if (this.selectedIds.has(lead.id)) {
      this.selectedIds.delete(lead.id)
    } else {
      this.selectedIds.add(lead.id)
    }
    this.selectAll = this.selectedIds.size === this.leadData.length
  }

  deleteSelected() {
    this.leadData = this.leadData.filter((exp) => !this.selectedIds.has(exp.id))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.leadData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
