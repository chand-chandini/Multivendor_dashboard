import { computed, inject, Injectable, signal } from '@angular/core'
import { NavigationEnd, Router } from '@angular/router'
import { filter } from 'rxjs'
import { MenuNode, ModulePermission, PermissionAction, PermissionFlags } from '@core/models/multivendor.model'
import { AuthService } from '@core/services/auth.service'

const NO_ACCESS: PermissionFlags = { can_view: 0, can_add: 0, can_edit: 0, can_delete: 0 }

/**
 * Reads the permission data returned by the existing Multivendor backend
 * (admin_user_permissions joined onto admin_main_module / admin_sub_module)
 * and answers the two questions the UI asks: which modules may this user see,
 * and which of view/add/edit/delete may they perform on a given route.
 */
@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private auth = inject(AuthService)
  private router = inject(Router)

  /**
   * The active URL as a signal, so permission-driven templates re-evaluate on
   * navigation the same way the sidebar does.
   */
  private readonly currentUrl = signal(this.router.url)

  constructor() {
    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event) => {
      this.currentUrl.set((event as NavigationEnd).urlAfterRedirects)
    })
  }

  /** The permission-driven sidebar tree, exactly as the API built it. */
  readonly menu = this.auth.menu

  /** Flat permission rows keyed by route path, for O(1) lookups. */
  private readonly byPath = computed(() => {
    const map = new Map<string, ModulePermission>()
    for (const permission of this.auth.permissions()) {
      if (permission.path) {
        map.set(normalize(permission.path), permission)
      }
    }
    return map
  })

  /** Every route path this user is allowed to open. */
  readonly allowedPaths = computed(() => Array.from(this.byPath().keys()))

  /** Permission flags for a route path (defaults to the current route). */
  flagsFor(path?: string): PermissionFlags {
    const key = normalize(path ?? this.currentUrl())
    const direct = this.byPath().get(key)
    if (direct) return direct

    // Fall back to the closest ancestor, so detail routes such as
    // /masters/orders/123 inherit the permissions of /masters/orders.
    let candidate: PermissionFlags | undefined
    let bestLength = -1
    for (const [permissionPath, permission] of this.byPath()) {
      if (key.startsWith(permissionPath + '/') && permissionPath.length > bestLength) {
        candidate = permission
        bestLength = permissionPath.length
      }
    }
    return candidate ?? NO_ACCESS
  }

  /** True when the user may perform action on path (default: current route). */
  can(action: PermissionAction, path?: string): boolean {
    const flags = this.flagsFor(path)
    switch (action) {
      case 'view':
        return flags.can_view === 1
      case 'add':
        return flags.can_add === 1
      case 'edit':
        return flags.can_edit === 1
      case 'delete':
        return flags.can_delete === 1
    }
  }

 canView(path?: string): boolean {
  const key = normalize(path ?? this.currentUrl())

  // First use explicit CRUD permissions when the backend provides them.
  const explicit = this.byPath().get(key)
  if (explicit) {
    return explicit.can_view === 1
  }

  // The login API currently provides allowed routes through `data`
  // but does not return a separate `permissions` array.
  // Therefore, use the menu tree for view access.
  return this.hasMenuPath(this.menu(), key)
}
private hasMenuPath(nodes: MenuNode[], path: string): boolean {
  for (const node of nodes) {
    if (node.path && normalize(node.path) === path) {
      return true
    }

    if (node.children?.length && this.hasMenuPath(node.children, path)) {
      return true
    }
  }

  return false
}
  canAdd(path?: string): boolean {
    return this.can('add', path)
  }

  canEdit(path?: string): boolean {
    return this.can('edit', path)
  }

  canDelete(path?: string): boolean {
    return this.can('delete', path)
  }

  /** True when the given menu node - or any of its children - is the active route. */
  isNodeActive(node: MenuNode, url: string = this.currentUrl()): boolean {
    const current = normalize(url)
    if (node.path && (current === normalize(node.path) || current.startsWith(normalize(node.path) + '/'))) {
      return true
    }
    return (node.children ?? []).some((child) => this.isNodeActive(child, url))
  }
}

/** Strips the query string and normalises to a single leading slash. */
function normalize(path: string): string {
  const withoutQuery = path.split('?')[0].split('#')[0]
  const trimmed = withoutQuery.replace(/\/+$/, '')
  if (!trimmed) return '/'
  return trimmed.startsWith('/') ? trimmed : '/' + trimmed
}
