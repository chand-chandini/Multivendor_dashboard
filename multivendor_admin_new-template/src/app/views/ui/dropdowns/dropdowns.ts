import { toTitleCase } from '@/app/utils/string'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-dropdowns',
  imports: [PageBreadcrumb, NgbDropdownModule, RouterLink, Icon],
  templateUrl: './dropdowns.html',
  styles: ``,
})
export class Dropdowns {
  dropdownVariants = [
    { name: 'primary', soft: false, class: 'primary' },
    { name: 'secondary', soft: false, class: 'light' },
    { name: 'success', soft: true, class: 'success' },
    { name: 'info', soft: false, class: 'info' },
  ]

  dropdownVariants1 = [
    { name: 'primary', class: 'primary' },
    { name: 'secondary', class: 'light' },
    { name: 'success', class: 'success' },
  ]
  protected readonly toTitleCase = toTitleCase
}
