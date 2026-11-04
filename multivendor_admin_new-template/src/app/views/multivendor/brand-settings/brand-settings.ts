import { beginImageRead, completeImageRead, failImageRead, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'

/**
 * Brand Settings - the public site's title and tagline, plus the brand contact
 * details, through the existing gettenantsettings / updatetenantsettings pair.
 * No second branding system is introduced.
 *
 * IMPORTANT: updatetenantsettings is destructive. It rewrites every
 * tenant_settings and tenant_branding column it knows about, falling back to
 * defaults for anything absent from the body - so a partial save would wipe the
 * tenant's logos, colours, font and custom CSS, which is exactly the data the
 * Settings page and the layout theme depend on. This page therefore keeps the
 * complete objects it loaded, merges only the edited fields into them, and
 * sends them back whole.
 */
@Component({
  selector: 'app-mv-brand-settings',
  imports: [PageBreadcrumb, ReactiveFormsModule],
  templateUrl: './brand-settings.html',
  styles: ``,
})
export class BrandSettings implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private fb = inject(FormBuilder)
  protected permissions = inject(PermissionService)

  readonly loading = signal(true)
  readonly saving = signal(false)

  /** Everything gettenantsettings returned, kept verbatim for the merge. */
  private loadedSettings: Record<string, any> = {}
  private loadedBranding: Record<string, any> = {}

readonly form = withValidation(this.fb.nonNullable.group({
  tenant_name: ['', [Validators.required]],
  website_title: [''],
  tagline: [''],
  support_email: ['', [Validators.email]],
  support_phone: [''],
  logo_light: [''],
  favicon: [''],
}), {
    tenant_name: { type: 'text' },
    website_title: { type: 'text' },
    tagline: { type: 'text' },
    support_email: { type: 'email' },
    support_phone: { type: 'phone' },
    logo_light: { type: 'image', saved: (): unknown => this.form?.controls.logo_light.value, accept: 'image/*' },
    favicon: { type: 'image', saved: (): unknown => this.form?.controls.favicon.value, accept: 'image/*' },
  })

  get canEdit(): boolean {
    return this.permissions.canEdit()
  }

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)
    this.api.getTenantSettings().subscribe({
      next: (res) => {
        this.loading.set(false)
        if (res.status !== 200) {
          this.notify.error('Could not load brand settings', res.message)
          return
        }
        const data = (res.data ?? {}) as Record<string, any>
        this.loadedSettings = { ...(data['settings'] ?? {}) }
        this.loadedBranding = { ...(data['branding'] ?? {}) }

       resetValidation(this.form)
       this.form.reset({
  tenant_name: this.loadedSettings['tenant_name'] ?? '',
  website_title: this.loadedBranding['website_title'] ?? '',
  tagline: this.loadedBranding['tagline'] ?? '',
  support_email: this.loadedSettings['support_email'] ?? '',
  support_phone: this.loadedSettings['support_phone'] ?? '',
  logo_light: this.loadedBranding['logo_light'] ?? '',
  favicon: this.loadedBranding['favicon'] ?? '',
})
      },
      error: () => {
        this.loading.set(false)
        this.notify.error('Could not load brand settings', 'Please try again.')
      },
    })
  }

  submit(): void {
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    const value = this.form.getRawValue()

    // Spread first, override second: every field this page does not show keeps
    // the value it was loaded with.
    const payload = {
      settings: {
        ...this.loadedSettings,
        tenant_name: value.tenant_name,
        support_email: value.support_email,
        support_phone: value.support_phone,
      },
   branding: {
  ...this.loadedBranding,
  website_title: value.website_title,
  tagline: value.tagline,
  logo_light: value.logo_light,
  favicon: value.favicon,
},
    }

    this.saving.set(true)
    this.api.updateTenantSettings(payload).subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success('Brand settings updated')
          this.load()
        } else {
          this.notify.error('Could not update brand settings', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not update brand settings', 'Please try again.')
      },
    })
  }
onLogoSelected(event: Event): void {
  const input = event.target as HTMLInputElement

  if (!input.files || input.files.length === 0) {
    return
  }

  const file = input.files[0]
    if (!beginImageRead(this.form.controls.logo_light, file, 'image/*')) return


  if (!file.type.startsWith('image/')) {
    this.notify.error('Invalid logo', 'Please select an image file.')
    input.value = ''
    return
  }

  this.fileToBase64(file).then((base64) => {
    completeImageRead(this.form.controls.logo_light, base64, file)
  }).catch(() => failImageRead(this.form.controls.logo_light, file))
}

onFaviconSelected(event: Event): void {
  const input = event.target as HTMLInputElement

  if (!input.files || input.files.length === 0) {
    return
  }

  const file = input.files[0]
    if (!beginImageRead(this.form.controls.favicon, file, 'image/*')) return


  if (!file.type.startsWith('image/')) {
    this.notify.error('Invalid favicon', 'Please select an image file.')
    input.value = ''
    return
  }

  this.fileToBase64(file).then((base64) => {
    completeImageRead(this.form.controls.favicon, base64, file)
  }).catch(() => failImageRead(this.form.controls.favicon, file))
}

private fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = () => resolve(String(reader.result))
    reader.onerror = reject

    reader.readAsDataURL(file)
  })
}
}
