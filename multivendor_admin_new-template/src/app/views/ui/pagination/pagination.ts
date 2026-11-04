import { Component } from '@angular/core'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbPaginationModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-pagination',
  imports: [PageBreadcrumb, NgbPaginationModule, Icon],
  templateUrl: './pagination.html',
  styles: ``,
})
export class Pagination {}
