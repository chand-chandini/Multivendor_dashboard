import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-cards',
  imports: [PageBreadcrumb, RouterLink],
  templateUrl: './cards.html',
  styles: ``,
})
export class Cards {}
