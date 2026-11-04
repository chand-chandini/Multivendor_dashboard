import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'

@Component({
  selector: 'app-mv-website-theme-settings',
  imports: [PageBreadcrumb, ReactiveFormsModule],
  templateUrl: './website-theme-settings.html',
  styles: ``,
})
export class WebsiteThemeSettings implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private fb = inject(FormBuilder)
  protected permissions = inject(PermissionService)

  readonly loading = signal(true)
  readonly saving = signal(false)

  readonly form = withValidation(this.fb.nonNullable.group({
    primary_color: ['#01003c'],
    secondary_color: ['#6c757d'],
    header_color: [''],
    button_color: [''],
    font_family: [''],
    custom_css: [''],
  }), {
    primary_color: { type: 'color' },
    secondary_color: { type: 'color' },
    header_color: { type: 'color' },
    button_color: { type: 'color' },
    font_family: { type: 'text' },
    custom_css: { required: false },
  })

  get canEdit(): boolean {
    return this.permissions.canEdit()
  }

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)

    this.api.getWebsiteThemeSettings().subscribe({
      next: (res) => {
        this.loading.set(false)

        if (res.status !== 200) {
          this.notify.error(
            'Could not load website theme settings',
            res.message
          )
          return
        }

        const d = (res.data ?? {}) as Record<string, any>

        resetValidation(this.form)
        this.form.reset({
          primary_color: d['primary_color'] ?? '',
          secondary_color: d['secondary_color'] ?? '',
          header_color: d['header_color'] || '',
          button_color: d['button_color'] || '',
          font_family: d['font_family'] || '',
          custom_css: d['custom_css'] || '',
        })
      },
      error: () => {
        this.loading.set(false)
        this.notify.error(
          'Could not load website theme settings',
          'Please try again.'
        )
      },
    })
  }

  submit(): void {
    if (!validateForm(this.form)) {
      return
    }
    this.saving.set(true)

    this.api.updateWebsiteThemeSettings(this.form.getRawValue()).subscribe({
      next: (res) => {
        this.saving.set(false)

        if (res.status === 200) {
          this.notify.success('Website theme settings updated')
          this.load()
        } else {
          this.notify.error(
            'Could not update website theme settings',
            res.message
          )
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error(
          'Could not update website theme settings',
          'Please try again.'
        )
      },
    })
  }
}