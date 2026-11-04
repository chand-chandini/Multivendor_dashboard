import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'

/**
 * Footer Settings - the tenant's public site footer, stored one row per tenant
 * in tenant_website_footer_settings and saved through an upsert.
 *
 * Kept out of tenant_branding on purpose: updatetenantsettings rewrites every
 * tenant_branding column it knows about, so footer content living there could be
 * blanked by a partial save from the Settings page. This follows the
 * tenant_website_brand_settings pattern instead.
 */
@Component({
  selector: 'app-mv-footer-settings',
  imports: [PageBreadcrumb, ReactiveFormsModule],
  templateUrl: './footer-settings.html',
  styles: ``,
})
export class FooterSettings implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private fb = inject(FormBuilder)
  protected permissions = inject(PermissionService)

  readonly loading = signal(true)
  readonly saving = signal(false)

  readonly form = withValidation(this.fb.nonNullable.group({
    about_text: [''],
    contact_email: ['', [Validators.email]],
    contact_phone: [''],
    contact_address: [''],
    facebook_url: [''],
    instagram_url: [''],
    twitter_url: [''],
    youtube_url: [''],
    linkedin_url: [''],
    playstore_url: [''],
    appstore_url: [''],
    copyright_text: [''],
  }), {
    about_text: { type: 'text' },
    contact_address: { type: 'text' },
    copyright_text: { type: 'text' },
    contact_email: { type: 'email' },
    contact_phone: { type: 'phone' },
    facebook_url: { type: 'url' },
    instagram_url: { type: 'url' },
    twitter_url: { type: 'url' },
    youtube_url: { type: 'url' },
    linkedin_url: { type: 'url' },
    playstore_url: { type: 'url' },
    appstore_url: { type: 'url' },
  })

  get canEdit(): boolean {
    return this.permissions.canEdit()
  }

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)
    this.api.getWebsiteFooterSettings().subscribe({
      next: (res) => {
        this.loading.set(false)
        if (res.status !== 200) {
          this.notify.error('Could not load footer settings', res.message)
          return
        }
        // An empty object is the correct first-run state - nothing saved yet.
        const d = (res.data ?? {}) as Record<string, any>
        resetValidation(this.form)
        this.form.reset({
          about_text: d['about_text'] ?? '',
          contact_email: d['contact_email'] ?? '',
          contact_phone: d['contact_phone'] ?? '',
          contact_address: d['contact_address'] ?? '',
          facebook_url: d['facebook_url'] ?? '',
          instagram_url: d['instagram_url'] ?? '',
          twitter_url: d['twitter_url'] ?? '',
          youtube_url: d['youtube_url'] ?? '',
          linkedin_url: d['linkedin_url'] ?? '',
          playstore_url: d['playstore_url'] ?? '',
          appstore_url: d['appstore_url'] ?? '',
          copyright_text: d['copyright_text'] ?? '',
        })
      },
      error: () => {
        this.loading.set(false)
        this.notify.error('Could not load footer settings', 'Please try again.')
      },
    })
  }

  submit(): void {
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    this.saving.set(true)
    this.api.updateWebsiteFooterSettings(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success('Footer settings updated')
          this.load()
        } else {
          this.notify.error('Could not update footer settings', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not update footer settings', 'Please try again.')
      },
    })
  }
}
