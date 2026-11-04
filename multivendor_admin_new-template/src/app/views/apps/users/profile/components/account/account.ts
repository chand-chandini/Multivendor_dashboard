import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbNav, NgbNavContent, NgbNavItem, NgbNavLink, NgbNavOutlet } from '@ng-bootstrap/ng-bootstrap'
import { About } from '../about/about'
import { Settings } from '../settings/settings'
import { Timeline } from '../timeline/timeline'

@Component({
  selector: 'app-account',
  imports: [RouterLink, Timeline, About, Settings, NgbNavLink, NgbNavContent, NgbNavOutlet, NgbNavItem, NgbNav],
  templateUrl: './account.html',
  styles: ``,
})
export class Account {
  activeId = 'timeline'
}
