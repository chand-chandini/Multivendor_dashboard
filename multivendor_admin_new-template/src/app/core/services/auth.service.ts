import { API_CONFIG, STORAGE_KEYS } from '@/app/config/api.config'
import { HttpClient } from '@angular/common/http'
import { computed, inject, Injectable, signal } from '@angular/core'
import { Router } from '@angular/router'
import { AdminUser, LoginResponse, MenuNode, ModulePermission, TenantInfo } from '@core/models/multivendor.model'
import { BrandingService } from '@core/services/branding.service'
import { Observable, tap } from 'rxjs'

/**
 * Authenticates against the existing Multivendor backend
 * (`POST /dashboard_api/getUserData`, mobile number + password) and keeps the
 * resulting session — JWT, admin user, permission-driven menu tree and tenant
 * branding — available to the rest of the app.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private http = inject(HttpClient)
  private router = inject(Router)
  private branding = inject(BrandingService)

  private readonly _token = signal<string | null>(this.read<string>(STORAGE_KEYS.token))
  private readonly _user = signal<AdminUser | null>(this.readJson<AdminUser>(STORAGE_KEYS.user))
  private readonly _menu = signal<MenuNode[]>(this.readJson<MenuNode[]>(STORAGE_KEYS.menu) ?? [])
  private readonly _permissions = signal<ModulePermission[]>(this.readJson<ModulePermission[]>(STORAGE_KEYS.permissions) ?? [])
  private readonly _tenant = signal<TenantInfo | null>(this.readJson<TenantInfo>(STORAGE_KEYS.tenant))

  readonly token = this._token.asReadonly()
  readonly user = this._user.asReadonly()
  // Ignore retired module entries in sessions cached before their removal.
  readonly menu = computed(() => this._menu()
    .filter((node) => node.path !== '/masters/deliveryslots')
    .filter((node) => !node.children?.length || node.children.some((child) => child.path !== '/masters/deliveryslots'))
    .map((node) => ({ ...node, children: node.children?.filter((child) => child.path !== '/masters/deliveryslots') })))
  readonly permissions = computed(() => this._permissions().filter((permission) => permission.path !== '/masters/deliveryslots'))
  readonly tenant = this._tenant.asReadonly()

  readonly userName = computed(() => this._user()?.name ?? 'Admin')
  /** `admin_users_t.designation` — the login user/admin type. */
  readonly adminType = computed(() => this._user()?.designation ?? 'Admin')
  readonly tenantId = computed(() => this._user()?.tenant_id ?? null)
  readonly userId = computed(() => this._user()?.id ?? null)

  /** Signs in with mobile number + password against the existing login API. */
  login(mobileNumber: string, password: string): Observable<LoginResponse> {
    return this.http
     .post<LoginResponse>(`${API_CONFIG.baseUrl}getUserData`, {
  number: mobileNumber,
  password: password,
})
      .pipe(
        tap((res) => {
          if (res.status === 200 && res.token) {
            this.setSession(res)
          }
        })
      )
  }

  /** Stores the session produced by the login API. */
  setSession(res: LoginResponse): void {
    const user = res.usr_data?.[0] ?? null

    this._token.set(res.token ?? null)
    this._user.set(user)
    this._menu.set(res.data ?? [])
    this._permissions.set(res.permissions ?? [])
    this._tenant.set(res.tenant ?? null)

    this.write(STORAGE_KEYS.token, res.token ?? '')
    this.writeJson(STORAGE_KEYS.user, user)
    this.writeJson(STORAGE_KEYS.menu, res.data ?? [])
    this.writeJson(STORAGE_KEYS.permissions, res.permissions ?? [])
    this.writeJson(STORAGE_KEYS.tenant, res.tenant ?? null)

    this.applyTenantBranding()
  }

  /**
   * Pushes the signed-in tenant's branding — name, logos, favicon, login
   * background and brand colour — into BrandingService, which falls back to
   * Ekart360 for anything the tenant has not configured.
   */
  applyTenantBranding(): void {
    const tenant = this._tenant()
    if (!tenant) {
      this.branding.reset()
      return
    }

    // `tenant_settings.primary_color` is the older home for the brand colour;
    // `tenant_branding` wins when both are set.
    const branding = { ...(tenant.branding ?? {}) }
    if (!branding['primary_color'] && tenant.settings?.['primary_color']) {
      branding['primary_color'] = tenant.settings['primary_color']
    }

    this.branding.applyTenant(tenant.name, branding)
  }

  /** Replaces the stored tenant info, e.g. after Settings saves new branding. */
  setTenant(tenant: TenantInfo): void {
    this._tenant.set(tenant)
    this.writeJson(STORAGE_KEYS.tenant, tenant)
    this.applyTenantBranding()
  }

  /** First route the user is allowed to land on, derived from their menu tree. */
  firstAllowedPath(): string | null {
    for (const node of this.menu()) {
      const child = node.children?.find((c) => !!c.path)
      if (child?.path) return child.path
      if (!node.children?.length && node.path) return node.path
    }
    return null
  }

  isAuthenticated(): boolean {
    return !!this._token()
  }

  /** Clears the session without navigating — used by the 401 interceptor. */
  clearSession(): void {
    this._token.set(null)
    this._user.set(null)
    this._menu.set([])
    this._permissions.set([])
    this._tenant.set(null)

    Object.values(STORAGE_KEYS).forEach((key) => {
      try {
        localStorage.removeItem(key)
      } catch {
        /* storage unavailable */
      }
    })

    // The sign-in page re-resolves branding from the host on its own.
    this.branding.reset()
  }

  logout(): void {
    this.clearSession()
    this.router.navigate(['/auth/sign-in'])
  }

  private read<T extends string>(key: string): T | null {
    try {
      return (localStorage.getItem(key) as T) || null
    } catch {
      return null
    }
  }

  private readJson<T>(key: string): T | null {
    try {
      const raw = localStorage.getItem(key)
      return raw ? (JSON.parse(raw) as T) : null
    } catch {
      return null
    }
  }

  private write(key: string, value: string): void {
    try {
      localStorage.setItem(key, value)
    } catch {
      /* storage unavailable */
    }
  }

  private writeJson(key: string, value: unknown): void {
    this.write(key, JSON.stringify(value ?? null))
  }
}
