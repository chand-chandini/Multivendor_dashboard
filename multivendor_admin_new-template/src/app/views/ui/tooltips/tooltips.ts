import { toTitleCase } from '@/app/utils/string'
import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { NgbTooltipModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-tooltips',
  imports: [PageBreadcrumb, NgbTooltipModule, RouterLink],
  templateUrl: './tooltips.html',
  styles: ``,
})
export class Tooltips {
  tooltipVariants = ['primary', 'danger', 'info', 'success', 'secondary', 'warning', 'dark']
  protected readonly toTitleCase = toTitleCase
}
