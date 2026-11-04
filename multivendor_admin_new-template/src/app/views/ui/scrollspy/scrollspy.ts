import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbDropdownModule, NgbScrollSpyModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-scrollspy',
  imports: [PageBreadcrumb, NgbScrollSpyModule, NgbDropdownModule, RouterLink],
  templateUrl: './scrollspy.html',
  styles: ``,
})
export class Scrollspy {}
