import { Component } from '@angular/core'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { Account } from './components/account/account'
import { Sidebar } from './components/sidebar/sidebar'

@Component({
  selector: 'app-profile',
  imports: [PageBreadcrumb, Sidebar, Account],
  templateUrl: './profile.html',
  styles: ``,
})
export class Profile {}
