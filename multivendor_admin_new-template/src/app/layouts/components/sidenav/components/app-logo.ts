import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrandingService } from '@core/services/branding.service'

/**
 * Sidebar brand mark. The images come from the signed-in tenant's branding and
 * fall back to Ekart360; the markup and classes are the template's own, so the
 * collapsed/expanded and light/dark behaviour is unchanged.
 */
@Component({
  selector: 'app-logo',
  imports: [RouterLink],
  template: `
    <a routerLink="/" class="logo">
      <span class="logo logo-light">
        <span class="logo-lg"><img [src]="branding.logoLight()" [alt]="branding.name()" /></span>
        <span class="logo-sm"><img [src]="branding.logoIcon()" [alt]="branding.name()" /></span>
      </span>

      <span class="logo logo-dark">
        <span class="logo-lg"><img [src]="branding.logoDark()" [alt]="branding.name()" /></span>
        <span class="logo-sm"><img [src]="branding.logoIcon()" [alt]="branding.name()" /></span>
      </span>
    </a>
  `,
  styles: ``,
})
export class AppLogo {
  protected branding = inject(BrandingService)
}
