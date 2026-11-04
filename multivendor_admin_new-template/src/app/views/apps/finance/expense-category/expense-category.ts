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
import { categoryData, CategoryType } from './data'

@Component({
  selector: 'app-expense-category',
  imports: [PageBreadcrumb, CustomPagination, NgbSortableHeader, AsyncPipe, FormsModule, RouterLink, Icon],
  providers: [TableService],
  templateUrl: './expense-category.html',
  styles: ``,
})
export class ExpenseCategory {
  categoryData = categoryData
  selectAll = false
  searchTerm = ''
  filterStatus = ''
  categoryData$: Observable<CategoryType[]>
  total$: Observable<number>
  selectedIds = new Set<string>()

  private modalService = inject(NgbModal)

  openExpenseModal(content: TemplateRef<any>) {
    this.modalService.open(content, { centered: true })
  }

  constructor(public tableService: TableService<CategoryType>) {
    this.categoryData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.categoryData), 8)
  }

  toggleAllSelection(checked: boolean) {
    this.selectAll = checked
    if (checked) {
      this.categoryData.forEach((exp) => this.selectedIds.add(exp.id))
    } else {
      this.selectedIds.clear()
    }
  }

  toggleSingleSelection(category: CategoryType) {
    if (this.selectedIds.has(category.id)) {
      this.selectedIds.delete(category.id)
    } else {
      this.selectedIds.add(category.id)
    }
    this.selectAll = this.selectedIds.size === this.categoryData.length
  }

  deleteSelected() {
    this.categoryData = this.categoryData.filter((exp) => !this.selectedIds.has(exp.id))
    this.selectedIds.clear()
    this.selectAll = false
    this.tableService.setItems(structuredClone(this.categoryData), 8)
  }

  get hasSelection(): boolean {
    return this.selectedIds.size > 0
  }

  protected readonly toPascalCase = toPascalCase
}
