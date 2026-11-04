import { API_CONFIG } from '@/app/config/api.config'
import { HttpClient } from '@angular/common/http'
import { inject, Injectable } from '@angular/core'
import { ApiResponse } from '@core/models/multivendor.model'
import { Observable } from 'rxjs'

/**
 * Single access point for the existing Multivendor tenant-admin API
 * (mvapi -> dashboard_api). Endpoint names and payload shapes are unchanged
 * from the current Multivendor Dashboard; only the UI on top of them is new.
 */
@Injectable({
  providedIn: 'root',
})
export class MultivendorService {
  private http = inject(HttpClient)

  private get<T = any>(path: string): Observable<ApiResponse<T>> {
    return this.http.get<ApiResponse<T>>(API_CONFIG.baseUrl + path)
  }

  private post<T = any>(path: string, body: unknown = {}): Observable<ApiResponse<T>> {
    return this.http.post<ApiResponse<T>>(API_CONFIG.baseUrl + path, body)
  }

  private put<T = any>(path: string, body: unknown = {}): Observable<ApiResponse<T>> {
    return this.http.put<ApiResponse<T>>(API_CONFIG.baseUrl + path, body)
  }

  private del<T = any>(path: string): Observable<ApiResponse<T>> {
    return this.http.delete<ApiResponse<T>>(API_CONFIG.baseUrl + path)
  }

  // Franchise administration. Tenant and action access are enforced by the API.
  getFranchises<T = any[]>() {
    return this.get<T>('getfranchises')
  }

  addFranchise(payload: unknown) {
    return this.post('addfranchise', payload)
  }

  updateFranchise(payload: unknown) {
    return this.post('updatefranchise', payload)
  }

  deleteFranchise(id: number) {
    return this.post('deletefranchise', { id })
  }

  updateFranchiseLoginStatus(payload: { id: number; value: number }) {
    return this.post('updatefranchiseloginstatus', payload)
  }

  updateFranchiseActiveStatus(payload: { id: number; value: number }) {
    return this.post('updatefranchiseactivestatus', payload)
  }

  // ------------------------------------------------------------------
  // Dashboard
  // ------------------------------------------------------------------
  getDashboard() {
    return this.get('getDashboard')
  }

  // ------------------------------------------------------------------
  // Public branding (no token — used by the sign-in page)
  // ------------------------------------------------------------------
  /**
   * Resolves the tenant for the host the dashboard is served on and returns
   * its branding, so the sign-in page can be white-labelled before login.
   * `tenant` overrides the host lookup with a tenant code or id, which is how a
   * shared host such as localhost can be pointed at a specific tenant.
   * Responds with status 204 when no tenant matches.
   */
  getLoginBranding(host: string, tenant?: string | null) {
    const params = new URLSearchParams({ host })
    if (tenant) params.set('tenant', tenant)
    return this.get(`getloginbranding?${params.toString()}`)
  }

  // ------------------------------------------------------------------
  // Admin users, modules and permissions
  // ------------------------------------------------------------------
  getUserList() {
    return this.get('getuserlist')
  }

  getModuleListDetails(usr_id: number | string) {
    return this.post('getmodulelistdetails', { usr_id })
  }

  getUpdateModules(usr_id: number | string) {
    return this.post('getupdatemodules', { usr_id })
  }

  addAdminUser(payload: unknown) {
    return this.post('submituserslogin', payload)
  }

  saveUserModules(payload: unknown) {
    return this.post('postusermenulist', payload)
  }

  deleteAdminUser(ids: Array<number | string>) {
    return this.post('deleteuser', ids)
  }

  getUserProfile(user_id: number | string) {
    return this.post('getusersprofile', { user_id })
  }

  updateUserPassword(user_id: number | string, new_password: string) {
    return this.post('updateuserpassword', { user_id, new_password })
  }

  // ------------------------------------------------------------------
  // Locations
  // ------------------------------------------------------------------
  getLocations() {
    return this.get('getlocation')
  }

addLocation(payload: FormData) {
  return this.post('addlocation', payload)
}

updateLocation(payload: FormData) {
  return this.post('updatelocation', payload)
}

  updateLocationActiveStatus(payload: unknown) {
    return this.post('updatelocationactivestatus', payload)
  }

  deleteLocation(id: number | string) {
    return this.post('deletelocation', { id })
  }

  // ------------------------------------------------------------------
  // Categories and sub-categories
  // ------------------------------------------------------------------
  getCategories() {
    return this.get('getcategory')
  }

  addCategory(payload: unknown) {
    return this.post('addcategory', payload)
  }

  updateCategory(payload: unknown) {
    return this.post('updatecategory', payload)
  }

  deleteCategory(id: number | string) {
    return this.post('deletecategory', { id })
  }

  getSubCategories() {
    return this.get('getsubcategory')
  }

  addSubCategory(payload: unknown) {
    return this.post('addsubcategory', payload)
  }

  updateSubCategory(payload: unknown) {
    return this.post('updatesubcategory', payload)
  }

  deleteSubCategory(id: number | string) {
    return this.post('deletesubcategory', { id })
  }
  // ------------------------------------------------------------------
  // Main Filters
  // ------------------------------------------------------------------
  getMainFilters() {
    return this.get('getmainfilter')
  }

  addMainFilter(payload: unknown) {
    return this.post('addmainfilter', payload)
  }

  updateMainFilter(payload: unknown) {
    return this.post('updatemainfilter', payload)
  }

deleteMainFilter(id: number | string) {
  return this.del(`deletemainfilter/${id}`)
}
  // ------------------------------------------------------------------
  // Vendors
  // ------------------------------------------------------------------
getVendors() {
  return this.get('getvendors')
}

addVendor(payload: FormData) {
  return this.http.post<ApiResponse<any>>(
    API_CONFIG.baseUrl + 'addvendor',
    payload
  )
}

updateVendor(payload: FormData) {
  return this.http.post<ApiResponse<any>>(
    API_CONFIG.baseUrl + 'updatevendor',
    payload
  )
}


  deleteVendor(id: number | string) {
    return this.post('deletevendor', { id })
  }

  updateVendorActiveStatus(payload: unknown) {
    return this.post('updatevendoractivestatus', payload)
  }

  updateVendorLoginStatus(payload: unknown) {
    return this.post('updatevendorloginstatus', payload)
  }

  // ------------------------------------------------------------------
  // Products
  // ------------------------------------------------------------------
  getProducts() {
    return this.get('getproducts')
  }

  addProduct(payload: unknown) {
    return this.post('addproduct', payload)
  }

  updateProduct(payload: unknown) {
    return this.post('updateproduct', payload)
  }

  deleteProduct(id: number | string) {
    return this.post('deleteproduct', { id })
  }

  updateProductActiveStatus(payload: unknown) {
    return this.post('updateproductactivestatus', payload)
  }

  // ------------------------------------------------------------------
  // Shop items
  // ------------------------------------------------------------------
  getShopItems() {
    return this.get('getshopitems')
  }
addShopItem(payload: FormData | unknown) {
  return this.http.post<ApiResponse<any>>(
    API_CONFIG.baseUrl + 'addshopitem',
    payload
  )
}

updateShopItem(payload: FormData | unknown) {
  return this.http.post<ApiResponse<any>>(
    API_CONFIG.baseUrl + 'updateshopitem',
    payload
  )
}

  /** deleteshopitem is a hard DELETE and takes a single id, not a list. */
  deleteShopItem(id: number | string) {
    return this.post('deleteshopitem', { id })
  }

  /** This endpoint names the flag 'value', unlike the other status APIs. */
  updateShopItemActiveStatus(payload: unknown) {
    return this.post('updateshopitemactivestatus', payload)
  }

  // ------------------------------------------------------------------
  // Product assignment
  // ------------------------------------------------------------------
  /**
   * Writes rows into product_assignments. The matching read endpoint
   * (getproductassignment) is not wired up: its query selects si.category_id,
   * a column shopitems does not have, so it fails. The item list comes from
   * getShopItems instead, which is what the first admin does.
   */
  submitProductAssignment(payload: unknown) {
    return this.post('submitproductassignment', payload)
  }
getProductAssignment(payload: {
  category_id: number
  shop_id: number
}) {
  return this.post('getproductassignment', payload)
}
  // ------------------------------------------------------------------
  // Payments
  // ------------------------------------------------------------------
  /**
   * Vendor payment totals. Accepts location_id, category_id and a
   * from_date/to_date pair; the date filter applies only when both are sent.
   * Payments and Payment History share this one endpoint.
   */
  getPayments(payload: unknown = {}) {
    return this.post('getpayments', payload)
  }
getDeliveryBoyPayments(payload: unknown = {}) {
  return this.post('getdeliveryboypayments', payload);
}
getDeliveryBoyPaymentHistory(payload: unknown = {}) {
  return this.post('getdeliveryboypaymenthistory', payload);
}
  /**
   * COD settlements for the tenant's delivery partners. Read-only: the
   * backend offers no settle or payout action for these rows.
   */
  getCodSettlements() {
    return this.get('getcodsettlements')
  }
payCodSettlement(settlementId: number) {

  return this.post('paycodsettlement', {
    settlement_id: settlementId,
  })

}
  // ------------------------------------------------------------------
  // Website Management
  // Content for the tenant's public website. Every row is tenant-scoped by
  // the backend from the JWT and soft-deleted with d_in.
  // ------------------------------------------------------------------
  getWebsiteBanners() {
    return this.get('getwebsitebanners')
  }

  saveWebsiteBanner(payload: unknown) {
    return this.post('savewebsitebanner', payload)
  }

  updateWebsiteBanner(id: number | string, payload: unknown) {
    return this.put(`updatewebsitebanner/${id}`, payload)
  }

  deleteWebsiteBanner(id: number | string) {
    return this.del(`deletewebsitebanner/${id}`)
  }

  getWebsiteHomeSections() {
    return this.get('getwebsitehomesections')
  }

  saveWebsiteHomeSection(payload: unknown) {
    return this.post('savewebsitehomesection', payload)
  }

  updateWebsiteHomeSection(id: number | string, payload: unknown) {
    return this.put(`updatewebsitehomesection/${id}`, payload)
  }

  deleteWebsiteHomeSection(id: number | string) {
    return this.del(`deletewebsitehomesection/${id}`)
  }

  getWebsitePromoSections() {
    return this.get('getwebsitepromosections')
  }

  saveWebsitePromoSection(payload: unknown) {
    return this.post('savewebsitepromosection', payload)
  }

  updateWebsitePromoSection(id: number | string, payload: unknown) {
    return this.put(`updatewebsitepromosection/${id}`, payload)
  }

  deleteWebsitePromoSection(id: number | string) {
    return this.del(`deletewebsitepromosection/${id}`)
  }

  getWebsiteTestimonials() {
    return this.get('getwebsitetestimonials')
  }

  saveWebsiteTestimonial(payload: unknown) {
    return this.post('savewebsitetestimonial', payload)
  }

  updateWebsiteTestimonial(id: number | string, payload: unknown) {
    return this.put(`updatewebsitetestimonial/${id}`, payload)
  }

  deleteWebsiteTestimonial(id: number | string) {
    return this.del(`deletewebsitetestimonial/${id}`)
  }

  getWebsiteFooterSettings() {
    return this.get('getwebsitefootersettings')
  }

  updateWebsiteFooterSettings(payload: unknown) {
    return this.post('updatewebsitefootersettings', payload)
  }
getWebsiteThemeSettings() {
  return this.get('getwebsitethemesettings')
}

updateWebsiteThemeSettings(payload: unknown) {
  return this.post('updatewebsitethemesettings', payload)
}
  // ------------------------------------------------------------------
  // Orders
  // ------------------------------------------------------------------
  getOrders(payload: unknown = {}) {
    return this.post('getorders', payload)
  }

  getOrderDetails(order_id: number | string) {
    return this.post('getorderdetails', { order_id })
  }

  updateOrderStatus(payload: unknown) {
    return this.post('updateorderstatus', payload)
  }

  // ------------------------------------------------------------------
  // Customers
  // ------------------------------------------------------------------
  getCustomers() {
    return this.get('getcustomers')
  }

  getCustomerDetails(customer_id: number | string) {
    return this.post('getcustomerdetails', { customer_id })
  }

  updateCustomerActiveStatus(payload: unknown) {
    return this.post('updatecustomeractivestatus', payload)
  }

  // ------------------------------------------------------------------
  // Delivery partners and slots
  // ------------------------------------------------------------------
  getDeliveryPartners() {
    return this.get('getdeliverypartners')
  }

  addDeliveryPartner(payload: unknown) {
    return this.post('adddeliverypartner', payload)
  }

  updateDeliveryPartner(payload: unknown) {
    return this.post('updatedeliverypartner', payload)
  }

  deleteDeliveryPartner(id: number | string) {
    return this.post('deletedeliverypartner', { id })
  }

  updateDeliveryPartnerActiveStatus(payload: unknown) {
    return this.post('updatedeliverypartneractivestatus', payload)
  }

  updateDeliveryPartnerLoginStatus(payload: unknown) {
    return this.post('updatedeliverypartnerloginstatus', payload)
  }

  // ------------------------------------------------------------------
  // Marketing: banners, coupons, notifications
  // ------------------------------------------------------------------
  getBanners() {
    return this.get('getbanners')
  }

  addBanner(payload: unknown) {
    return this.post('addbanner', payload)
  }

  updateBanner(payload: unknown) {
    return this.post('updatebanner', payload)
  }

  deleteBanner(id: number | string) {
    return this.post('deletebanner', { id })
  }

  getCoupons() {
    return this.get('getcoupons')
  }

  addCoupon(payload: unknown) {
    return this.post('addcoupon', payload)
  }

  updateCoupon(payload: unknown) {
    return this.post('updatecoupon', payload)
  }

  deleteCoupon(id: number | string) {
    return this.post('deletecoupon', { id })
  }

getNotifications() {
  return this.get('getnotifications')
}

addNotification(payload: unknown) {
  return this.post('addnotification', payload)
}

updateNotification(payload: unknown) {
  return this.post('updatenotification', payload)
}

deleteNotification(id: number | string) {
  return this.post('deletenotification', { id })
}


  // ------------------------------------------------------------------
  // Settlements
  // ------------------------------------------------------------------
getVendorSettlements(payload: unknown = {}) {
  return this.get('getvendorsettlements')
}

  createVendorSettlement(payload: unknown) {
    return this.post('createvendorsettlement', payload)
  }

  submitVendorPayout(payload: unknown) {
    return this.post('submitvendorpayout', payload)
  }

  // ------------------------------------------------------------------
  // Settings: tenant, charges, payment gateway
  // ------------------------------------------------------------------
  getTenantSettings() {
    return this.get('gettenantsettings')
  }

  updateTenantSettings(payload: unknown) {
    return this.post('updatetenantsettings', payload)
  }

  getCharges() {
    return this.get('getcharges')
  }

  addCharges(payload: unknown) {
    return this.post('addcharges', payload)
  }

  updateCharges(payload: unknown) {
    return this.post('updatecharges', payload)
  }

  getPaymentGateway() {
    return this.get('getpaymentgateway')
  }

  /** The tenant's own cash-on-delivery switch. */
  updatePaymentModes(payload: { cod_enabled: number }) {
    return this.post('updatepaymentmodes', payload)
  }

  updatePaymentGateway(payload: unknown) {
    return this.post('updatepaymentgateway', payload)
  }

  // ------------------------------------------------------------------
  // Dev support
  // ------------------------------------------------------------------
  getDevSupport() {
    return this.get('getdevsupport')
  }

  addDevSupport(payload: unknown) {
    return this.post('adddevsupport', payload)
  }

  updateDevStatus(payload: unknown) {
    return this.post('updatedevstatus', payload)
  }

  updateAdminStatus(payload: unknown) {
    return this.post('updateadminstatus', payload)
  }

  updateTicketType(payload: unknown) {
    return this.post('updatetickettype', payload)
  }

  updateTicketRemarks(payload: unknown) {
    return this.post('updateticketremarks', payload)
  }
}
