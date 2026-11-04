import { META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-staff-profile',
  imports: [PageBreadcrumb, RouterLink, NgbDropdownModule, Icon],
  templateUrl: './staff-profile.html',
  styles: ``,
})
export class StaffProfile {
  username = META_DATA.username
}
