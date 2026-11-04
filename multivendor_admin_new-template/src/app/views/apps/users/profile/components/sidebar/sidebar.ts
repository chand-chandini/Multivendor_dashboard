import { META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { skillData } from '../../data'
import { SocialIcons } from '../social-icons/social-icons'

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, NgbDropdownModule, Icon, SocialIcons],
  templateUrl: './sidebar.html',
  styles: ``,
})
export class Sidebar {
  username = META_DATA.username
  skillData = skillData
}
