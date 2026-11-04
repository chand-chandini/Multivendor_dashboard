import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-utilities',
  imports: [PageBreadcrumb, RouterLink],
  templateUrl: './utilities.html',
  styles: ``,
})
export class Utilities {}
