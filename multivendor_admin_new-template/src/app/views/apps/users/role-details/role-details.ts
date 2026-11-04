import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { UserRoleDetailsCard } from './components/user-role-details-card/user-role-details-card'
import { UserRoleDetailsTable } from './components/user-role-details-table/user-role-details-table'

@Component({
  selector: 'app-role-details',
  imports: [Icon, NgbDropdownModule, UserRoleDetailsCard, UserRoleDetailsTable, RouterLink],
  templateUrl: './role-details.html',
  styles: ``,
})
export class RoleDetails {}
