import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'

@Component({
  selector: 'app-account-settings',
  imports: [PageBreadcrumb, RouterLink, Icon],
  templateUrl: './account-settings.html',
  styles: ``,
})
export class AccountSettings {}
