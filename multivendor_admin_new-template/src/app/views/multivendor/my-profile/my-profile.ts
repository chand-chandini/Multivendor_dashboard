import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { AuthService } from '@core/services/auth.service'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'

/**
 * The signed-in admin's own profile: details from `admin_users_t` and the
 * password change the backend exposes via updateuserpassword.
 */
@Component({
  selector: 'app-mv-my-profile',
  imports: [PageBreadcrumb, ReactiveFormsModule, Icon],
  templateUrl: './my-profile.html',
  styles: ``,
})
export class MyProfile implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private fb = inject(FormBuilder)
  protected auth = inject(AuthService)
  protected permissions = inject(PermissionService)

  readonly profile = signal<Record<string, any> | null>(null)
  readonly loading = signal(true)
  readonly saving = signal(false)

  readonly passwordForm = withValidation(this.fb.nonNullable.group({
    new_password: ['', [Validators.required, Validators.minLength(6)]],
    confirm_password: ['', [Validators.required]],
  }), {
    new_password: { minLength: 6 },
    confirm_password: { equalsField: 'new_password' },
  })

  /** Every module the admin can reach, flattened for the access summary. */
  get modulePermissions() {
    return this.auth.permissions()
  }

  ngOnInit(): void {
    const userId = this.auth.userId()
    if (!userId) {
      this.loading.set(false)
      return
    }

    this.api.getUserProfile(userId).subscribe({
      next: (res) => {
        this.loading.set(false)
        const rows = (res.data ?? []) as Record<string, any>[]
        this.profile.set(rows[0] ?? null)
      },
      error: () => this.loading.set(false),
    })
  }

  changePassword(): void {
    const userId = this.auth.userId()
    if (!userId) return

    if (!validateForm(this.passwordForm)) {
      this.passwordForm.markAllAsTouched()
      return
    }

    const { new_password, confirm_password } = this.passwordForm.getRawValue()
    if (new_password !== confirm_password) {
      this.notify.error('Passwords do not match', 'Re-enter the same password in both fields.')
      return
    }

    this.saving.set(true)
    this.api.updateUserPassword(userId, new_password).subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success('Password updated')
          resetValidation(this.passwordForm)
          this.passwordForm.reset()
        } else {
          this.notify.error('Could not update password', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not update password', 'Please try again.')
      },
    })
  }
}
