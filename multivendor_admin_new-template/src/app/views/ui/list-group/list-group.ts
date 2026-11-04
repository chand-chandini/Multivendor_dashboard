import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-list-group',
  imports: [PageBreadcrumb, RouterLink],
  templateUrl: './list-group.html',
  styles: ``,
})
export class ListGroup {}
