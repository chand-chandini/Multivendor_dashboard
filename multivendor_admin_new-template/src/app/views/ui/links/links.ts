import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-links',
  imports: [PageBreadcrumb, RouterLink],
  templateUrl: './links.html',
  styles: ``,
})
export class Links {}
