import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { NgbSortableHeader } from '@/app/core/directive/sortable.directive'
import { TableService } from '@/app/core/services/table.service'
import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { NgbProgressbarModule } from '@ng-bootstrap/ng-bootstrap'
import { Observable } from 'rxjs'
import { dealData, DealType } from '../../data'

@Component({
  selector: 'app-deal-status',
  imports: [Icon, RouterLink, NgbProgressbarModule, NgbSortableHeader, FormsModule, CustomPagination, AsyncPipe],
  providers: [TableService],
  templateUrl: './deal-status.html',
  styles: ``,
})
export class DealStatus {
  filterStage = 'All'
  dealData = dealData
  dealData$: Observable<DealType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<DealType>) {
    this.dealData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.dealData), 5)
  }

  protected readonly toPascalCase = toPascalCase
}
