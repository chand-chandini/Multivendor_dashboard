import { META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { teamMemberData } from '../../data'

@Component({
  selector: 'app-team',
  imports: [],
  templateUrl: './team.html',
  styles: ``,
})
export class Team {
  username = META_DATA.username
  teamMemberData = teamMemberData
}
