import { toTitleCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component, inject, TemplateRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { FlatpickrDirective } from 'angularx-flatpickr'
import { Observable } from 'rxjs'
import { apiClientData, ApiClientType } from './data'

@Component({
  selector: 'app-api-keys',
  imports: [PageBreadcrumb, CustomPagination, NgbSortableHeader, FormsModule, AsyncPipe, Icon, FlatpickrDirective],
  providers: [TableService],
  templateUrl: './api-keys.html',
  styles: ``,
})
export class ApiKeys {
  apiClientData = apiClientData
  filterStatus = 'All'
  filterByRegion = 'All'
  selectAll = false
  apiKey: string = ''
  apiClientData$: Observable<ApiClientType[]>
  total$: Observable<number>
  selectedIds = new Set<number>()

  flatPickrOptions = {
    dateFormat: 'd M, Y',
    defaultDate: new Date(),
    monthSelectorType: 'dropdown' as const,
  }

  private modalService = inject(NgbModal)

  openModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' })
  }

  constructor(public tableService: TableService<ApiClientType>) {
    this.apiClientData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.apiClientData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked

    this.selectedIds.clear()

    if (checked) {
      this.apiClientData.forEach((_, index) => this.selectedIds.add(index))
    }
  }

  toggleSingleSelection(i: number) {
    if (this.selectedIds.has(i)) {
      this.selectedIds.delete(i)
    } else {
      this.selectedIds.add(i)
    }
    this.selectAll = this.selectedIds.size === this.apiClientData.length
  }

  deleteSelected() {
    this.apiClientData = this.apiClientData.filter((_, index) => !this.selectedIds.has(index))

    this.selectedIds.clear()
    this.selectAll = false

    this.tableService.setItems(structuredClone(this.apiClientData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  generateApiKey(): void {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
    let key = ''
    for (let i = 0; i < 25; i++) {
      const randomIndex = Math.floor(Math.random() * charset.length)
      key += charset[randomIndex]
    }
    this.apiKey = key
  }

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text)
  }

  protected readonly toTitleCase = toTitleCase
}
