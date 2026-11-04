import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { NgbNavModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-mv-settings',
  imports: [PageBreadcrumb, ReactiveFormsModule, NgbNavModule],
  templateUrl: './settings.html',
  styles: ``,
})
export class Settings implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private fb = inject(FormBuilder)

  protected permissions = inject(PermissionService)

  activeTab = 'gateway'

  readonly savingGateway = signal(false)
  readonly savingModes = signal(false)

  readonly gatewayForm = withValidation(this.fb.nonNullable.group({
    gateway_name: ['razorpay'],
    api_key: [''],
    api_secret: [''],
    webhook_secret: [''],
    is_active: [1 as number | null],
  }), {
    gateway_name: { choices: () => ['razorpay', 'stripe', 'payu', 'cashfree'] },
    api_key: { type: 'text' },
    api_secret: { type: 'text' },
    webhook_secret: { type: 'text' },
    is_active: { choices: () => [0, 1] },
  })

  /**
   * Payment modes currently enabled for this store.
   */
  readonly paymentModes = signal<{
    cod_enabled: boolean
    online_configured: boolean
    online_enabled: boolean
  }>({
    cod_enabled: true,
    online_configured: false,
    online_enabled: false,
  })

  /**
   * Shows the gateway message when online payment
   * is selected without saved gateway credentials.
   */
  readonly showGatewayPrompt = signal(false)

  get canEdit(): boolean {
    return this.permissions.canEdit()
  }

  ngOnInit(): void {
    this.loadGateway()
  }

  private loadGateway(): void {
    this.api.getPaymentGateway().subscribe({
      next: (res) => {
        if (res.status !== 200) {
          return
        }

        if ((res as any).modes) {
          this.paymentModes.set((res as any).modes)
        }

        const rows = (res.data ?? []) as Record<string, any>[]
        const gateway = Array.isArray(rows) ? rows[0] : rows

        if (!gateway) {
          return
        }

        this.gatewayForm.patchValue({
          gateway_name: gateway['gateway_name'] ?? '',
          api_key: gateway['api_key'] ?? '',
          api_secret: gateway['api_secret'] ?? '',
          webhook_secret: gateway['webhook_secret'] ?? '',
          is_active: gateway['is_active'] == null || gateway['is_active'] === '' ? null : Number(gateway['is_active']),
        })
      },
      error: () => {
        this.notify.error(
          'Could not load payment settings',
          'Please try again.',
        )
      },
    })
  }

  private syncSwitch(event: Event, state: boolean): void {
    const input = event.target as HTMLInputElement | null

    if (input) {
      input.checked = state
    }
  }

  onOnlineToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked

    if (checked && !this.paymentModes().online_configured) {
      this.syncSwitch(event, false)

      this.showGatewayPrompt.set(true)

      this.notify.error(
        'Razorpay keys required',
        'Add your API key and secret below and save.',
      )

      return
    }

    this.gatewayForm.patchValue({
      is_active: checked ? 1 : 0,
    })

    this.saveGateway(event)
  }

  onCodToggle(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked

    this.savingModes.set(true)

    this.api
      .updatePaymentModes({
        cod_enabled: checked ? 1 : 0,
      })
      .subscribe({
        next: (res) => {
          this.savingModes.set(false)

          if (res.status === 200) {
            if ((res as any).modes) {
              this.paymentModes.set((res as any).modes)
            }

            this.notify.success(
              res.message || 'Payment modes updated',
            )
          } else {
            this.notify.error(
              'Could not update payment modes',
              res.message,
            )
          }

          this.syncSwitch(
            event,
            this.paymentModes().cod_enabled,
          )
        },

        error: () => {
          this.savingModes.set(false)

          this.notify.error(
            'Could not update payment modes',
            'Please try again.',
          )

          this.syncSwitch(
            event,
            this.paymentModes().cod_enabled,
          )
        },
      })
  }

  saveGateway(toggleEvent?: Event): void {
    if ((!toggleEvent || this.gatewayForm.controls.is_active.value !== 0) && !validateForm(this.gatewayForm)) {
      if (toggleEvent) this.syncSwitch(toggleEvent, this.paymentModes().online_enabled)
      return
    }
    this.savingGateway.set(true)

    this.api
      .updatePaymentGateway(this.gatewayForm.getRawValue())
      .subscribe({
        next: (res) => {
          this.savingGateway.set(false)

          if (res.status === 200) {
            if ((res as any).modes) {
              this.paymentModes.set((res as any).modes)
            }

            this.showGatewayPrompt.set(false)

            this.notify.success(
              res.message || 'Payment gateway updated',
            )
          } else {
            this.showGatewayPrompt.set(true)

            this.notify.error(
              'Could not update payment gateway',
              res.message,
            )
          }

          if (toggleEvent) {
            this.syncSwitch(
              toggleEvent,
              this.paymentModes().online_enabled,
            )
          }
        },

        error: () => {
          this.savingGateway.set(false)

          this.notify.error(
            'Could not update payment gateway',
            'Please try again.',
          )

          if (toggleEvent) {
            this.syncSwitch(
              toggleEvent,
              this.paymentModes().online_enabled,
            )
          }
        },
      })
  }
}