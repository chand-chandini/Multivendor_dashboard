import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'

@Component({
  selector: 'app-settings',
  imports: [RouterLink, Icon],
  templateUrl: './settings.html',
  styles: ``,
})
export class Settings {}
