import { Component, inject, Input } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrandingService } from '@core/services/branding.service'

@Component({
  selector: 'app-page-breadcrumb',
  imports: [RouterLink],
  templateUrl: './page-breadcrumb.html',
  styles: ``,
})
export class PageBreadcrumb {
  /** Breadcrumb root: the signed-in tenant's business name. */
  protected branding = inject(BrandingService)
  @Input() title: string = 'Welcome!'
  @Input() subTitle: string | null = null
}
