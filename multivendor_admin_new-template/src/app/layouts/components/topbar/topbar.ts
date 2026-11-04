import { AfterViewInit, Component, ElementRef, HostListener, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { BrandingService } from '@core/services/branding.service'
import { LayoutService } from '@core/services/layout.service'

import { ThemeDropdown } from './components/theme-dropdown'

import { FullscreenToggler } from './components/fullscreen-toggler'
import { MonochromeToggler } from './components/monochrome-toggler'
import { UserDropdownDetailed } from './components/user-dropdown-detailed'

import { CustomizerToggler } from './components/customizer-toggler'
import { MenuToggler } from './components/menu-toggler'

/**
 * Topbar for the Multivendor dashboard.
 *
 * The template's demo widgets - the app mega-menus, the apps grid, the sample
 * notification feed, the language selector and the global search - are left out
 * because they list demo pages and sample data. Their components remain under
 * `topbar/components` if they are wired up to real data later.
 */
@Component({
  selector: 'app-topbar',
  imports: [RouterLink, ThemeDropdown, FullscreenToggler, MonochromeToggler, UserDropdownDetailed, CustomizerToggler, MenuToggler],
  template: `
    <header class="app-topbar">
      <div class="container-fluid topbar-menu">
        <div class="d-flex align-items-center gap-2">
          <!-- Topbar Brand Logo -->
          <div class="logo-topbar">
            <!-- Logo light -->
            <a routerLink="/" class="logo-light">
              <span class="logo-lg">
                <img [src]="branding.logoLight()" [alt]="branding.name()" />
              </span>
              <span class="logo-sm">
                <img [src]="branding.logoIcon()" [alt]="branding.name()" />
              </span>
            </a>

            <!-- Logo Dark -->
            <a routerLink="/" class="logo-dark">
              <span class="logo-lg">
                <img [src]="branding.logoDark()" [alt]="branding.name()" />
              </span>
              <span class="logo-sm">
                <img [src]="branding.logoIcon()" [alt]="branding.name()" />
              </span>
            </a>
          </div>

          <menu-toggler />
        </div>

        <div class="d-flex align-items-center gap-2">
          <theme-dropdown class="d-none d-sm-flex" />

          <fullscreen-toggler class="d-none d-md-flex" />

          <monochrome-toggler class="d-none d-xl-flex" />

          <customizer-toggler class="d-none d-sm-flex" />

          <user-dropdown-detailed />
        </div>
      </div>
    </header>
  `,
})
export class Topbar implements AfterViewInit {
  protected branding = inject(BrandingService)

  constructor(
    public layout: LayoutService,
    private el: ElementRef
  ) {}

  ngAfterViewInit() {
    this.handleScroll()
  }

  @HostListener('window:scroll', [])
  onWindowScroll() {
    this.handleScroll()
  }

  handleScroll() {
    const header: HTMLElement = this.el.nativeElement.querySelector('.app-topbar')

    if (!header) return

    if (window.scrollY >= 50) {
      header.classList.add('topbar-active')
    } else {
      header.classList.remove('topbar-active')
    }
  }
}
