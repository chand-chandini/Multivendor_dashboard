import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { AuthService } from '@core/services/auth.service'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

type UserProfileMenuType = {
  icon: string
  label: string
  href: string
  className?: string
  isDivider?: boolean
  action?: string
}

@Component({
  selector: 'user-dropdown-detailed',
  imports: [Icon, RouterLink, NgbDropdownModule],
  template: `
    <div id="user-dropdown-detailed" class="topbar-item nav-user">
      <div ngbDropdown placement="bottom-end">
        <a class="topbar-link drop-arrow-none" [routerLink]="[]" ngbDropdownToggle>
          <img [src]="avatar()" width="32" class="rounded-circle me-lg-2 d-flex" alt="user-image" />
          <div class="d-lg-flex align-items-center gap-1 d-none">
            <span>
              <h5 class="my-0 lh-1 pro-username">{{ auth.userName() }}</h5>
              <span class="fs-xs lh-1">{{ auth.adminType() }}</span>
            </span>
            <app-icon icon="chevron-down" class="align-middle"></app-icon>
          </div>
        </a>
        <div ngbDropdownMenu class="dropdown-menu-end">
          <!-- Header -->
          <div class="dropdown-header noti-title">
            <h6 class="text-overflow m-0">{{ tenantName() }}</h6>
          </div>

          @for (item of userProfileMenuData; track item.label) {
            <a [routerLink]="item.href" ngbDropdownItem [class]="item.className" (click)="handleClick(item)">
              <app-icon [icon]="item.icon" class="me-1 fs-lg align-middle"></app-icon>

              <span class="align-middle">{{ item.label }}</span>
            </a>

            @if (item.isDivider) {
              <div class="dropdown-divider"></div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class UserDropdownDetailed {
  protected auth = inject(AuthService)

  avatar(): string {
    return this.auth.user()?.profile_image || 'assets/images/users/user-1.jpg'
  }

  tenantName(): string {
    return this.auth.tenant()?.name || 'Welcome back!'
  }

  userProfileMenuData: UserProfileMenuType[] = [
    {
      icon: 'user-circle',
      label: 'My Profile',
      href: '/appusers/myprofile',
    },
    {
      icon: 'settings-2',
      label: 'Settings',
      href: '/masters/settings',
    },
    {
      icon: 'headset',
      label: 'Dev Support',
      href: '/masters/devsupport',
      isDivider: true,
    },
    {
      icon: 'logout',
      label: 'Log Out',
      href: '',
      action: 'logout',
      className: 'text-danger fw-semibold',
    },
  ]

  handleClick(item: UserProfileMenuType) {
    if (item.action === 'logout') {
      this.auth.logout()
    }
  }
}
