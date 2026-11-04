import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-colors',
  imports: [PageBreadcrumb, RouterLink],
  templateUrl: './colors.html',
  styles: ``,
})
export class Colors {}
