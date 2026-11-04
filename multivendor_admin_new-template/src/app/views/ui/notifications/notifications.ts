import { Component } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbToastModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-notifications',
  imports: [PageBreadcrumb, NgbToastModule, FormsModule],
  templateUrl: './notifications.html',
  styles: ``,
})
export class Notifications {
  liveToast = false
  showToast = true
  showToast2 = true
  showToast3 = true
  placement = true
  toastPlacement: string = ''
  close() {
    this.showToast = false
  }
}
