import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { NgbSortableHeader } from '@/app/core/directive/sortable.directive'
import { TableService } from '@/app/core/services/table.service'
import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'
import { orderData, OrderType } from '../../data'

@Component({
  selector: 'app-recent-orders',
  imports: [RouterLink, Icon, CustomPagination, NgbSortableHeader, AsyncPipe],
  providers: [TableService],
  templateUrl: './recent-orders.html',
  styles: ``,
})
export class RecentOrders {
  orderData = orderData
  orderData$: Observable<OrderType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<OrderType>) {
    this.orderData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.orderData), 5)
  }

  protected readonly toPascalCase = toPascalCase
}
