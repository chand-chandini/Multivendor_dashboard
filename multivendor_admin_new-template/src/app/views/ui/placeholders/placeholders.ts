import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-placeholders',
  imports: [PageBreadcrumb, RouterLink],
  templateUrl: './placeholders.html',
  styles: ``,
})
export class Placeholders {}
