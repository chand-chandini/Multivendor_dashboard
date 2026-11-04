import { currentYear, META_DATA } from '@/app/constants'
import { Component, inject, OnInit, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { ActivatedRoute, Router, RouterLink } from '@angular/router'
import { AuthService } from '@core/services/auth.service'
import { BrandingService } from '@core/services/branding.service'
import { MultivendorService } from '@core/services/multivendor.service'

/**
 * Multivendor sign-in: mobile number + password, authenticated by the existing
 * backend (POST /dashboard_api/getUserData). On success the response carries
 * the JWT, the admin user and the permission-driven module tree, which
 * AuthService stores and the sidebar renders.
 *
 * Before anyone signs in there is no token, so the page asks the public
 * `getloginbranding` endpoint which tenant owns the host it is served from and
 * wears that tenant's logo, background and brand colour. With no match it stays
 * on the Ekart360 default.
 */
@Component({
  selector: 'app-sign-in',
  imports: [RouterLink, ReactiveFormsModule],
  templateUrl: './sign-in.html',
  styles: ``,
})
export class SignIn implements OnInit {
  private auth = inject(AuthService)
  private api = inject(MultivendorService)
  private router = inject(Router)
  private route = inject(ActivatedRoute)
  private fb = inject(FormBuilder)
  protected branding = inject(BrandingService)

  currentYear = currentYear
  author = META_DATA.author

  readonly error = signal('')
  readonly submitting = signal(false)

  readonly form = this.fb.nonNullable.group({
    mobile: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    password: ['', [Validators.required, Validators.pattern(/\S/)]],
  })

  ngOnInit(): void {
    this.loadHostBranding()
  }

  /** Dresses the sign-in page in the branding of whoever owns this host. */
  private loadHostBranding(): void {
    const override = this.route.snapshot.queryParamMap.get('tenant')
    this.branding.reset()

    this.api.getLoginBranding(window.location.hostname, override).subscribe({
      next: (res) => {
        if (res.status === 200 && res.data) {
          this.branding.applyTenant(res.data.name, res.data.branding)
        }
      },
      // An unreachable lookup must never block sign-in; the default stands.
      error: () => {},
    })
  }

  /** Keeps the mobile field numeric, matching the backend's expected format. */
  numericOnly(event: KeyboardEvent): boolean {
    return /^\d$/.test(event.key)
  }

  onSubmit() {
    this.error.set('')

    if (this.form.invalid) {
      this.form.markAllAsTouched()
      return
    }

    const { mobile, password } = this.form.getRawValue()
    this.submitting.set(true)

    this.auth.login(mobile, password).subscribe({
      next: (res) => {
        this.submitting.set(false)

        if (res.status === 200) {
          const landing = this.auth.firstAllowedPath()
          this.router.navigateByUrl(landing ?? '/error/403')
          return
        }

        this.error.set(res.message || 'The mobile number or password you entered is incorrect.')
      },
      error: () => {
        this.submitting.set(false)
        this.error.set('Unable to reach the server. Please try again.')
      },
    })
  }
}
