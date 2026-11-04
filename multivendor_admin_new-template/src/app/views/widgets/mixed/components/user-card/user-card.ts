import { Icon } from '@/app/components/icon/icon'
import { Component, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { UserType } from '../../data'

@Component({
  selector: 'app-user-card',
  imports: [Icon, RouterLink, NgbDropdownModule],
  templateUrl: './user-card.html',
  styles: ``,
})
export class UserCard {
  @Input() item!: UserType
}
