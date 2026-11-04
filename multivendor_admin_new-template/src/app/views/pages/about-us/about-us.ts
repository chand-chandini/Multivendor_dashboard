import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { Branch } from './components/branch/branch'
import { Service } from './components/service/service'
import { Team } from './components/team/team'

@Component({
  selector: 'app-about-us',
  imports: [PageBreadcrumb, Service, Team, Branch, Icon, RouterLink],
  templateUrl: './about-us.html',
  styles: ``,
})
export class AboutUs {}
