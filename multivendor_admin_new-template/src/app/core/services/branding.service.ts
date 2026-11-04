import { DOCUMENT } from '@angular/common'
import { computed, inject, Injectable, signal } from '@angular/core'
import { LayoutService } from '@core/services/layout.service'

/** Everything the dashboard shows that a tenant may brand. */
export type Brand = {
  /** Business name, shown in the title bar, breadcrumb root and sign-in page. */
  name: string
  /** Logo for dark backgrounds (dark sidebar / dark mode). */
  logoLight: string
  /** Logo for light backgrounds. */
  logoDark: string
  /** Square mark for the collapsed sidebar. */
  logoIcon: string
  /** Browser tab icon. */
  favicon: string
  /** Sign-in page background image. */
  loginBg: string
  /** Brand colour, or null to leave the template/skin colour alone. */
  primaryColor: string | null
}

/**
 * Our own branding, used by Super Admin and by any tenant that has not
 * configured its own. Nothing here is tenant-specific.
 */
export const DEFAULT_BRAND: Brand = {
  name: 'Ekart360',
  logoLight: 'assets/images/brand/ekart360-logo.png',
  logoDark: 'assets/images/brand/ekart360-logo.png',
  logoIcon: 'assets/images/brand/ekart360-icon.png',
  favicon: 'assets/images/brand/ekart360-icon.png',
  loginBg: '',
  primaryColor: null,
}

/** The `tenant_branding` columns this service reads. */
export type TenantBranding = {
  logo_light?: string | null
  logo_dark?: string | null
  logo_icon?: string | null
  favicon?: string | null
  login_bg_image?: string | null
  primary_color?: string | null
  [key: string]: unknown
}

/**
 * The single branding source for the dashboard.
 *
 * Branding is never hard-coded per tenant: it arrives either with the login
 * response (`tenant.branding`) or, before sign-in, from the public
 * `getloginbranding` lookup. Anything a tenant leaves blank falls back to
 * DEFAULT_BRAND, so an unconfigured tenant shows Ekart360.
 *
 * The brand colour is applied through the template's own theme variables
 * (`--theme-primary` and the subtle/emphasis shades derived from it, which
 * every button, badge, alert and link already reads). No second theme system
 * is introduced, and the derived shades are recomputed on light/dark switch so
 * both modes stay correct.
 */
@Injectable({
  providedIn: 'root',
})
export class BrandingService {
  private document = inject(DOCUMENT)
  private layout = inject(LayoutService)

  private readonly _brand = signal<Brand>(DEFAULT_BRAND)

  readonly brand = this._brand.asReadonly()
  readonly name = computed(() => this._brand().name)
  readonly logoLight = computed(() => this._brand().logoLight)
  readonly logoDark = computed(() => this._brand().logoDark)
  readonly logoIcon = computed(() => this._brand().logoIcon)
  readonly loginBg = computed(() => this._brand().loginBg)
  /** True while the default (non-tenant) branding is in effect. */
  readonly isDefault = computed(() => this._brand() === DEFAULT_BRAND)

  constructor() {
    // The subtle/emphasis shades differ between light and dark, so re-derive
    // them whenever the template's theme state changes.
    this.layout.layoutState$.subscribe(() => this.applyColor())
  }

  /**
   * Applies a tenant's branding over the defaults. Blank columns fall back,
   * so a partially configured tenant still looks complete.
   */
  applyTenant(name: string | null | undefined, branding: TenantBranding | null | undefined): void {
    const b = branding ?? {}
    const logo = pick(b.logo_light) ?? pick(b.logo_dark)

    this._brand.set({
      name: pick(name) ?? DEFAULT_BRAND.name,
      logoLight: pick(b.logo_light) ?? logo ?? DEFAULT_BRAND.logoLight,
      logoDark: pick(b.logo_dark) ?? logo ?? DEFAULT_BRAND.logoDark,
      logoIcon: pick(b.logo_icon) ?? DEFAULT_BRAND.logoIcon,
      favicon: pick(b.favicon) ?? pick(b.logo_icon) ?? DEFAULT_BRAND.favicon,
      loginBg: pick(b.login_bg_image) ?? DEFAULT_BRAND.loginBg,
      primaryColor: normalizeHex(b.primary_color),
    })

    this.apply()
  }

  /** Back to Ekart360 — used on sign-out and when no tenant is resolved. */
  reset(): void {
    this._brand.set(DEFAULT_BRAND)
    this.apply()
  }

  private apply(): void {
    this.applyFavicon()
    this.applyColor()
  }

  private applyFavicon(): void {
    const href = this._brand().favicon
    if (!href) return

    const head = this.document.head
    let link = head.querySelector<HTMLLinkElement>("link[rel~='icon']")
    if (!link) {
      link = this.document.createElement('link')
      link.rel = 'icon'
      head.appendChild(link)
    }
    // Data URIs carry their own type; a bundled asset is a PNG.
    link.type = href.startsWith('data:') ? href.slice(5, href.indexOf(';')) || 'image/png' : 'image/png'
    link.href = href
  }

  /**
   * Writes the brand colour onto `<html>` as the template's own theme
   * variables. Inline custom properties outrank the stylesheet's `:root`,
   * `[data-bs-theme]` and `[data-skin]` blocks, so one set of writes covers
   * light mode, dark mode and every skin.
   */
  private applyColor(): void {
    const style = this.document.documentElement.style
    const color = this._brand().primaryColor

    const vars = ['--theme-primary', '--theme-primary-rgb', '--theme-primary-text-emphasis', '--theme-primary-bg-subtle', '--theme-primary-border-subtle', '--theme-link-color', '--theme-link-hover-color']

    if (!color) {
      // No tenant colour: hand the palette back to the template and its skins.
      vars.forEach((name) => style.removeProperty(name))
      return
    }

    const rgb = hexToRgb(color)
    if (!rgb) return

    const dark = this.isDarkMode()
    // Same formulas the template's SCSS uses for the light and dark palettes.
    const emphasis = dark ? tint(rgb, 0.4) : shade(rgb, 0.15)
    const bgSubtle = dark ? `rgba(${rgb.join(', ')}, 0.2)` : rgbString(tint(rgb, 0.85))
    const borderSubtle = dark ? rgbString(shade(rgb, 0.4)) : rgbString(tint(rgb, 0.6))

    style.setProperty('--theme-primary', color)
    style.setProperty('--theme-primary-rgb', rgb.join(', '))
    style.setProperty('--theme-primary-text-emphasis', rgbString(emphasis))
    style.setProperty('--theme-primary-bg-subtle', bgSubtle)
    style.setProperty('--theme-primary-border-subtle', borderSubtle)
    style.setProperty('--theme-link-color', color)
    style.setProperty('--theme-link-hover-color', rgbString(emphasis))
  }

  private isDarkMode(): boolean {
    return this.document.documentElement.getAttribute('data-bs-theme') === 'dark'
  }
}

/** Treats null, undefined and blank strings alike, so blanks fall back. */
function pick(value: unknown): string | null {
  const text = typeof value === 'string' ? value.trim() : ''
  return text ? text : null
}

/** Accepts `#rgb`, `#rrggbb` or a bare hex; anything else is ignored. */
function normalizeHex(value: unknown): string | null {
  const text = pick(value)
  if (!text) return null
  const hex = text.startsWith('#') ? text : '#' + text
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex) ? hex : null
}

function hexToRgb(hex: string): [number, number, number] | null {
  let value = hex.replace('#', '')
  if (value.length === 3) {
    value = value
      .split('')
      .map((c) => c + c)
      .join('')
  }
  if (value.length !== 6) return null
  const int = parseInt(value, 16)
  if (Number.isNaN(int)) return null
  return [(int >> 16) & 255, (int >> 8) & 255, int & 255]
}

/** Mixes towards white, matching SCSS `tint-color`. */
function tint([r, g, b]: [number, number, number], weight: number): [number, number, number] {
  return [r + (255 - r) * weight, g + (255 - g) * weight, b + (255 - b) * weight]
}

/** Mixes towards black, matching SCSS `shade-color`. */
function shade([r, g, b]: [number, number, number], weight: number): [number, number, number] {
  return [r * (1 - weight), g * (1 - weight), b * (1 - weight)]
}

function rgbString(rgb: [number, number, number]): string {
  return `rgb(${rgb.map((c) => Math.round(c)).join(', ')})`
}
