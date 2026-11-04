import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { NgbSortableHeader } from '@/app/core/directive/sortable.directive'
import { TableService } from '@/app/core/services/table.service'
import { AsyncPipe } from '@angular/common'
import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'
import { saleExecutiveData, SaleExecutiveType } from '../../data'

@Component({
  selector: 'app-top-performing',
  imports: [Icon, NgbSortableHeader, FormsModule, RouterLink, CustomPagination, AsyncPipe],
  providers: [TableService],
  templateUrl: './top-performing.html',
  styles: ``,
})
export class TopPerforming {
  saleExecutiveData = saleExecutiveData
  saleExecutiveData$: Observable<SaleExecutiveType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<SaleExecutiveType>) {
    this.saleExecutiveData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.saleExecutiveData), 5)
  }
}
