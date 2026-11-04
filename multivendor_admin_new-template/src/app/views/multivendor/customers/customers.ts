import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core'
import { FormsModule } from '@angular/forms'
import {
  DataTable,
  DataTableAction,
  DataTableActionEvent,
  DataTableColumn,
} from '@app/components/data-table/data-table'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

@Component({
  selector: 'app-mv-customers',
  imports: [PageBreadcrumb, DataTable, FormsModule],
  templateUrl: './customers.html',
  styles: ``,
})
export class Customers implements OnInit {
  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)

  protected permissions = inject(PermissionService)

  readonly detailsModal = viewChild.required<TemplateRef<any>>('detailsModal')
  readonly activeCell = viewChild.required<TemplateRef<any>>('activeCell')

  // DATA
  readonly rows = signal<any[]>([])
  readonly loading = signal(true)
  readonly selected = signal<any | null>(null)
  readonly detailsLoading = signal(false)

  // FILTER DATA
  readonly locations = signal<any[]>([])
  selectedLocation: number | null = null
  searchText = ''
  readonly appliedLocation = signal<number | null>(null)
  readonly appliedSearchText = signal('')

  // FILTERED LIST
  readonly filteredRows = computed(() => {
    const customers = this.rows()
    const locationId = this.appliedLocation()
    const search = this.appliedSearchText().trim().toLowerCase()

    return customers.filter((customer) => {
      const locationMatch =
        !locationId ||
        String(customer.location_ids ?? '')
          .split(',')
          .map((id: string) => id.trim())
          .includes(String(locationId))

      const searchMatch =
        !search ||
        String(customer.customer_name ?? '').toLowerCase().includes(search) ||
        String(customer.mobile_number ?? '').toLowerCase().includes(search) ||
        String(customer.email ?? '').toLowerCase().includes(search)

      return locationMatch && searchMatch
    })
  })

  // TEMPLATES
  readonly cellTemplates = computed(() => ({
    active_status: this.activeCell(),
  }))

  // COLUMNS
  readonly columns: DataTableColumn[] = [
    { key: 'customer_name', label: 'Name', width: '16%' },
    { key: 'mobile_number', label: 'Phone Number', width: '13%' },
    { key: 'email', label: 'Email', width: '18%' },
    { key: 'location', label: 'Location', width: '15%' },
    { key: 'completed_orders', label: 'Completed Orders', width: '10%', align: 'center' },
    { key: 'pending_orders', label: 'Pending Orders', width: '10%', align: 'center' },
    { key: 'rejected_orders', label: 'Rejected Orders', width: '10%', align: 'center' },
    { key: 'total_orders', label: 'Total Orders', width: '10%', align: 'center' },
  ]

  // ACTIONS
  readonly actions: DataTableAction[] = [
    { key: 'view', icon: 'eye', label: 'View Details' }
  ]

  ngOnInit(): void {
    this.load()
    this.loadLocations()
  }

  load(): void {
    this.loading.set(true)
    this.api.getCustomers().subscribe({
      next: (res) => {
        this.loading.set(false)
        this.rows.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => {
        this.loading.set(false)
        this.rows.set([])
      },
    })
  }

  loadLocations(): void {
    this.api.getLocations().subscribe({
      next: (res) => {
        this.locations.set(res.status === 200 ? (res.data ?? []) : [])
      },
      error: () => this.locations.set([]),
    })
  }

  applyFilters(): void {
    this.appliedLocation.set(this.selectedLocation ? Number(this.selectedLocation) : null)
    this.appliedSearchText.set(this.searchText.trim())
  }

  clearFilters(): void {
    this.selectedLocation = null
    this.searchText = ''
    this.appliedLocation.set(null)
    this.appliedSearchText.set('')
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'view') {
      this.openDetails(event.row)
    }
  }

  openDetails(row: any): void {
    this.selected.set(row)
    this.detailsLoading.set(true)

    this.modalService.open(this.detailsModal(), {
      centered: true,
      size: 'lg',
      scrollable: true,
    })

    this.api.getCustomerDetails(row.id).subscribe({
      next: (res) => {
        this.detailsLoading.set(false)
        if (res.status === 200 && res.data) {
          // Merge the table row (which has location and order counts) 
          // with the API response (which has addresses and email).
          this.selected.set({
            ...row,
            ...res.data
          })
        }
      },
      error: () => this.detailsLoading.set(false),
    })
  }

  toggleActive(row: any, checked: boolean): void {
    const value = checked ? 1 : 0
    this.api.updateCustomerActiveStatus({ id: row.id, value }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          row.active_status = value
          this.notify.success('Customer status updated')
        } else {
          this.notify.error('Could not update status', res.message)
        }
      },
      error: () => this.notify.error('Could not update status', 'Please try again.'),
    })
  }
}