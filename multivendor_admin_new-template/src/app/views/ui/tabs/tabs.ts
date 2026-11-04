import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-tabs',
  imports: [PageBreadcrumb, NgbNavModule, RouterLink, Icon],
  templateUrl: './tabs.html',
  styles: ``,
})
export class Tabs {}
