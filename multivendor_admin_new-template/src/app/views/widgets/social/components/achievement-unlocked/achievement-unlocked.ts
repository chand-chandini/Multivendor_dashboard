import { Icon } from '@/app/components/icon/icon'
import { META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-achievement-unlocked',
  imports: [RouterLink, Icon],
  templateUrl: './achievement-unlocked.html',
  styles: ``,
})
export class AchievementUnlocked {
  username = META_DATA.username
}
