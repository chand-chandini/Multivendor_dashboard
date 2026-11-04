import { toTitleCase } from '@/app/utils/string'
import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbPopoverModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-popovers',
  imports: [PageBreadcrumb, NgbPopoverModule],
  templateUrl: './popovers.html',
  styles: ``,
})
export class Popovers {
  popoverVariants = ['primary', 'success', 'danger', 'info ', 'dark', 'secondary']
  protected readonly toTitleCase = toTitleCase
}
