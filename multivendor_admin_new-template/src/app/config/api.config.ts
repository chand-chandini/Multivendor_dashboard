/**
 * Multivendor backend configuration.
 *
 * Points at the existing Multivendor API (mvapi) — the tenant-admin surface
 * exposed under `/dashboard_api`. No separate auth/backend is introduced here.
 */
export const API_CONFIG = {
  /** Base URL of the existing Multivendor dashboard API. Must end with a slash. */
baseUrl: 'https://ekart360.in:2477/dashboard_api/',
//baseUrl: 'https://localhost:2407/dashboard_api/',
}

/** Storage keys used to persist the authenticated session. */
export const STORAGE_KEYS = {
  token: 'mv_token',
  user: 'mv_user',
  menu: 'mv_menu',
  permissions: 'mv_permissions',
  tenant: 'mv_tenant',
} as const
