import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { NgbSortableHeader } from '@/app/core/directive/sortable.directive'
import { TableService } from '@/app/core/services/table.service'
import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'
import { transactionData, TransactionType } from '../../data'

@Component({
  selector: 'app-recent-transactions',
  imports: [Icon, FormsModule, NgbSortableHeader, RouterLink, AsyncPipe, CustomPagination],
  providers: [TableService],
  templateUrl: './recent-transactions.html',
  styles: ``,
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RecentTransactions {
  transactionStatus = 'All'
  transactionData = transactionData
  transactionData$: Observable<TransactionType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<TransactionType>) {
    this.transactionData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.transactionData), 8)
  }

  protected readonly toPascalCase = toPascalCase
}
