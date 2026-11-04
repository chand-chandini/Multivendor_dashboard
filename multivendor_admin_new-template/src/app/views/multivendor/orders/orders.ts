import { CurrencyPipe } from '@angular/common'
import {
  Component,
  computed,
  inject,
  OnInit,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core'
import { FormBuilder, ReactiveFormsModule } from '@angular/forms'
import {
  DataTable,
  DataTableAction,
  DataTableActionEvent,
  DataTableColumn,
} from '@app/components/data-table/data-table'
import { Icon } from '@app/components/icon/icon'
import { PageBreadcrumb } from '@app/components/page-breadcrumb/page-breadcrumb'
import { MultivendorService } from '@core/services/multivendor.service'
import { NotifyService } from '@core/services/notify.service'
import { PermissionService } from '@core/services/permission.service'
import { NgbModal } from '@ng-bootstrap/ng-bootstrap'

const ORDER_STATUS = [
  { value: 0, label: 'Placed', className: 'badge bg-secondary-subtle text-secondary' },
  { value: 1, label: 'Accepted', className: 'badge bg-info-subtle text-info' },
  { value: 2, label: 'Preparing', className: 'badge bg-warning-subtle text-warning' },
  { value: 3, label: 'Out for Delivery', className: 'badge bg-primary-subtle text-primary' },
  { value: 4, label: 'Completed', className: 'badge bg-success-subtle text-success' },
  { value: 5, label: 'Cancelled', className: 'badge bg-danger-subtle text-danger' },
  { value: 6, label: 'Rejected', className: 'badge bg-danger-subtle text-danger' },
  { value: 7, label: 'Legacy', className: 'badge bg-dark-subtle text-dark' },
]

@Component({
  selector: 'app-mv-orders',
  imports: [PageBreadcrumb, DataTable, ReactiveFormsModule, Icon, CurrencyPipe],
  templateUrl: './orders.html',
  styles: ``,
})
export class Orders implements OnInit {
  private api = inject(MultivendorService)
  private notify = inject(NotifyService)
  private modalService = inject(NgbModal)
  private fb = inject(FormBuilder)

  protected permissions = inject(PermissionService)

  readonly detailsModal = viewChild.required<TemplateRef<any>>('detailsModal')
  readonly statusCell = viewChild.required<TemplateRef<any>>('statusCell')

  readonly statusOptions = ORDER_STATUS

  readonly rows = signal<any[]>([])
  readonly categories = signal<any[]>([])
  readonly locations = signal<any[]>([])
  readonly vendors = signal<any[]>([])

  readonly loading = signal(true)

  readonly selectedOrder = signal<any | null>(null)
  readonly detailsLoading = signal(false)
  private detailsRequestId = 0

  readonly activeSection = signal<'all' | 'placed' | 'accepted' | 'ongoing' | 'completed' | 'rejected'>('all')

  readonly cellTemplates = computed(() => ({
    order_status: this.statusCell(),
  }))

  readonly filterForm = this.fb.nonNullable.group({
    from_date: [''],
    to_date: [''],
    category_id: [''],
    location_id: [''],
    vendor_id: [''],
  })

  readonly columns: DataTableColumn[] = [
    { key: 'order_number', label: 'Orders', width: '13%' },
    { key: 'customer_name', label: 'Customer Name', width: '16%' },
    { key: 'order_date_time', label: 'Order Date', type: 'datetime', width: '14%' },
    { key: 'delivery_address', label: 'Delivery Address', width: '22%' },
    { key: 'grand_total', label: 'Grand Total', type: 'currency', width: '12%', align: 'end' },
    { key: 'payment_type', label: 'Payment Type', width: '11%', format: (value) => value ? String(value).toUpperCase() : '-' },
    { key: 'order_status', label: 'Order Status', width: '12%', align: 'center', sortable: false },
  ]

  // ADDED: download action
  readonly actions: DataTableAction[] = [
    { key: 'view', icon: 'eye', label: 'View details' },
    { key: 'download', icon: 'download', label: 'Download Invoice', className: 'text-primary' },
  ]

  ngOnInit(): void {
    this.loadMasterData()
    this.load()
  }

  loadMasterData(): void {
    this.api.getCategories().subscribe({
      next: (res) => this.categories.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.categories.set([]),
    })

    this.api.getLocations().subscribe({
      next: (res) => this.locations.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.locations.set([]),
    })

    this.api.getVendors().subscribe({
      next: (res) => this.vendors.set(res.status === 200 ? (res.data ?? []) : []),
      error: () => this.vendors.set([]),
    })
  }

  load(): void {
    const filters = this.filterForm.getRawValue()

    if ((filters.from_date && !filters.to_date) || (!filters.from_date && filters.to_date)) {
      this.notify.error('Incomplete date range', 'Enter both From Date and To Date.')
      return
    }

    this.loading.set(true)
    const payload: Record<string, unknown> = {}

    if (filters.from_date && filters.to_date) {
      payload['from_date'] = filters.from_date
      payload['to_date'] = filters.to_date
    }
    if (filters.category_id) payload['category_id'] = filters.category_id
    if (filters.location_id) payload['location_id'] = filters.location_id
    if (filters.vendor_id) payload['vendor_id'] = filters.vendor_id

    const statusFilter = this.getSectionStatus()
    if (statusFilter !== null) payload['order_status'] = statusFilter

    this.api.getOrders(payload).subscribe({
      next: (res) => {
        this.loading.set(false)
        if (res.status === 200) {
          this.rows.set(res.data ?? [])
        } else {
          this.rows.set([])
        }
      },
      error: () => {
        this.loading.set(false)
        this.rows.set([])
        this.notify.error('Could not load orders', 'Please try again.')
      },
    })
  }

  getSectionStatus(): number | null {
    const section = this.activeSection()
    switch (section) {
      case 'placed': return 0
      case 'accepted': return 1
      case 'completed': return 4
      default: return null
    }
  }

  selectSection(section: 'all' | 'placed' | 'accepted' | 'ongoing' | 'completed' | 'rejected'): void {
    this.activeSection.set(section)
    this.load()
  }

  resetFilters(): void {
    this.filterForm.reset({
      from_date: '',
      to_date: '',
      category_id: '',
      location_id: '',
      vendor_id: '',
    })
    this.activeSection.set('all')
    this.load()
  }

  readonly displayedRows = computed(() => {
    const rows = this.rows()
    const section = this.activeSection()

    switch (section) {
      case 'placed': return rows.filter((row) => Number(row.order_status) === 0)
      case 'accepted': return rows.filter((row) => Number(row.order_status) === 1)
      case 'ongoing': return rows.filter((row) => [2, 3].includes(Number(row.order_status)))
      case 'completed': return rows.filter((row) => Number(row.order_status) === 4)
      case 'rejected': return rows.filter((row) => [5, 6].includes(Number(row.order_status)))
      default: return rows
    }
  })

  statusLabel(value: any): string {
    return ORDER_STATUS.find((status) => status.value === Number(value))?.label ?? 'Unknown'
  }

  statusClass(value: any): string {
    return ORDER_STATUS.find((status) => status.value === Number(value))?.className ?? 'badge bg-secondary-subtle text-secondary'
  }

  onAction(event: DataTableActionEvent): void {
    if (event.key === 'view') {
      this.openDetails(event.row)
    } else if (event.key === 'download') {
      this.downloadInvoice(event.row)
    }
  }

  openDetails(row: any): void {
    const requestId = ++this.detailsRequestId
    this.selectedOrder.set(row)
    this.detailsLoading.set(true)

    this.modalService.open(this.detailsModal(), {
      centered: true, size: 'lg', scrollable: true,
    })

    this.api.getOrderDetails(row.id).subscribe({
      next: (res) => {
        if (requestId !== this.detailsRequestId) return
        this.detailsLoading.set(false)
        if (res.status === 200 && res.data) {
          this.selectedOrder.set(res.data)
        }
      },
      error: () => {
        if (requestId !== this.detailsRequestId) return
        this.detailsLoading.set(false)
        this.notify.error('Could not load order', 'Please try again.')
      },
    })
  }

  // ADDED: Download logic
  downloadInvoice(row: any): void {
    // If you have a backend endpoint for PDF download, replace the logic below with:
    // window.open(`https://your-api.com/api/orders/${row.id}/invoice`, '_blank');
    
    this.notify.success(`Generating Invoice for Order #${row.order_number || row.id}...`);
    
    // Simulating the download process (e.g., creating a text receipt)
    setTimeout(() => {
      const receiptContent = `
=========================================
              INVOICE / RECEIPT
=========================================
Order Number : ${row.order_number || row.id}
Date         : ${row.order_date_time || '-'}
Customer     : ${row.customer_name || '-'}
Shop         : ${row.vendor_name || '-'}
-----------------------------------------
Grand Total  : ₹${row.grand_total || 0}
Payment Type : ${row.payment_type ? row.payment_type.toUpperCase() : '-'}
Status       : ${this.statusLabel(row.order_status)}
=========================================
Thank you for your order!
      `;
      
      const blob = new Blob([receiptContent], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Invoice_${row.order_number || row.id}.txt`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    }, 500);
  }

  changeStatus(row: any, newStatus: string): void {
    const value = Number(newStatus)
    if (Number.isNaN(value) || value === Number(row.order_status)) return

    this.api.updateOrderStatus({ order_id: row.id, new_status: value }).subscribe({
      next: (res) => {
        if (res.status === 200) {
          row.order_status = value
          const selected = this.selectedOrder()
          if (selected && selected.id === row.id) {
            this.selectedOrder.set({ ...selected, order_status: value })
          }
          this.notify.success('Order status updated')
          this.load()
        } else {
          this.notify.error('Could not update order status', res.message)
        }
      },
      error: () => this.notify.error('Could not update order status', 'Please try again.'),
    })
  }
}