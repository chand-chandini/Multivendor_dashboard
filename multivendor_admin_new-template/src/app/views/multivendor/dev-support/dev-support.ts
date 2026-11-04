import { checkImageFile, fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { Component, computed, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

/**
 * Column codes as documented on `dev_support_tickets.application`. Every surface a
 * tenant can raise a ticket against. Codes 1, 2 and 5 already exist in data and
 * must not be renumbered; 3 is newly assigned to the Partner App.
 */
const APPLICATIONS = [
  { value: 1, label: 'Public App' },
  { value: 3, label: 'Partner App' },
  { value: 2, label: 'Dashboard' },
  { value: 5, label: 'Static Website' },
]

const TICKET_TYPES = [
  { value: 1, label: 'Bug' },
  { value: 2, label: 'Add-on' },
]

const DEV_STATUS = [
  { value: 0, label: 'New', className: 'badge bg-secondary-subtle text-secondary' },
  { value: 1, label: 'In Progress', className: 'badge bg-info-subtle text-info' },
  { value: 2, label: 'On Hold', className: 'badge bg-warning-subtle text-warning' },
  { value: 3, label: 'Resolved', className: 'badge bg-success-subtle text-success' },
  { value: 4, label: 'Closed', className: 'badge bg-dark-subtle text-dark' },
]

const ADMIN_STATUS = [
  { value: 0, label: 'New' },
  { value: 1, label: 'Reopened' },
  { value: 2, label: 'Closed' },
]

const PRIORITIES = ['low', 'medium', 'high', 'critical']

/** Dev support tickets - `dev_support_tickets` via /dashboard_api. */
@Component({
  selector: 'app-mv-dev-support',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './dev-support.html',
  styles: ``,
})
export class DevSupport implements OnInit {
  readonly fieldError = fieldError

  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)
  protected permissions = inject(PermissionService)

  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')
  readonly remarksModal = viewChild.required<TemplateRef<any>>('remarksModal')
  readonly devStatusCell = viewChild.required<TemplateRef<any>>('devStatusCell')
  readonly adminStatusCell = viewChild.required<TemplateRef<any>>('adminStatusCell')

  readonly applications = APPLICATIONS
  readonly ticketTypes = TICKET_TYPES
  readonly devStatuses = DEV_STATUS
  readonly adminStatuses = ADMIN_STATUS
  readonly priorities = PRIORITIES

  readonly rows = signal<any[]>([])
  readonly loading = signal(true)
  readonly saving = signal(false)
  readonly remarksTarget = signal<any | null>(null)

  // Image field features
  selectedImageFile: File | null = null
  readonly selectedImageName = signal('')
  readonly imagePreview = signal('')

  readonly cellTemplates = computed(() => ({
    dev_status: this.devStatusCell(),
    admin_status: this.adminStatusCell(),
  }))

  readonly columns: DataTableColumn[] = [
    {
      key: 'id',
      label: 'Ticket No',
      width: '8%',
    },
    {
      key: 'application',
      label: 'Application',
      width: '10%',
      format: (v) =>
        APPLICATIONS.find((a) => a.value === Number(v))?.label ?? '-',
    },
    {
      key: 'subject',
      label: 'Issue',
      width: '12%',
    },
    {
      key: 'description',
      label: 'Description',
      width: '18%',
    },
    {
      key: 'image',
      label: 'Image',
      type: 'image',
      width: '8%',
      sortable: false,
      align: 'center',
    },
    {
      key: 'i_ts',
      label: 'Issue Date',
      type: 'date',
      width: '10%',
    },
    {
      key: 'ticket_type',
      label: 'Ticket Type',
      width: '9%',
      format: (v) =>
        TICKET_TYPES.find((t) => t.value === Number(v))?.label ?? '-',
    },
    {
      key: 'dev_status',
      label: 'Dev Status',
      width: '9%',
      align: 'center',
      sortable: false,
    },
    {
      key: 'admin_status',
      label: 'Admin Status',
      width: '9%',
      align: 'center',
      sortable: false,
    },
    {
      key: 'remarks',
      label: 'Remarks',
      width: '12%',
    },
    {
      key: 'entry_by',
      label: 'Entry By',
      width: '10%',
    },
  ]

  readonly actions: DataTableAction[] = [
    {
      key: 'remarks',
      icon: 'message-2',
      label: 'Remarks',
      permission: 'edit',
    },
  ]

  readonly form = withValidation(this.fb.nonNullable.group({
    subject: ['', [Validators.required]],
    description: ['', [Validators.required]],
    application: [2 as number | null],
    ticket_type: [1 as number | null],
    image: [null as File | null],
  }), {
    subject: { type: 'text' },
    description: { type: 'text' },
    application: { choices: () => this.applications.map((item) => item.value) },
    ticket_type: { choices: () => this.ticketTypes.map((item) => item.value) },
    image: { type: 'image', saved: (): unknown => '', accept: 'image/png,image/jpeg,image/jpg,image/webp' },
  })

  readonly remarksForm = withValidation(this.fb.nonNullable.group({
    remarks: [''],
  }), {
    remarks: { type: 'text' },
  })

  ngOnInit(): void {
    this.load()
  }

  load(): void {
    this.loading.set(true)
    this.api.getDevSupport().subscribe({
      next: (res) => {
        this.loading.set(false)
        this.rows.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => this.loading.set(false),
    })
  }

  devStatusClass(value: any): string {
    return DEV_STATUS.find((s) => s.value === Number(value))?.className ?? 'badge bg-secondary-subtle text-secondary'
  }

  devStatusLabel(value: any): string {
    return DEV_STATUS.find((s) => s.value === Number(value))?.label ?? 'New'
  }

  adminStatusLabel(value: any): string {
    return ADMIN_STATUS.find((s) => s.value === Number(value))?.label ?? 'New'
  }

  openAdd(): void {
    this.selectedImageFile = null
    this.selectedImageName.set('')
    this.imagePreview.set('')

    resetValidation(this.form)
    this.form.reset({
      subject: '',
      description: '',
      application: 2,
      ticket_type: 1,
      image: null,
    })

    this.modalService.open(this.formModal(), {
      centered: true,
      size: 'lg',
      backdrop: 'static',
    })
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'remarks') {
      this.openRemarks(event.row)
    }
  }

  openRemarks(row: any): void {
    this.remarksTarget.set(row)
    resetValidation(this.remarksForm)
    this.remarksForm.reset({ remarks: row.remarks ?? '' })
    this.modalService.open(this.remarksModal(), {
      centered: true,
      backdrop: 'static',
    })
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement
    const file = input.files?.[0]

    if (!file) return
    if (!checkImageFile(this.form.controls.image, file, 'image/png,image/jpeg,image/jpg,image/webp')) return


    if (!file.type.startsWith('image/')) {
      this.notify.error('Invalid file', 'Please select an image file.')
      input.value = ''
      return
    }

    this.selectedImageFile = file
    this.selectedImageName.set(file.name)

    this.form.patchValue({
      image: file,
    })

    const reader = new FileReader()

    reader.onload = () => {
      this.imagePreview.set(
        typeof reader.result === 'string' ? reader.result : ''
      )
    }

    reader.readAsDataURL(file)
  }

  submit(): void {
    if (!validateForm(this.form)) {
      this.form.markAllAsTouched()
      return
    }

    this.saving.set(true)

    const values = this.form.getRawValue()
    const payload = new FormData()

    payload.append('subject', values.subject)
    payload.append('description', values.description)
    payload.append('application', String(values.application))
    payload.append('ticket_type', String(values.ticket_type))

    if (values.image) {
      payload.append('image', values.image)
    }

    this.api.addDevSupport(payload).subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          this.notify.success('Ticket created')
          this.modalService.dismissAll()
          this.load()
        } else {
          this.notify.error('Could not create ticket', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not create ticket', 'Please try again.')
      },
    })
  }

  saveRemarks(): void {
    if (!validateForm(this.remarksForm)) {
      return
    }
    const target = this.remarksTarget()
    if (!target) return

    this.saving.set(true)
    this.api.updateTicketRemarks({
      id: target.id,
      remarks: this.remarksForm.getRawValue().remarks,
    }).subscribe({
      next: (res) => {
        this.saving.set(false)
        if (res.status === 200) {
          target.remarks = this.remarksForm.getRawValue().remarks
          this.notify.success('Remarks updated')
          this.modalService.dismissAll()
        } else {
          this.notify.error('Could not update remarks', res.message)
        }
      },
      error: () => {
        this.saving.set(false)
        this.notify.error('Could not update remarks', 'Please try again.')
      },
    })
  }

  changeAdminStatus(row: any, value: string): void {
    const next = Number(value)
    if (Number.isNaN(next) || next === Number(row.admin_status)) return

    this.api.updateAdminStatus({ id: row.id, value: next }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          row.admin_status = next
          this.notify.success('Admin status updated')
        } else {
          this.notify.error('Could not update status', res.message)
        }
      },
      error: () => this.notify.error('Could not update status', 'Please try again.'),
    })
  }
}

function priorityClass(priority: string): string {
  switch (priority) {
    case 'critical':
      return 'badge bg-danger-subtle text-danger'
    case 'high':
      return 'badge bg-warning-subtle text-warning'
    case 'low':
      return 'badge bg-secondary-subtle text-secondary'
    default:
      return 'badge bg-info-subtle text-info'
  }
}
