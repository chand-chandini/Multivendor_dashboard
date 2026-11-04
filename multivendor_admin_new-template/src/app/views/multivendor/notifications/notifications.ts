import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

/** Notifications - `notifications` table via /dashboard_api. */
@Component({
  selector: 'app-mv-notifications',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './notifications.html',
  styles: ``,
})
export class Notifications implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')

  readonly rows = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly editingId = signal<number | null>(null)

  readonly columns: DataTableColumn[] = [
    { key: 'title', label: 'Title', width: '35%' },
    { key: 'message', label: 'Description', width: '50%' },
  ]

  readonly actions: DataTableAction[] = [
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    { key: 'delete', icon: 'trash', label: 'Delete', permission: 'delete', className: 'text-danger' },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    title: ['', [Validators.required]],
    message: ['', [Validators.required]],
  }), {
    title: { type: 'text' },
    message: { type: 'text' },
  })

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)

    this.api.getNotifications().subscribe({
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
    this.form.reset({
      title: '',
      message: '',
    })

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  openEdit(row: any): void {
    this.editingId.set(row.id)

    resetValidation(this.form)
    this.form.reset({
      title: row.title ?? '',
      message: row.message ?? '',
    })

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'edit') {
      this.openEdit(event.row)
    } else if (event.key === 'delete') {
      this.confirmDelete(event.row)
    }
  }

  submit(): void {
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    const id = this.editingId()
    const formValue = this.form.getRawValue()

    this.saving.set(true)

    if (id) {
      const payload = {
        id,
        title: formValue.title,
        message: formValue.message,
      }

      this.api.updateNotification(payload).subscribe({
        next: (res) => {
          this.saving.set(false)

          if (res.status === 200) {
            this.notify.success('Notification updated')
            this.modalService.dismissAll()
            this.load()
          } else {
            this.notify.error('Could not update notification', res.message)
          }
        },
        error: () => {
          this.saving.set(false)
          this.notify.error('Could not update notification', 'Please try again.')
        },
      })
    } else {
      const payload = {
        title: formValue.title,
        message: formValue.message,
      }

      this.api.addNotification(payload).subscribe({
        next: (res) => {
          this.saving.set(false)

          if (res.status === 200) {
            this.notify.success('Notification added')
            this.modalService.dismissAll()
            this.load()
          } else {
            this.notify.error('Could not add notification', res.message)
          }
        },
        error: () => {
          this.saving.set(false)
          this.notify.error('Could not add notification', 'Please try again.')
        },
      })
    }
  }

  private async confirmDelete(row: any): Promise<void> {
    const confirmed = await this.notify.confirmDelete(`"${row.title}" will be removed.`)

    if (!confirmed) return

    this.api.deleteNotification(row.id).subscribe({
      next: (res) => {
        if (res.status === 200) {
          this.notify.success('Notification deleted')
          this.load()
        } else {
          this.notify.error('Could not delete notification', res.message)
        }
      },
      error: () => {
        this.notify.error('Could not delete notification', 'Please try again.')
      },
    })
  }
}