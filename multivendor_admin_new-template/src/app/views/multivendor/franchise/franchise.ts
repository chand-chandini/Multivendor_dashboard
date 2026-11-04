import { Component, computed, inject, OnInit, signal, TemplateRef, viewChild } from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import { finalize } from 'rxjs'
import { DataTable, DataTableAction, DataTableActionEvent, DataTableColumn } from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { ApiResponse } from '@core/models/multivendor.model'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { fieldError, resetValidation, validateForm, withValidation } from '@core/validation/form-validation'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

type FranchiseRecord = {
  id: number
  franchise_name: string; franchise_code: string | null; owner_name: string | null
  mobile_number: string; email: string | null; territory_name: string | null; city: string | null; area: string | null
  commission_percentage: number | string
  bank_account_holder: string | null; bank_account_number: string | null; bank_ifsc_code: string | null
  bank_name: string | null; upi_id: string | null
  login_status: number | string; active_status: number | string
}
type StatusField = 'login_status' | 'active_status'

@Component({
  selector: 'app-mv-franchise',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule],
  templateUrl: './franchise.html',
  styles: ``,
})
export class Franchise implements OnInit {
  protected readonly permissions = inject(PermissionService)
  private readonly api = inject(MultivendorService)
  private readonly notify = inject(NotifyService)
  private readonly modalService = inject(NgbModal)
  private readonly fb = inject(FormBuilder)
  readonly permissionPath = '/masters/franchise/franchise-list'
  readonly fieldError = fieldError
  
  readonly formModal = viewChild.required<TemplateRef<any>>('formModal')
  readonly viewModal = viewChild.required<TemplateRef<any>>('viewModal')
  readonly loginCell = viewChild.required<TemplateRef<any>>('loginCell')
  readonly activeCell = viewChild.required<TemplateRef<any>>('activeCell')
  
  readonly records = signal<FranchiseRecord[]>([])
  readonly selectedRecord = signal<FranchiseRecord | null>(null)
  readonly rows = computed(() => this.records().map((row, index) => ({ ...row, serial: index + 1 })))
  readonly cellTemplates = computed(() => ({ login_status: this.loginCell(), active_status: this.activeCell() }))
  
  readonly loading = signal(false)
  readonly loadError = signal('')
  readonly saving = signal(false)
  readonly statusBusy = signal<number | null>(null)
  readonly deletingId = signal<number | null>(null)
  readonly editingId = signal<number | null>(null)
  
  readonly fields: { key: string; label: string; type: string; maxLength?: number }[] = [
    { key: 'franchise_name', label: 'Franchise Name', type: 'text', maxLength: 255 },
    { key: 'franchise_code', label: 'Franchise Code', type: 'text', maxLength: 50 },
    { key: 'owner_name', label: 'Owner Name', type: 'text', maxLength: 255 },
    { key: 'mobile_number', label: 'Phone Number', type: 'tel', maxLength: 10 },
    { key: 'email', label: 'Email', type: 'email', maxLength: 255 },
    { key: 'pwd', label: 'Password', type: 'password' },
    { key: 'territory_name', label: 'Territory', type: 'text', maxLength: 150 },
    { key: 'city', label: 'City', type: 'text', maxLength: 150 },
    { key: 'area', label: 'Area', type: 'text', maxLength: 150 },
    { key: 'commission_percentage', label: 'Commission (%)', type: 'number' },
    { key: 'bank_account_holder', label: 'Account Holder', type: 'text', maxLength: 255 },
    { key: 'bank_account_number', label: 'Account Number', type: 'text', maxLength: 50 },
    { key: 'bank_ifsc_code', label: 'IFSC Code', type: 'text', maxLength: 20 },
    { key: 'bank_name', label: 'Bank Name', type: 'text', maxLength: 150 },
    { key: 'upi_id', label: 'UPI ID', type: 'text', maxLength: 100 },
  ]
  
  readonly columns: DataTableColumn[] = [
    { key: 'serial', label: 'S.No', align: 'center' },
    { key: 'franchise_name', label: 'Name' }, { key: 'franchise_code', label: 'Code' },
    { key: 'owner_name', label: 'Owner' }, { key: 'mobile_number', label: 'Phone Number' },
    { key: 'email', label: 'Email' }, { key: 'territory_name', label: 'Territory' },
    { key: 'city', label: 'City' }, { key: 'area', label: 'Area' },
    { key: 'commission_percentage', label: 'Commission (%)' },
    { key: 'bank_account_holder', label: 'Account Holder' }, { key: 'bank_account_number', label: 'Account Number' },
    { key: 'bank_ifsc_code', label: 'IFSC' }, { key: 'bank_name', label: 'Bank' }, { key: 'upi_id', label: 'UPI ID' },
    { key: 'login_status', label: 'Login Status', align: 'center', sortable: false },
    { key: 'active_status', label: 'Active Status', align: 'center', sortable: false },
  ]
  
  readonly actions: DataTableAction[] = [
    { key: 'view', icon: 'eye', label: 'View', permission: 'view' },
    { key: 'edit', icon: 'edit', label: 'Edit', permission: 'edit' },
    { key: 'delete', icon: 'trash', label: 'Delete', permission: 'delete', className: 'text-danger' },
  ]
  
  readonly form = withValidation(this.fb.nonNullable.group({
    franchise_name: [''], franchise_code: [''], owner_name: [''], mobile_number: [''], email: [''], pwd: [''],
    territory_name: [''], city: [''], area: [''], commission_percentage: [0 as number | null],
    bank_account_holder: [''], bank_account_number: [''], bank_ifsc_code: [''], bank_name: [''], upi_id: [''],
  }), {
    franchise_name: { type: 'text' }, mobile_number: { type: 'phone' },
    franchise_code: { type: 'text', required: false }, owner_name: { type: 'text', required: false },
    email: { type: 'email', required: false },
    pwd: { when: (): boolean => this.editingId() === null || !!this.form?.controls.pwd.value.trim(), minLength: 6 },
    territory_name: { type: 'text', required: false }, city: { type: 'text', required: false }, area: { type: 'text', required: false },
    commission_percentage: { type: 'number', min: 0, max: 100, pattern: /^\d+(?:\.\d{1,2})?$/, formatMessage: 'Use at most two decimal places.' },
    bank_account_holder: { type: 'text', required: false },
    bank_account_number: { required: false, pattern: /^\d{9,18}$/, formatMessage: 'Enter an account number containing 9 to 18 digits.' },
    bank_ifsc_code: { required: false, pattern: /^[A-Z]{4}0[A-Z0-9]{6}$/, formatMessage: 'Enter a valid 11-character IFSC code.' },
    bank_name: { type: 'text', required: false }, upi_id: { type: 'text', required: false },
  })

  ngOnInit(): void { this.load() }

  load(): void {
    this.loading.set(true)
    this.loadError.set('')
    this.api.getFranchises<FranchiseRecord[]>().pipe(finalize(() => this.loading.set(false))).subscribe({
      next: res => {
        if (res.status !== 200 || !Array.isArray(res.data)) {
          this.records.set([])
          this.loadError.set(res.message || 'Could not load franchises. Please try again.')
          return
        }
        this.records.set(res.data.map(row => ({ id: Number(row.id), franchise_name: row.franchise_name,
          franchise_code: row.franchise_code, owner_name: row.owner_name, mobile_number: row.mobile_number,
          email: row.email, territory_name: row.territory_name, city: row.city, area: row.area,
          commission_percentage: row.commission_percentage, bank_account_holder: row.bank_account_holder,
          bank_account_number: row.bank_account_number, bank_ifsc_code: row.bank_ifsc_code, bank_name: row.bank_name,
          upi_id: row.upi_id, login_status: Number(row.login_status), active_status: Number(row.active_status) })))
      },
      error: error => {
        this.records.set([])
        this.loadError.set(this.errorMessage(error))
      },
    })
  }

  private errorMessage(error: { status?: number; error?: { message?: string } }): string {
    if (error.status === 403) return 'You do not have permission to perform this Franchise operation.'
    if (error.status === 401) return 'Your session has expired. Please sign in again.'
    return error.error?.message || 'Could not reach the Franchise API. Please check your connection and try again.'
  }

  openAdd(): void {
    if (!this.permissions.canAdd(this.permissionPath) || this.saving()) return
    this.editingId.set(null)
    this.openForm()
  }

  openEdit(row: FranchiseRecord): void {
    if (!this.permissions.canEdit(this.permissionPath) || this.saving()) return
    this.editingId.set(Number(row.id))
    this.openForm(row)
  }

  openView(row: FranchiseRecord): void {
    if (!this.permissions.canView(this.permissionPath)) return
    this.selectedRecord.set(row)
    // ADDED scrollable: true HERE SO THE HEADER AND FOOTER STAY VISIBLE
    this.modalService.open(this.viewModal(), { centered: true, size: 'lg', scrollable: true })
  }

  downloadPDF(): void {
    const printContent = document.getElementById('pdf-content');
    if (!printContent) return;
    
    const originalContent = document.body.innerHTML;
    document.body.innerHTML = printContent.innerHTML;
    window.print();
    document.body.innerHTML = originalContent;
    window.location.reload(); 
  }

  private openForm(row?: FranchiseRecord): void {
    resetValidation(this.form)
    this.form.reset({ franchise_name: row?.franchise_name ?? '', franchise_code: row?.franchise_code ?? '',
      owner_name: row?.owner_name ?? '', mobile_number: row?.mobile_number ?? '', email: row?.email ?? '', pwd: '',
      territory_name: row?.territory_name ?? '', city: row?.city ?? '', area: row?.area ?? '',
      commission_percentage: Number(row?.commission_percentage ?? 0), bank_account_holder: row?.bank_account_holder ?? '',
      bank_account_number: row?.bank_account_number ?? '', bank_ifsc_code: row?.bank_ifsc_code ?? '',
      bank_name: row?.bank_name ?? '', upi_id: row?.upi_id ?? '' })
    const modal = this.modalService.open(this.formModal(), { centered: true, size: 'lg', backdrop: 'static', scrollable: true, keyboard: false })
    modal.result.then(() => this.form.controls.pwd.reset(), () => this.form.controls.pwd.reset())
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'view') this.openView(event.row)
    if (event.key === 'edit') this.openEdit(event.row)
    if (event.key === 'delete') void this.confirmDelete(event.row)
  }

  submit(): void {
    const id = this.editingId()
    if (this.saving() || !this.permissions.can(id === null ? 'add' : 'edit', this.permissionPath)) return
    for (const field of this.fields) {
      const control = this.form.get(field.key)
      if (field.key !== 'pwd' && typeof control?.value === 'string') control.setValue(control.value.trim())
    }
    this.form.controls.bank_ifsc_code.setValue(this.form.controls.bank_ifsc_code.value.toUpperCase())
    if (!validateForm(this.form)) return
    if (new TextEncoder().encode(this.form.controls.pwd.value).length > 72) {
      this.form.controls.pwd.setErrors({ format: 'Password must contain at most 72 UTF-8 bytes.' })
      return
    }
    const values = this.form.getRawValue()
    const payload: Record<string, unknown> = { ...values }
    if (id !== null) payload['id'] = id
    if (id !== null && !values.pwd.trim()) delete payload['pwd']
    this.saving.set(true)
    const request = id === null ? this.api.addFranchise(payload) : this.api.updateFranchise(payload)
    request.pipe(finalize(() => this.saving.set(false))).subscribe({
      next: res => {
        if (res.status === 200) {
          this.modalService.dismissAll()
          this.notify.success(id === null ? 'Franchise added' : 'Franchise updated')
          this.load()
        } else {
          for (const [key, message] of Object.entries(res['errors'] ?? {})) {
            const control = this.form.get(key)
            if (control && typeof message === 'string') { control.setErrors({ format: message }); control.markAsTouched() }
          }
          this.notify.error('Could not save franchise', res.message)
        }
      },
      error: error => this.notify.error('Could not save franchise', this.errorMessage(error)),
    })
  }

  async toggleStatus(row: FranchiseRecord, field: StatusField, event: Event): Promise<void> {
    const input = event.target as HTMLInputElement
    const checked = input.checked
    input.checked = field === 'login_status' ? Number(row.login_status) === 0 : Number(row.active_status) === 1
    if (this.statusBusy() !== null || !this.permissions.canEdit(this.permissionPath)) return
    const value = field === 'login_status' ? (checked ? 0 : 1) : (checked ? 1 : 0)
    this.statusBusy.set(Number(row.id))
    try {
      const action = field === 'login_status' ? (value === 0 ? 'Allow login' : 'Block login') : (value === 1 ? 'Activate' : 'Deactivate')
      if (!await this.notify.confirm('Update status?', `${action} for "${row.franchise_name}"?`)) { this.statusBusy.set(null); return }
      if (!this.permissions.canEdit(this.permissionPath)) { this.statusBusy.set(null); return }
      const payload = { id: Number(row.id), value }
      const request = field === 'login_status' ? this.api.updateFranchiseLoginStatus(payload) : this.api.updateFranchiseActiveStatus(payload)
      request.pipe(finalize(() => this.statusBusy.set(null))).subscribe({
        next: res => this.afterMutation(res, 'Franchise status updated'),
        error: error => this.notify.error('Could not update status', this.errorMessage(error)),
      })
    } catch {
      this.statusBusy.set(null)
      this.notify.error('Could not update status', 'Please try again.')
    }
  }

  private afterMutation(res: ApiResponse, success: string): void {
    if (res.status === 200) { this.notify.success(success); this.load() }
    else this.notify.error('Could not complete operation', res.message)
  }

  private async confirmDelete(row: FranchiseRecord): Promise<void> {
    if (this.deletingId() !== null || !this.permissions.canDelete(this.permissionPath)) return
    this.deletingId.set(Number(row.id))
    try {
      if (!await this.notify.confirmDelete(`"${row.franchise_name}" will be removed.`)) { this.deletingId.set(null); return }
      if (!this.permissions.canDelete(this.permissionPath)) { this.deletingId.set(null); return }
      this.api.deleteFranchise(Number(row.id)).pipe(finalize(() => this.deletingId.set(null))).subscribe({
        next: res => this.afterMutation(res, 'Franchise deleted'),
        error: error => this.notify.error('Could not delete franchise', this.errorMessage(error)),
      })
    } catch {
      this.deletingId.set(null)
      this.notify.error('Could not delete franchise', 'Please try again.')
    }
  }
}