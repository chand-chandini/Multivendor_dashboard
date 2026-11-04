import { Injectable } from '@angular/core'
import { ActivatedRouteSnapshot, CanActivate, Router, UrlTree } from '@angular/router'
import { AuthService } from './auth.service'

/**
 * Blocks the dashboard shell until the user holds a valid Multivendor session.
 */
@Injectable({
  providedIn: 'root',
})
export class AuthGuard implements CanActivate {
  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  canActivate(route: ActivatedRouteSnapshot): boolean | UrlTree {
    if (this.auth.isAuthenticated()) {
      return true
    }
    return this.router.createUrlTree(['/auth/sign-in'], {
      queryParams: route.queryParams,
      queryParamsHandling: 'merge',
    })
  }
}
