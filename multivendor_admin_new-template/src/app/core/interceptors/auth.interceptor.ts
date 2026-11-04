import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http'
import { inject } from '@angular/core'
import { Router } from '@angular/router'
import { AuthService } from '@core/services/auth.service'
import { catchError, throwError } from 'rxjs'

/**
 * Attaches the Multivendor JWT to every API call and drops the session when the
 * backend rejects it - matching the existing dashboard_api auth middleware.
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService)
  const router = inject(Router)

  const token = auth.token()
  const authorized = token
    ? req.clone({
        setHeaders: { Authorization: 'Bearer ' + token },
      })
    : req

  return next(authorized).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        auth.clearSession()
        router.navigate(['/auth/sign-in'])
      }
      return throwError(() => error)
    })
  )
}
