import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-activities',
  imports: [PageBreadcrumb, Icon, RouterLink],
  templateUrl: './activities.html',
  styles: ``,
})
export class Activities {}
