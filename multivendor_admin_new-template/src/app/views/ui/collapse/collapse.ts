import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbCollapseModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-collapse',
  imports: [NgbCollapseModule, PageBreadcrumb],
  templateUrl: './collapse.html',
  styles: ``,
})
export class Collapse {
  isCollapsed = false
  isHorizontal = true
  isFirstToggle = true
  isSecondToggle = true
}
