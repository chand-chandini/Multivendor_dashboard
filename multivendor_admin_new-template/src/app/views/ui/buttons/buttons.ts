import { TitleCasePipe } from '@angular/common'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-buttons',
  imports: [PageBreadcrumb, RouterLink, Icon, TitleCasePipe, NgbDropdownModule],
  templateUrl: './buttons.html',
  styles: ``,
})
export class Buttons {
  colorsVariants: string[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'light', 'dark']
  colorsVariants1: string[] = ['primary', 'secondary', 'success', 'danger', 'warning', 'info', 'dark']
}
