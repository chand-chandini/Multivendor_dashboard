import { Component } from '@angular/core'
import { RouterLink } from '@angular/router'
import { Icon } from '@app/components/icon/icon'
import { NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap'
import { SimplebarAngularModule } from 'simplebar-angular'

@Component({
  selector: 'megamenu-columns',
  imports: [NgbDropdownModule, Icon, SimplebarAngularModule, RouterLink],
  template: `
    <div id="megamenu-columns" class="topbar-item">
      <div ngbDropdown>
        <button ngbDropdownToggle class="topbar-link btn fw-medium btn-link drop-arrow-none" type="button">
          Mega Menu
          <app-icon icon="chevron-down" class="ms-1"></app-icon>
        </button>
        <div ngbDropdownMenu class="dropdown-menu-xxl p-0">
          <ngx-simplebar class="h-100" style="max-height: 380px;">
            <div class="row g-0">
              <div class="col-md-4">
                <div class="p-2">
                  <h5 class="mb-1 fw-semibold fs-sm dropdown-header">Dashboard & Analytics</h5>
                  <ul class="list-unstyled megamenu-list">
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        Sales Dashboard
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        Marketing Dashboard
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        Finance Overview
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        User Analytics
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        Traffic Insights
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="col-md-4">
                <div class="p-2">
                  <h5 class="mb-1 fw-semibold fs-sm dropdown-header">Project Management</h5>
                  <ul class="list-unstyled megamenu-list">
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="minus" class="align-middle me-1 text-muted"></app-icon>
                        Kanban Workflow
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="minus" class="align-middle me-1 text-muted"></app-icon>
                        Project Timeline
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="minus" class="align-middle me-1 text-muted"></app-icon>
                        Task Management
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="minus" class="align-middle me-1 text-muted"></app-icon>
                        Team Members
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="minus" class="align-middle me-1 text-muted"></app-icon>
                        Assignments
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div class="col-md-4">
                <div class="p-2 bg-light bg-opacity-50">
                  <h5 class="mb-1 fw-semibold fs-sm dropdown-header">User Management</h5>
                  <ul class="list-unstyled megamenu-list">
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        User Profiles
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        Access Control
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        Security Settings
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        User Groups
                      </a>
                    </li>
                    <li>
                      <a [routerLink]="[]" ngbDropdownItem>
                        <app-icon icon="chevron-right" class="align-middle me-1 text-muted"></app-icon>
                        Authentication
                      </a>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </ngx-simplebar>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export class MegamenuColumns {}
