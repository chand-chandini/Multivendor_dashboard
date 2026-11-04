import { Component, inject } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { AuthService } from '@core/services/auth.service'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'user-profile-settings',
  imports: [Icon, RouterLink, NgbDropdownModule],
  template: `
    <div id="user-profile-settings" class="sidenav-user" style="background: url(assets/images/user-bg-pattern.svg)">
      <div class="d-flex justify-content-between align-items-center">
        <div>
          <a routerLink="/appusers/myprofile" class="link-reset">
            <img [src]="avatar()" alt="user-image" class="rounded-circle mb-2 avatar-md" />
            <span class="sidenav-user-name fw-bold">{{ auth.userName() }}</span>
            <span class="fs-12 fw-semibold">{{ auth.adminType() }}</span>
          </a>
        </div>
        <div ngbDropdown>
          <a ngbDropdownToggle class="drop-arrow-none link-reset sidenav-user-set-icon" [routerLink]="[]">
            <app-icon icon="settings" class="fs-24 align-middle ms-1"></app-icon>
          </a>

          <div ngbDropdownMenu>
            <div class="dropdown-header noti-title">
              <h6 class="text-overflow m-0">{{ tenantName() }}</h6>
            </div>

            <a routerLink="/appusers/myprofile" ngbDropdownItem>
              <app-icon icon="user-circle" class="me-1 fs-lg align-middle"></app-icon>
              <span class="align-middle">My Profile</span>
            </a>

            <a routerLink="/masters/settings" ngbDropdownItem>
              <app-icon icon="settings-2" class="me-1 fs-lg align-middle"></app-icon>
              <span class="align-middle">Settings</span>
            </a>

            <a [routerLink]="[]" (click)="auth.logout()" ngbDropdownItem class="text-danger fw-semibold">
              <app-icon icon="logout" class="me-1 fs-lg align-middle"></app-icon>
              <span class="align-middle">Log Out</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class UserProfileSettings {
  protected auth = inject(AuthService)

  avatar(): string {
    return this.auth.user()?.profile_image || 'assets/images/users/user-1.jpg'
  }

  tenantName(): string {
    return this.auth.tenant()?.name || 'Welcome back!'
  }
}
