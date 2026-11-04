import { DecimalPipe } from '@angular/common'
import { provideHttpClient, withInterceptors } from '@angular/common/http'
import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core'
import { provideAnimations } from '@angular/platform-browser/animations'
import { provideRouter } from '@angular/router'
import { authInterceptor } from '@core/interceptors/auth.interceptor'
import { provideDaterangepickerLocale } from 'ngx-daterangepicker-bootstrap'
import { routes } from './app.routes'

export const appConfig: ApplicationConfig = {
  providers: [
    DecimalPipe,
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideAnimations(),
    provideDaterangepickerLocale({
      separator: ' - ',
      cancelLabel: 'Cancel',
    }),
  ],
}
