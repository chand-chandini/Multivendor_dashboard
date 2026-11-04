import { toPascalCase } from '@/app/utils/string'
import { CommonModule } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { TableService } from '@core/services/table.service'
import { Observable } from 'rxjs'
import { opportunityData, OpportunityType } from './data'

@Component({
  selector: 'app-opportunities',
  imports: [PageBreadcrumb, CommonModule, FormsModule, CustomPagination, Icon, NgbSortableHeader],
  providers: [TableService],
  templateUrl: './opportunities.html',
  styles: ``,
})
export class Opportunities {
  selectAll = false
  filterStage = 'All'
  filterStatus = 'All'
  filterPriority = 'All'

  opportunityData = opportunityData

  opportunityData$: Observable<OpportunityType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<OpportunityType>) {
    this.opportunityData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(this.opportunityData, 8)
  }

  protected readonly toPascalCase = toPascalCase
}
