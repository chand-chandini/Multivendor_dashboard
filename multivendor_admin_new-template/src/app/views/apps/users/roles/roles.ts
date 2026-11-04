import { Component, inject, TemplateRef } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'
import { UserRoleCard } from './components/user-role-card/user-role-card'
import { UserTable } from './components/user-table/user-table'
import { memberRoleData } from './data'

@Component({
  selector: 'app-roles',
  imports: [UserRoleCard, UserTable, Icon, RouterLink],
  templateUrl: './roles.html',
  styles: ``,
})
export class Roles {
  memberRoleData = memberRoleData
  private modalService = inject(NgbModal)

  addRoleModal(content: TemplateRef<any>) {
    this.modalService.open(content, { size: 'lg' })
  }
}
