import { inject, Injectable } from '@angular/core'
import { CanActivate, Router, RouterStateSnapshot, UrlTree } from '@angular/router'
import { PermissionService } from '@core/services/permission.service'

/**
 * Keeps a user out of a module route their admin_user_permissions row does not
 * grant can_view on - the same rule the sidebar uses to hide it.
 */
@Injectable({
  providedIn: 'root',
})
export class PermissionGuard implements CanActivate {
  private permissions = inject(PermissionService)
  private router = inject(Router)

  canActivate(_route: unknown, state: RouterStateSnapshot): boolean | UrlTree {
    if (this.permissions.canView(state.url)) {
      return true
    }
    return this.router.createUrlTree(['/error/403'])
  }
}
