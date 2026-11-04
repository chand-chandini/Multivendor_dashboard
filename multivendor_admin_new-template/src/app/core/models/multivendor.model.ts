/**
 * Shapes returned by the existing Multivendor dashboard API
 * (`POST /dashboard_api/getUserData` and friends).
 */

/** A row of `admin_users_t`, minus the password. */
export type AdminUser = {
  id: number
  tenant_id: number
  name: string | null
  mobile_number: string | null
  email: string | null
  /** Admin type / role label, e.g. "Admin", "Manager". */
  designation: string | null
  profile_image: string | null
  login_status: number
  i_ts?: string
}

/** CRUD flags stored on `admin_user_permissions`. */
export type PermissionFlags = {
  can_view: number
  can_add: number
  can_edit: number
  can_delete: number
}

/** One node of the permission-driven sidebar tree built by the API. */
export type MenuNode = PermissionFlags & {
  /** Present on main modules (`admin_main_module.id`). */
  id?: number
  /** Present on sub modules (`admin_sub_module.id`). */
  sub_id?: number
  parent_id?: number
  title: string
  path: string | null
  icon?: string | null
  type: 'sub' | 'link'
  level: number
  active?: boolean
  children?: MenuNode[]
}

/** Flat permission row, one per navigable module/sub-module. */
export type ModulePermission = PermissionFlags & {
  module_id: number
  sub_module_id: number | null
  module_name: string
  sub_module_name: string | null
  path: string | null
}

export type TenantInfo = {
  name: string
  settings: Record<string, any>
  branding: Record<string, any>
}

/** Envelope used by every `/dashboard_api` endpoint. */
export type ApiResponse<T = any> = {
  status: number
  message?: string
  data?: T
  [key: string]: any
}

export type LoginResponse = ApiResponse & {
  usr_data?: AdminUser[]
  data?: MenuNode[]
  permissions?: ModulePermission[]
  token?: string
  tenant?: TenantInfo
}

/** The four actions guarded by `admin_user_permissions`. */
export type PermissionAction = 'view' | 'add' | 'edit' | 'delete'
