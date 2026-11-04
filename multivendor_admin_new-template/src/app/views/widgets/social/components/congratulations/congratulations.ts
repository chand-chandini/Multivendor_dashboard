import { Icon } from '@/app/components/icon/icon'
import { META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'

@Component({
  selector: 'app-congratulations',
  imports: [Icon, RouterLink],
  templateUrl: './congratulations.html',
  styles: ``,
})
export class Congratulations {
  username = META_DATA.username
}
