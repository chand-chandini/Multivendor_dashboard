import { CommonModule } from '@angular/common'
import { Component, effect, inject, input, output, TemplateRef } from '@angular/core'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { CustomPagination } from '@app/components/custom-pagination/custom-pagination'
import { Icon } from '@app/components/icon/icon'
import { PermissionAction } from '@core/models/multivendor.model'
import { NgbSortableHeader } from '@core/directive/sortable.directive'
import { PermissionService } from '@core/services/permission.service'
import { TableService } from '@core/services/table.service'
import { API_CONFIG } from '../../config/api.config'
/** How a cell is rendered when no custom template is supplied. */
export type DataTableColumnType =
  | 'text'
  | 'badge'
  | 'image'
  | 'currency'
  | 'date'
  | 'datetime'
  | 'boolean'
  | 'switch'
export type DataTableColumn = {
  /** Property on the row, dot paths supported (e.g. "vendor.name"). */
  key: string
  label: string
  type?: DataTableColumnType
  width?: string
  sortable?: boolean
  align?: 'start' | 'center' | 'end'
  /** Bootstrap contextual class for `type: 'badge'`. */
  badgeClass?: (value: any, row: any) => string
  /** Overrides the rendered text entirely. */
  format?: (value: any, row: any) => string
}

export type DataTableAction = {
  key: string
  icon: string
  label: string
  /** Hidden unless the signed-in admin holds this permission on the route. */
  permission?: PermissionAction
  className?: string
  hidden?: (row: any) => boolean
}

export type DataTableActionEvent = {
  key: string
  row: any
}

/**
 * Config-driven list view built from the template's own card, search, table,
 * sort and pagination patterns, so every Multivendor module page looks and
 * behaves the same. Row actions are gated by `admin_user_permissions` through
 * PermissionService.
 */
@Component({
  selector: 'app-data-table',
  imports: [CommonModule, FormsModule, RouterLink, Icon, NgbSortableHeader, CustomPagination],
  providers: [TableService],
  templateUrl: './data-table.html',
  styles: ``,
})
export class DataTable {
  private permissions = inject(PermissionService)

  readonly rows = input<any[]>([])
  readonly columns = input<DataTableColumn[]>([])
  readonly actions = input<DataTableAction[]>([])

  readonly title = input<string>('')
  readonly searchPlaceholder = input<string>('Search...')
  readonly itemsName = input<string>('records')
  readonly pageSize = input<number>(10)
  readonly loading = input<boolean>(false)
  readonly emptyMessage = input<string>('Nothing found.')

  /** Label for the primary button; hidden when `addLabel` is empty. */
  readonly addLabel = input<string>('')
  /** Permission required for the primary button. */
  readonly addPermission = input<PermissionAction>('add')
  /** Route to check permissions against; defaults to the current route. */
  readonly permissionPath = input<string | undefined>(undefined)

  /** Per-column overrides, keyed by column key. Context: `$implicit` = row. */
  readonly cellTemplates = input<Record<string, TemplateRef<any>>>({})

  readonly add = output<void>()
  readonly action = output<DataTableActionEvent>()
readonly statusChange = output<{ id: number; field: string; value: number }>()
  private pageSizeApplied = false

  constructor(public tableService: TableService<any>) {
    effect(() => {
      // Reloading rows must not undo a page size the user picked themselves,
      // so the input only seeds the initial value.
      const pageSize = this.pageSizeApplied ? this.tableService.pageSize : this.pageSize()
      this.pageSizeApplied = true
      this.tableService.setItems([...this.rows()], pageSize)
    })
  }

  get visibleColumnCount(): number {
    return this.columns().length + (this.visibleActionsExist ? 1 : 0)
  }

  get visibleActionsExist(): boolean {
    return this.actions().some((a) => this.isActionAllowed(a))
  }

  get canAdd(): boolean {
    return !!this.addLabel() && this.permissions.can(this.addPermission(), this.permissionPath())
  }

  isActionAllowed(action: DataTableAction): boolean {
    if (!action.permission) return true
    return this.permissions.can(action.permission, this.permissionPath())
  }

  isActionVisible(action: DataTableAction, row: any): boolean {
    if (!this.isActionAllowed(action)) return false
    return !action.hidden?.(row)
  }

  templateFor(column: DataTableColumn): TemplateRef<any> | null {
    return this.cellTemplates()[column.key] ?? null
  }

  value(row: any, column: DataTableColumn): any {
    return column.key.split('.').reduce((acc: any, part: string) => acc?.[part], row)
  }

  display(row: any, column: DataTableColumn): string {
    const raw = this.value(row, column)
    if (column.format) return column.format(raw, row)
    if (raw === null || raw === undefined || raw === '') return '-'

    switch (column.type) {
      case 'currency':
        return formatCurrency(raw)
      case 'date':
        return formatDate(raw, false)
      case 'datetime':
        return formatDate(raw, true)
      case 'boolean':
        return isTruthy(raw) ? 'Yes' : 'No'
      default:
        return String(raw)
    }
  }

  badgeClass(row: any, column: DataTableColumn): string {
    const raw = this.value(row, column)
    if (column.badgeClass) return column.badgeClass(raw, row)
    return isTruthy(raw) ? 'badge bg-success-subtle text-success' : 'badge bg-danger-subtle text-danger'
  }





getImageUrl(value: any): string {
  if (!value || typeof value !== 'string') {
    return '';
  }

  if (value.startsWith('data:image/')) {
    return value;
  }

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  const apiOrigin = API_CONFIG.baseUrl
    .replace(/\/dashboard_api\/?$/, '')
    .replace(/\/+$/, '');

  const imagePath = value.replace(/^\/+/, '');

  if (imagePath.startsWith('uploads/')) {
    return `${apiOrigin}/upload_files/${imagePath.substring('uploads/'.length)}`;
  }

  if (imagePath.startsWith('upload_files/')) {
    return `${apiOrigin}/${imagePath}`;
  }

  return `${apiOrigin}/upload_files/${imagePath}`;
}

onSort(column: string, direction: 'asc' | 'desc' | '') {

  this.tableService.setSort(column, direction)

}

isTruthy(value: any): boolean {

  return isTruthy(value)

}

onSwitchChange(row: any, column: DataTableColumn, event: Event): void {

  const checked = (event.target as HTMLInputElement).checked

  this.statusChange.emit({

    id: Number(row.id),

    field: column.key,

    value: checked ? 1 : 0,

  })

}

}

function isTruthy(value: any): boolean {

  return value === 1 || value === '1' || value === true || value === 'true' || value === 'Active'

}

function formatCurrency(value: any): string {

  const amount = Number(value)

  if (Number.isNaN(amount)) return String(value)

  return '₹' + amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

}

function formatDate(value: any, withTime: boolean): string {

  const date = new Date(value)

  if (Number.isNaN(date.getTime())) return String(value)

  const datePart = date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })

  if (!withTime) return datePart

  return datePart + ' ' + date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })

}