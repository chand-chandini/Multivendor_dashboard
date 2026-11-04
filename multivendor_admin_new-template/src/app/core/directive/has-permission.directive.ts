import { Directive, effect, inject, input, TemplateRef, ViewContainerRef } from '@angular/core'
import { PermissionAction } from '@core/models/multivendor.model'
import { PermissionService } from '@core/services/permission.service'

/**
 * Renders its content only when the signed-in admin holds the given permission
 * on the current route, or on the path passed via hasPermissionOn.
 *
 * Usage:
 *   <button *hasPermission="'add'">Add Location</button>
 *   <a *hasPermission="'edit'; on: '/masters/vendors'">Edit</a>
 */
@Directive({
  selector: '[hasPermission]',
  standalone: true,
})
export class HasPermissionDirective {
  private templateRef = inject<TemplateRef<unknown>>(TemplateRef)
  private viewContainer = inject(ViewContainerRef)
  private permissions = inject(PermissionService)

  readonly hasPermission = input.required<PermissionAction>()
  readonly hasPermissionOn = input<string | undefined>(undefined)

  private rendered = false

  constructor() {
    effect(() => {
      const allowed = this.permissions.can(this.hasPermission(), this.hasPermissionOn())

      if (allowed && !this.rendered) {
        this.viewContainer.createEmbeddedView(this.templateRef)
        this.rendered = true
      } else if (!allowed && this.rendered) {
        this.viewContainer.clear()
        this.rendered = false
      }
    })
  }
}
