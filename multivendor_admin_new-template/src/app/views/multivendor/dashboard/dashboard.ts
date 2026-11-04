import { Component, computed, inject, OnInit, signal } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { AuthService } from '@core/services/auth.service'
import { MultivendorService } from '@core/services/multivendor.service'
import { PermissionService } from '@core/services/permission.service'
import { CountUpDirective } from 'ngx-countup'

type DashboardStat = {
  title: string
  value: number
  icon: string
  link: string
}

/**
 * Tenant dashboard. Counts come from GET /dashboard_api/getDashboard; the
 * shortcut tiles only link to modules the signed-in admin may view.
 */
@Component({
  selector: 'app-mv-dashboard',
  imports: [PageBreadcrumb, Icon, RouterLink, CountUpDirective],
  templateUrl: './dashboard.html',
  styles: ``,
})
export class Dashboard implements OnInit {
  private api = inject(MultivendorService)
  private permissions = inject(PermissionService)
  protected auth = inject(AuthService)

  readonly loading = signal(true)
  private readonly counts = signal<Record<string, number>>({})

  readonly stats = computed<DashboardStat[]>(() => {
    const counts = this.counts()
    return [
      { title: 'Locations', value: counts['location_count'] ?? 0, icon: 'map-pin', link: '/masters/locations' },
      { title: 'Categories', value: counts['category_count'] ?? 0, icon: 'category', link: '/masters/categories' },
      { title: 'Vendors', value: counts['vendor_count'] ?? 0, icon: 'building-store', link: '/masters/vendors' },
      // 👇 ADDED FRANCHISES STAT CARD HERE
      { title: 'Franchises', value: counts['franchise_count'] ?? 0, icon: 'users', link: '/masters/franchise/franchise-list' },
      { title: 'Support Tickets', value: counts['total_tickets'] ?? 0, icon: 'headset', link: '/masters/devsupport' },
    ].filter((stat) => this.permissions.canView(stat.link))
  })

  /** Sidebar modules rendered as quick-access shortcuts. */
  readonly shortcuts = computed(() =>
    this.permissions
      .menu()
      .flatMap((module) => (module.children?.length ? module.children : [module]))
      .filter((node) => !!node.path)
  )

  ngOnInit(): void {
    this.api.getDashboard().subscribe({
      next: (res) => {
        this.loading.set(false)
        if (res.status === 200) {
          this.counts.set((res.data as Record<string, number>) ?? {})
        }
      },
      error: () => this.loading.set(false),
    })
  }
}