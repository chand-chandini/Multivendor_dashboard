import { currentYear, META_DATA } from '@/app/constants'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'

@Component({
  selector: 'app-reset-pass',
  imports: [RouterLink, Icon],
  templateUrl: './reset-pass.html',
  styles: ``,
})
export class ResetPass {
  currentYear = currentYear
  name = META_DATA.name
  author = META_DATA.author
}
