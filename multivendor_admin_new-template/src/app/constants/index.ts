export const META_DATA = {
  /**
   * Fallback product name. Anything the user sees should prefer
   * `BrandingService.name()`, which resolves to the signed-in tenant's business
   * name and falls back to Ekart360.
   */
  name: 'Ekart360',
  title: 'Admin Dashboard',
  description: 'Tenant admin dashboard for the Ekart360 multivendor platform.',
  author: 'Godavariwave Technologies',
  keywords: 'multivendor, admin dashboard, vendors, orders, products, delivery',
  version: '1.0.0',
  /**
   * Placeholder display name. Live screens read the signed-in admin from
   * AuthService; this only backs the template's unrouted demo views, which are
   * kept on disk as a UI reference.
   */
  username: 'Admin',
}

export const currentYear = new Date().getFullYear()
