import { Icon } from '@/app/components/icon/icon'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { SimplebarAngularModule } from 'simplebar-angular'
import { browserData } from '../../data'

@Component({
  selector: 'app-browser-session',
  imports: [RouterLink, Icon, SimplebarAngularModule, NgbDropdownModule],
  templateUrl: './browser-session.html',
  styles: ``,
})
export class BrowserSession {
  browserData = browserData
}
