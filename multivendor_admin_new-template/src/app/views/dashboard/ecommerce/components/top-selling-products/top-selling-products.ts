import { CustomPagination } from '@/app/components/custom-pagination/custom-pagination'
import { Icon } from '@/app/components/icon/icon'
import { TableService } from '@/app/core/services/table.service'
import { toPascalCase } from '@/app/utils/string'
import { AsyncPipe } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Observable } from 'rxjs'
import { productData, ProductType } from '../../data'

@Component({
  selector: 'app-top-selling-products',
  imports: [RouterLink, Icon, CustomPagination, AsyncPipe],
  providers: [TableService],
  templateUrl: './top-selling-products.html',
  styles: ``,
})
export class TopSellingProducts {
  productData = productData
  productData$: Observable<ProductType[]>
  total$: Observable<number>

  constructor(public tableService: TableService<ProductType>) {
    this.productData$ = this.tableService.items$
    this.total$ = this.tableService.total$
  }

  ngOnInit(): void {
    this.tableService.setItems(structuredClone(this.productData), 6)
  }

  protected readonly toPascalCase = toPascalCase
}
