import { inject } from '@angular/core'
import { Routes } from '@angular/router'
import { AuthService } from '@core/services/auth.service'
import { AuthGuard } from '@core/services/auth.guard'
import { LayoutService } from '@core/services/layout.service'
import { PermissionGuard } from '@core/services/permission.guard'
import { MainLayout } from '@layouts/main-layout'

/**
 * Multivendor routes.
 *
 * Every path here mirrors a `route_path` in `admin_sub_module` or an entry in
 * the backend's standalone MODULE_PATH_MAP, so the permission-driven sidebar
 * and the router stay in step. The template's demo pages are no longer routed;
 * their components remain under `src/app/views` as a UI reference.
 */
export const routes: Routes = [
  {
    // The landing route is whichever module the admin's permissions put first,
    // so nothing is hard-coded to a module they may not hold.
    path: '',
    pathMatch: 'full',
    redirectTo: () => {
      const auth = inject(AuthService)
      if (!auth.isAuthenticated()) return '/auth/sign-in'
      return auth.firstAllowedPath() ?? '/error/403'
    },
  },
  {
    path: '',
    component: MainLayout,
    canActivate: [AuthGuard, LayoutService],
    children: [
      {
        path: 'masters/franchise/franchise-list',
        loadComponent: () => import('./views/multivendor/franchise/franchise').then((m) => m.Franchise),
        canActivate: [PermissionGuard],
        data: { title: 'Franchise List' },
      },
      {
        path: 'dashboard',
        loadComponent: () => import('./views/multivendor/dashboard/dashboard').then((m) => m.Dashboard),
        canActivate: [PermissionGuard],
        data: { title: 'Dashboard' },
      },
      {
        path: 'masters/locations',
        loadComponent: () => import('./views/multivendor/locations/locations').then((m) => m.Locations),
        canActivate: [PermissionGuard],
        data: { title: 'Locations' },
      },
      {
        path: 'masters/categories',
        loadComponent: () => import('./views/multivendor/categories/categories').then((m) => m.Categories),
        canActivate: [PermissionGuard],
        data: { title: 'Categories' },
      },
      {
        path: 'masters/vendors',
        loadComponent: () => import('./views/multivendor/vendors/vendors').then((m) => m.Vendors),
        canActivate: [PermissionGuard],
        data: { title: 'Vendors' },
      },
      {
        // admin_sub_module 8 (Shop Management / Shop Details) stores this path.
        // Shop Details is the Vendors module renamed: the first admin calls the
        // same getvendors/addvendor/updatevendor/deletevendor endpoints, so the
        // existing Vendors page is reused as-is. Rendered here rather than
        // redirected to /masters/vendors, which carries no permission row.
        path: 'masters/shopdetails',
        loadComponent: () => import('./views/multivendor/vendors/vendors').then((m) => m.Vendors),
        canActivate: [PermissionGuard],
        data: { title: 'Shop Details' },
      },
      {
        path: 'masters/products',
        loadComponent: () => import('./views/multivendor/products/products').then((m) => m.Products),
        canActivate: [PermissionGuard],
        data: { title: 'Products' },
      },
      {
        // admin_sub_module 9 (Shop Management / Shop Items) stores this path.
        path: 'masters/shopitems',
        loadComponent: () => import('./views/multivendor/shop-items/shop-items').then((m) => m.ShopItems),
        canActivate: [PermissionGuard],
        data: { title: 'Shop Items' },
      },
      {
        // admin_sub_module 11 (Products / Master Data) stores this path. Master
        // Data is a second view of the same shopitems table, so it has its own
        // page and permission row but reuses the shop item endpoints.
        path: 'masters/masterdata',
        loadComponent: () => import('./views/multivendor/master-data/master-data').then((m) => m.MasterData),
        canActivate: [PermissionGuard],
        data: { title: 'Master Data' },
      },
      {
        // admin_sub_module 12 (Products / Product Assignment) stores this path.
        path: 'masters/productassignment',
        loadComponent: () => import('./views/multivendor/product-assignment/product-assignment').then((m) => m.ProductAssignment),
        canActivate: [PermissionGuard],
        data: { title: 'Product Assignment' },
      },
     {
  // admin_sub_module 15 - Vendor Payments
  path: 'masters/payment',
  loadComponent: () => import('./views/multivendor/payments/payments').then((m) => m.Payments),
  canActivate: [PermissionGuard],
  data: { title: 'Payments' },
},
{
  path: 'masters/deliveryboypayment',
  loadComponent: () =>
    import('./views/multivendor/delivery-boy-payments/delivery-boy-payments')
      .then((m) => m.DeliveryBoyPayments),
  canActivate: [PermissionGuard],
  data: { title: 'Payments' },
},
{
  path: 'masters/deliveryboypaymenthistory',
  loadComponent: () =>
    import('./views/multivendor/delivery-boy-payment-history/delivery-boy-payment-history')
      .then((m) => m.DeliveryBoyPaymentHistory),
  canActivate: [PermissionGuard],
  data: { title: 'Payment History' },
},
      {
        // admin_sub_module 16 and 19. Same getpayments endpoint, date-filtered.
        path: 'masters/paymenthistory',
        loadComponent: () => import('./views/multivendor/payment-history/payment-history').then((m) => m.PaymentHistory),
        canActivate: [PermissionGuard],
        data: { title: 'Payment History' },
      },
      {
        // admin_sub_module 20 (Delivery Boys / COD Settlements).
        path: 'masters/codsettlements',
        loadComponent: () => import('./views/multivendor/cod-settlements/cod-settlements').then((m) => m.CodSettlements),
        canActivate: [PermissionGuard],
        data: { title: 'COD Settlements' },
      },
      {
        // admin_sub_module 23. Reuses gettenantsettings/updatetenantsettings.
        path: 'masters/website-management/brand-settings',
        loadComponent: () => import('./views/multivendor/brand-settings/brand-settings').then((m) => m.BrandSettings),
        canActivate: [PermissionGuard],
        data: { title: 'Brand Settings' },
      },
      {
        // admin_sub_module 24. tenant_website_banners - distinct from /masters/banners.
        path: 'masters/website-management/banners',
        loadComponent: () => import('./views/multivendor/website-banners/website-banners').then((m) => m.WebsiteBanners),
        canActivate: [PermissionGuard],
        data: { title: 'Website Banners' },
      },
      {
        // admin_sub_module 25.
        path: 'masters/website-management/home-page',
        loadComponent: () => import('./views/multivendor/home-page/home-page').then((m) => m.HomePage),
        canActivate: [PermissionGuard],
        data: { title: 'Home Page' },
      },
      {
        // admin_sub_module 26.
        path: 'masters/website-management/promotional-sections',
        loadComponent: () => import('./views/multivendor/promotional-sections/promotional-sections').then((m) => m.PromotionalSections),
        canActivate: [PermissionGuard],
        data: { title: 'Promotional Sections' },
      },
      {
        // admin_sub_module 27.
        path: 'masters/website-management/testimonials',
        loadComponent: () => import('./views/multivendor/testimonials/testimonials').then((m) => m.Testimonials),
        canActivate: [PermissionGuard],
        data: { title: 'Testimonials' },
      },
      {
        // admin_sub_module 28.
        path: 'masters/website-management/footer-settings',
        loadComponent: () => import('./views/multivendor/footer-settings/footer-settings').then((m) => m.FooterSettings),
        canActivate: [PermissionGuard],
        data: { title: 'Footer Settings' },
      },
      {
        // admin_sub_module 29. The theme already lives in Settings (Branding tab
        // plus the layout customizer), so this path renders that existing page
        // rather than introducing a second theme system.
      
  path: 'masters/website-management/theme-settings',
  loadComponent: () =>
    import('./views/multivendor/website-theme-settings/website-theme-settings')
      .then((m) => m.WebsiteThemeSettings),
  canActivate: [PermissionGuard],
  data: { title: 'Theme Settings' },
},
      {
        path: 'masters/orders',
        loadComponent: () => import('./views/multivendor/orders/orders').then((m) => m.Orders),
        canActivate: [PermissionGuard],
        data: { title: 'Orders' },
      },
      {
        path: 'masters/customers',
        loadComponent: () => import('./views/multivendor/customers/customers').then((m) => m.Customers),
        canActivate: [PermissionGuard],
        data: { title: 'Customers' },
      },
      {
        path: 'masters/deliverypartners',
        loadComponent: () => import('./views/multivendor/delivery-partners/delivery-partners').then((m) => m.DeliveryPartners),
        canActivate: [PermissionGuard],
        data: { title: 'Delivery Partners' },
      },
      {
        // admin_sub_module 17 (Delivery Boys / Delivery Boys) stores this path.
        // Both read the same delivery_partners table, so the existing Delivery
        // Partners page serves it unchanged.
        path: 'masters/deliveryboys',
        loadComponent: () => import('./views/multivendor/delivery-partners/delivery-partners').then((m) => m.DeliveryPartners),
        canActivate: [PermissionGuard],
        data: { title: 'Delivery Boys' },
      },
      {
        path: 'masters/banners',
        loadComponent: () => import('./views/multivendor/banners/banners').then((m) => m.Banners),
        canActivate: [PermissionGuard],
        data: { title: 'Banners' },
      },
      {
        path: 'masters/coupons',
        loadComponent: () => import('./views/multivendor/coupons/coupons').then((m) => m.Coupons),
        canActivate: [PermissionGuard],
        data: { title: 'Coupons' },
      },
      {
        // admin_sub_module 7 (Masters / Charges) stores this path.
        path: 'masters/charges',
        loadComponent: () => import('./views/multivendor/charges/charges').then((m) => m.Charges),
        canActivate: [PermissionGuard],
        data: { title: 'Charges' },
      },
      {
        path: 'masters/notifications',
        loadComponent: () => import('./views/multivendor/notifications/notifications').then((m) => m.Notifications),
        canActivate: [PermissionGuard],
        data: { title: 'Notifications' },
      },
      {
        path: 'masters/vendorsettlements',
        loadComponent: () => import('./views/multivendor/settlements/settlements').then((m) => m.Settlements),
        canActivate: [PermissionGuard],
        data: { title: 'Settlements' },
      },
    {
  path: 'masters/settings',
  loadComponent: () => import('./views/multivendor/settings/settings').then((m) => m.Settings),
  data: { title: 'Settings' },
},
      {
        path: 'masters/devsupport',
        loadComponent: () => import('./views/multivendor/dev-support/dev-support').then((m) => m.DevSupport),
        canActivate: [PermissionGuard],
        data: { title: 'Dev Support' },
      },
      {
        path: 'permission/permissions',
        loadComponent: () => import('./views/multivendor/permissions/permissions').then((m) => m.Permissions),
        canActivate: [PermissionGuard],
        data: { title: 'Permissions' },
      },
      {
        // Own profile - available to every signed-in admin, so no module permission.
        path: 'appusers/myprofile',
        loadComponent: () => import('./views/multivendor/my-profile/my-profile').then((m) => m.MyProfile),
        data: { title: 'My Profile' },
      },
    ],
  },
  {
    path: '',
    canActivate: [LayoutService],
    children: [
      {
        path: 'auth/sign-in',
        loadComponent: () => import('./views/auth/sign-in/sign-in').then((m) => m.SignIn),
        data: { title: 'Sign In' },
      },
      {
        path: 'error/403',
        loadComponent: () => import('./views/error/error-403/error-403').then((m) => m.Error403),
        data: { title: '403 Forbidden' },
      },
      {
        path: 'error/404',
        loadComponent: () => import('./views/error/error-404/error-404').then((m) => m.Error404),
        data: { title: '404 Not Found' },
      },
      {
        path: 'error/500',
        loadComponent: () => import('./views/error/error-500/error-500').then((m) => m.Error500),
        data: { title: '500 Internal Server' },
      },
      {
        path: 'error/maintenance',
        loadComponent: () => import('./views/error/maintenance/maintenance').then((m) => m.Maintenance),
        data: { title: 'Maintenance' },
      },
    ],
  },
  {
    path: '**',
    redirectTo: 'error/404',
  },
]
