import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { AuthService } from '@core/services/auth.service'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

/** One selectable row of the permission matrix, mirroring getupdatemodules. */
type PermissionRow = {
  /** admin_sub_module.id, or admin_main_module.id + 10000 for standalone modules. */
  id: number
  module_id: number
  module_nm: string
  label: string
  link: string | null
  selected: boolean
  can_view: boolean
  can_add: boolean
  can_edit: boolean
  can_delete: boolean
}

type PermissionGroup = {
  module_id: number
  module_nm: string
  rows: PermissionRow[]
}

/**
 * Admin users and their module permissions - `admin_users_t` and
 * `admin_user_permissions`, through getuserlist / submituserslogin /
 * getupdatemodules / postusermenulist / deleteuser.
 */
@Component({
  selector: 'app-mv-permissions',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './permissions.html',
  styles: ``,
})
export class Permissions implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)
  private auth = inject(AuthService)
  protected permissions = inject(PermissionService)

  readonly userModal = viewChild.required<TemplateRef<any>>('userModal')

  readonly rows = signal<any[]>([])
  readonly groups = signal<PermissionGroup[]>([])
  readonly loading = signal(true)
  readonly modulesLoading = signal(false)
  readonly modulesError = signal('')
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  readonly columns: DataTableColumn[] = [
    { key: 'name', label: 'Name', width: '22%' },
    { key: 'number', label: 'Mobile', width: '15%' },
    { key: 'email', label: 'Email', width: '25%' },
    { key: 'designation', label: 'Admin Type', width: '16%' },
    { key: 'i_ts', label: 'Created', type: 'date', width: '14%' },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'edit', icon: 'edit', label: 'Edit user and permissions', permission: 'edit' },
    {
      key: 'delete',
      icon: 'trash',
      label: 'Delete',
      permission: 'delete',
      className: 'text-danger',
      // An admin cannot delete their own account from here.
      hidden: (row) => row.id === this.auth.userId(),
    },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    name: ['', [Validators.required]],
    number: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
    email: ['', [Validators.email]],
    pwd: [''],
    designation: [''],
  }), {
    name: { type: 'text' },
    number: { type: 'phone' },
    email: { type: 'email' },
    designation: { type: 'text' },
    pwd: { when: (): boolean => !this.editingId() || this.form?.controls.pwd.value !== '' },
  })

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)
    this.api.getUserList().subscribe({
      next: (res) => {
        this.loading.set(false)
        this.rows.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => this.loading.set(false),
    })
  }

  openAdd(): void {
    this.editingId.set(null)
    resetValidation(this.form)
    this.form.reset({})
    this.form.controls.pwd.setValidators([Validators.required])
    this.form.controls.pwd.updateValueAndValidity()
    this.loadModules(0)
    this.modalService.open(this.userModal(), { centered: true, size: 'xl', backdrop: 'static', scrollable: true })
  }

  openEdit(row: any): void {
    this.editingId.set(row.id)
    resetValidation(this.form)
    this.form.reset({
      name: row.name ?? '',
      number: row.number ?? '',
      email: row.email ?? '',
      pwd: '',
      designation: row.designation ?? '',
    })
    this.form.controls.pwd.clearValidators()
    this.form.controls.pwd.updateValueAndValidity()
    this.loadModules(row.id)
    this.modalService.open(this.userModal(), { centered: true, size: 'xl', backdrop: 'static', scrollable: true })
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'edit') {
      this.openEdit(event.row)
    } else if (event.key === 'delete') {
      this.confirmDelete(event.row)
    }
  }

  private loadModules(userId: number): void {
    this.modulesLoading.set(true)
    this.modulesError.set('')
    this.groups.set([])

    this.api.getUpdateModules(userId).subscribe({
      next: (res) => {
        this.modulesLoading.set(false)
        if (res.status !== 200 || !Array.isArray(res.data)) {
          this.modulesError.set(res.message || 'Could not load module permissions. Please retry.')
          return
        }

        const grouped = new Map<number, PermissionGroup>()
        for (const raw of (res.data ?? []) as Record<string, any>[]) {
          const moduleId = Number(raw['module_id'])
          if (!grouped.has(moduleId)) {
            grouped.set(moduleId, { module_id: moduleId, module_nm: raw['module_nm'], rows: [] })
          }
          const selected = raw['check_sub_menu'] === true || raw['check_sub_menu'] === 1
          grouped.get(moduleId)!.rows.push({
            id: Number(raw['id']),
            module_id: moduleId,
            module_nm: raw['module_nm'],
            label: raw['label'],
            link: raw['link'] ?? null,
            selected,
            // Unassigned rows default to full access, matching the backend.
            can_view: selected ? Number(raw['can_view'] ?? 1) === 1 : true,
            can_add: selected ? Number(raw['can_add'] ?? 1) === 1 : true,
            can_edit: selected ? Number(raw['can_edit'] ?? 1) === 1 : true,
            can_delete: selected ? Number(raw['can_delete'] ?? 1) === 1 : true,
          })
        }
        this.groups.set(Array.from(grouped.values()))
      },
      error: (error) => {
        this.modulesLoading.set(false)
        this.modulesError.set(error.status === 403
          ? 'You do not have permission to load the module catalog.'
          : error.error?.message || 'Could not load module permissions. Check the API connection and retry.')
      },
    })
  }

  retryModules(): void {
    this.loadModules(this.editingId() ?? 0)
  }

  toggleRow(row: PermissionRow, checked: boolean): void {
    row.selected = checked
    if (checked && !row.can_view) {
      row.can_view = true
    }
    this.groups.set([...this.groups()])
  }

  toggleFlag(row: PermissionRow, flag: 'can_view' | 'can_add' | 'can_edit' | 'can_delete', checked: boolean): void {
    row[flag] = checked
    // View is what puts a module in the sidebar, so clearing it clears the row.
    if (flag === 'can_view' && !checked) {
      row.can_add = false
      row.can_edit = false
      row.can_delete = false
    } else if (checked) {
      row.can_view = true
      row.selected = true
    }
    this.groups.set([...this.groups()])
  }

  toggleGroup(group: PermissionGroup, checked: boolean): void {
    for (const row of group.rows) {
      row.selected = checked
      row.can_view = checked
      row.can_add = checked
      row.can_edit = checked
      row.can_delete = checked
    }
    this.groups.set([...this.groups()])
  }

  isGroupChecked(group: PermissionGroup): boolean {
    return group.rows.length > 0 && group.rows.every((row) => row.selected)
  }

  private selectedModules(userId?: number) {
    return this.groups()
      .flatMap((group) => group.rows)
      .filter((row) => row.selected)
      .map((row) => ({
        id: row.id,
        module_id: row.module_id,
        link: row.link,
        can_view: row.can_view ? 1 : 0,
        can_add: row.can_add ? 1 : 0,
        can_edit: row.can_edit ? 1 : 0,
        can_delete: row.can_delete ? 1 : 0,
        ...(userId ? { user_id: userId } : {}),
      }))
  }

  moduleSelectionError(): string {
    if (this.modulesError()) return this.modulesError()
    if (!this.form.touched) return ''
    if (this.modulesLoading()) return 'Wait for the module list to finish loading.'
    return this.selectedModules().length ? '' : 'Select at least one module.'
  }

  submit(): void {
    if (this.modulesLoading() || this.modulesError() || this.saving()) return
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    if (this.moduleSelectionError()) return

    const id = this.editingId()
    const details = this.form.getRawValue()
    this.saving.set(true)

    if (id) {
      const modules = this.selectedModules(id)
      if (modules.length === 0) {
        this.saving.set(false)
        this.notify.error('Select at least one module', 'A user needs access to at least one module.')
        return
      }

      const employeeDetails: Record<string, unknown> = {
        name: details.name,
        number: details.number,
        email: details.email,
        designation: details.designation,
      }
      if (details.pwd) employeeDetails['pwd'] = details.pwd

      this.api.saveUserModules({ modules, employeeDetails }).subscribe({
        next: (res) => this.afterSave(res, 'User updated'),
        error: () => this.afterSaveError(),
      })
      return
    }

    this.api
      .addAdminUser({
        ...details,
        selectedmoduleslist: this.selectedModules(),
      })
      .subscribe({
        next: (res) => this.afterSave(res, 'User created'),
        error: () => this.afterSaveError(),
      })
  }

  private afterSave(res: { status: number; message?: string }, successMessage: string): void {
    this.saving.set(false)
    if (res.status === 200) {
      this.notify.success(successMessage)
      this.modalService.dismissAll()
      this.load()
      this.refreshOwnPermissions()
    } else {
      this.notify.error('Could not save user', res.message)
    }
  }

  private afterSaveError(): void {
    this.saving.set(false)
    this.notify.error('Could not save user', 'Please try again.')
  }

  /** Re-reads the signed-in admin's own menu so the sidebar stays in sync. */
  private refreshOwnPermissions(): void {
    const userId = this.auth.userId()
    if (!userId) return

    this.api.getModuleListDetails(userId).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.auth.setSession({
            status: 200,
            usr_data: this.auth.user() ? [this.auth.user()!] : [],
            data: res.data ?? [],
            permissions: res['permissions'] ?? [],
            token: this.auth.token() ?? undefined,
            tenant: this.auth.tenant() ?? undefined,
          })
        }
      },
    })
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(`"${row.name}" will lose access to the dashboard.`)
    if (!confirmed) return

    this.api.deleteAdminUser([row.id]).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('User deleted')
          this.load()
        } else {
          this.notify.error('Could not delete user', res.message)
        }
      },
      error: () => this.notify.error('Could not delete user', 'Please try again.'),
    })
  }
}
