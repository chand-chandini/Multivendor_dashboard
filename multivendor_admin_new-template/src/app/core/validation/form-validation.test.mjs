// Run: node --test src/app/core/validation/form-validation.test.mjs
// Real Angular forms and actual component methods; APIs, template dependencies
// and FileReader are stubbed. This does not claim browser/live-backend coverage.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import '@angular/compiler'
import * as core from '@angular/core'
import * as forms from '@angular/forms'
import * as common from '@angular/common'

const directory = new URL('../../views/multivendor/', import.meta.url)
const ruleRegistry = new WeakMap()
function evaluate(source, dependencies, extra = {}) {
  const { outputText } = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022, experimentalDecorators: true },
  })
  const exports = {}
  new Function('require', 'exports', ...Object.keys(extra), outputText)((name) => {
    assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
    return dependencies[name]
  }, exports, ...Object.values(extra))
  return exports
}
const validation = evaluate(readFileSync(new URL('./form-validation.ts', import.meta.url), 'utf8'), { '@angular/forms': forms })
class MultivendorService {}
class NotifyService {}
class PermissionService {}
class AuthService {}
class NgbModal {}
class PreviewReader {
  readAsDataURL() {
    this.result = 'data:image/png;base64,aW1hZ2U='
    this.onload?.()
  }
}
const dependencies = {
  '@angular/core': core, '@angular/forms': forms, '@angular/common': common,
  '@core/validation/form-validation': {
    ...validation,
    withValidation(form, rules) { ruleRegistry.set(form, rules); return validation.withValidation(form, rules) },
  },
  '@app/components/data-table/data-table': { DataTable: class {} },
  '@app/components/page-breadcrumb/page-breadcrumb': { PageBreadcrumb: class {} },
  '@app/components/icon/icon': { Icon: class {} },
  '@/app/config/api.config': { API_CONFIG: { baseUrl: 'https://example.test/dashboard_api/' } },
  '@core/services/multivendor.service': { MultivendorService },
  '@core/services/notify.service': { NotifyService },
  '@core/services/permission.service': { PermissionService },
  '@core/services/auth.service': { AuthService },
  '@ng-bootstrap/ng-bootstrap': { NgbModal, NgbNavModule: class {} },
}
const cache = new Map()
function componentType(module) {
  const file = module === 'legacy-notifications'
    ? new URL('../../views/apps/ecommerce/settings/components/notifications/notifications.ts', import.meta.url)
    : new URL(`${module}/${module}.ts`, directory)
  if (!cache.has(module)) {
    const source = readFileSync(file, 'utf8')
    const exports = evaluate(source, dependencies, { FileReader: PreviewReader, window: { location: { origin: 'https://example.test' } } })
    cache.set(module, { source, type: Object.values(exports).find((value) => typeof value === 'function'), template: readFileSync(new URL(file.href.replace(/\.ts$/, '.html')), 'utf8') })
  }
  return cache.get(module)
}
const base = {
  id: 17, name: 'Sample name', number: '9876543210', mobile_number: '9876543210',
  email: 'admin@example.com', pwd: 'password123', designation: 'Manager', address: '1 Main Road',
  city: 'City', latitude: '16.9', longitude: '81.7', max_delivery_service_km: 10,
  category_name: 'Groceries', parent_id: 1, filter_name: 'Veg',
  category_image: 'uploads/category.png', location_image: 'uploads/location.png',
  aadhar_image: 'uploads/aadhar.png', pan_image: 'uploads/pan.png',
  bank_details_image: 'uploads/bank.png', driving_license_image: 'uploads/license.png',
  aadhar_number: '234567890123', pan_number: 'ABCDE1234F', driving_license_number: 'AP0120200000001',
  bank_account_number: '00123456789', bank_ifsc_code: 'SBIN0001234', cod_limit: 0,
  vendor_id: 1, product_id: 1, category_id: 1, location_id: 1, shop_id: 1,
  product_name: 'Sample product', product_code: 'P001', description: 'Sample description',
  base_price: 100, discount_price: 90, stock_quantity: 1, is_veg: 0, is_returnable: 0, is_featured: 0,
  link_type: 'vendor', external_url: 'https://example.com', banner_order: 0, is_active: 0,
  shop_image: 'uploads/shop.png', banner_image: 'uploads/banner.png', image: 'https://example.com/image.png',
  tenant_name: 'Sample tenant', website_title: 'Website', tagline: 'Tagline',
  support_email: 'support@example.com', support_phone: '9876543210',
  logo_light: 'uploads/logo.png', favicon: 'uploads/favicon.png',
  handling_charge: 0, packing_charge: 0, donation_charge: 0, rain_surge_charge: 0, rain_surge_active: 0,
  coupon_code: 'SAVE10', discount_type: 'percentage', discount_value: 10, max_discount_amount: 20,
  min_order_value: 0, usage_limit_per_user: 1, total_usage_limit: null,
  valid_from: '2026-01-01T09:00', valid_upto: '2026-12-31T22:00',
  slot_label: 'Morning', start_time: '09:00', end_time: '11:00', slot_type: 'delivery', max_orders: 1,
  subject: 'Sample subject', application: 2, ticket_type: 1, remarks: 'Sample remarks',
  about_text: 'About the shop', contact_email: 'contact@example.com', contact_phone: '9876543210',
  contact_address: '1 Main Road', copyright_text: 'Copyright',
  facebook_url: 'https://example.com', instagram_url: 'https://example.com', twitter_url: 'https://example.com',
  youtube_url: 'https://example.com', linkedin_url: 'https://example.com', playstore_url: 'https://example.com', appstore_url: 'https://example.com',
  section_key: 'hero', heading: 'Heading', subheading: 'Subheading', display_order: 0, status: 0,
  new_password: 'password123', confirm_password: 'password123', title: 'Title', message: 'Message',
  phone_address: '9876543210 / 1 Main Road', subtitle: 'Subtitle', link_url: 'https://example.com',
  gateway_name: 'razorpay', api_key: 'key', api_secret: 'secret', webhook_secret: 'webhook',
  period_start: '2026-01-01', period_end: '2026-01-31', total_orders: 1, gross_sales: 100,
  commission_amount: 20, net_payable: 80, payout_amount: 80, payout_method: 'bank_transfer',
  transaction_reference: 'TX001', payout_proof: 'https://example.com/proof.png',
  item: 'Sample item', subcategory: 'Groceries', filter: 'Veg', measurement: '500 g',
  actual_price: 100, selling_price: 90, available_time: '07:00 AM - 08:00 PM', discount_percentage: 10, discount_amount: 10,
  customer_name: 'Customer', rating: 5, primary_color: '#01003c', secondary_color: '#6c757d',
  header_color: '#ffffff', button_color: '#01003c', font_family: 'Arial, sans-serif', custom_css: '',
}
const uploadHandlers = {
  banners: { banner_image: ['onImageSelected'] },
  'brand-settings': { logo_light: ['onLogoSelected'], favicon: ['onFaviconSelected'] },
  categories: { category_image: ['onImageSelected'] },
  'delivery-partners': Object.fromEntries(['aadhar_image','pan_image','driving_license_image','bank_details_image'].map((field) => [field, ['onImageSelected', field]])),
  'dev-support': { image: ['onImageSelected'] },
  'home-page': { image: ['onHomeImageSelected'] }, locations: { location_image: ['onImageSelected'] },
  'shop-items': { shop_image: ['onShopImageSelected'] },
  'website-banners': { banner_image: ['onBannerImageSelected'] },
}
const cases = [
  ...['banners','coupons','delivery-partners','home-page','locations','master-data','notifications','products','promotional-sections','shop-items','testimonials','website-banners','legacy-notifications','permissions'].map((module) => ({ module, operations: ['add','edit'] })),
  ...['category','subcategory','mainfilter'].map((variant) => ({ module: 'categories', variant, operations: ['add','edit'] })),
  ...[false,true].map((variant) => ({ module: 'charges', variant, operations: ['add','edit'] })),
  ...['brand-settings','footer-settings','website-theme-settings'].map((module) => ({ module, operations: ['update'] })),
  { module: 'my-profile', formName: 'passwordForm', handler: 'changePassword', operations: ['update'] },
  { module: 'settings', formName: 'gatewayForm', handler: 'saveGateway', operations: ['update'] },
  { module: 'product-assignment', operations: ['assign'] },
  { module: 'dev-support', operations: ['add'] },
  { module: 'dev-support', formName: 'remarksForm', handler: 'saveRemarks', operations: ['update'] },
  { module: 'settlements', formName: 'settlementForm', handler: 'submitSettlement', operations: ['add'] },
  { module: 'settlements', formName: 'payoutForm', handler: 'submitPayout', operations: ['payout'] },
]
const expectedRequests = {
  banners: ['addBanner','updateBanner'], coupons: ['addCoupon','updateCoupon'],
  'delivery-partners': ['addDeliveryPartner','updateDeliveryPartner'],
  'home-page': ['saveWebsiteHomeSection','updateWebsiteHomeSection'], locations: ['addLocation','updateLocation'],
  'master-data': ['addProduct','updateProduct'], products: ['addProduct','updateProduct'],
  notifications: ['addNotification','updateNotification'], 'legacy-notifications': ['addNotification','updateNotification'],
  'promotional-sections': ['saveWebsitePromoSection','updateWebsitePromoSection'], 'shop-items': ['addShopItem','updateShopItem'],
  testimonials: ['saveWebsiteTestimonial','updateWebsiteTestimonial'], 'website-banners': ['saveWebsiteBanner','updateWebsiteBanner'],
  permissions: ['addAdminUser','saveUserModules'], charges: ['addCharges','updateCharges'],
  'brand-settings': ['updateTenantSettings'], 'footer-settings': ['updateWebsiteFooterSettings'],
  'website-theme-settings': ['updateWebsiteThemeSettings'], 'my-profile': ['updateUserPassword'],
  settings: ['updatePaymentGateway'], 'product-assignment': ['submitProductAssignment'],
}
async function upload(c, module, field, file = new File(['image'], 'image.png', { type: 'image/png' })) {
  const handler = uploadHandlers[module]?.[field]
  assert.ok(handler, `${module}: no upload handler for ${field}`)
  await c[handler[0]]({ target: { files: [file], value: '' } }, ...handler.slice(1))
  await Promise.resolve()
}
async function setup(t, spec, operation, missingField) {
  const requests = []
  const row = { ...base, ...(missingField ? { [missingField]: null } : {}) }
  if (spec.module === 'categories' && missingField === 'parent_id') row.category_id = null
  if (spec.module === 'legacy-notifications' && missingField === 'description') row.message = null
  const noopObservable = { subscribe() {} }
  const api = new Proxy({}, { get: (object, name) => {
    if (name in object) return object[name]
    return (...args) => {
      if (!/^(get|load)/.test(name)) requests.push({ method: name, args })
      return noopObservable
    }
  } })
  const injector = core.createEnvironmentInjector([
    { provide: forms.FormBuilder, useValue: new forms.FormBuilder() },
    { provide: MultivendorService, useValue: api },
    { provide: NotifyService, useValue: { success() {}, error() {} } },
    { provide: PermissionService, useValue: { canEdit: () => true, canAdd: () => true } },
    { provide: AuthService, useValue: { userId: () => 1, user: () => null, permissions: () => [], userName: () => 'Admin', adminType: () => 'Admin' } },
    { provide: NgbModal, useValue: { open() {}, dismissAll() {} } },
  ])
  t.after(() => injector.destroy())
  const { type, source } = componentType(spec.module)
  const c = core.runInInjectionContext(injector, () => new type())
  for (const match of source.matchAll(/readonly\s+(\w+)\s*=\s*viewChild.required/g)) c[match[1]] = () => ({})
  for (const [field, value] of Object.entries({
    locations: [{ id: 1 }], vendors: [{ id: 1 }], shops: [{ id: 1 }], products: [{ id: 1 }],
    categories: [{ id: 1, category_name: 'Groceries' }], subcategories: [{ id: 1, category_name: 'Groceries' }],
    subCategories: [{ id: 1, category_name: 'Groceries' }], filters: [{ id: 1, filter_name: 'Veg' }],
  })) if (c[field]?.set) c[field].set(value)
  if (operation === 'edit') c.openEdit(row, spec.variant)
  else if (spec.formName === 'remarksForm') c.openRemarks(row)
  else if (spec.formName === 'payoutForm') c.openPayout(row)
  else if (operation === 'add') c.openAdd(spec.variant)
  const form = c[spec.formName ?? 'form']
  const rules = ruleRegistry.get(form)
  assert.ok(rules, `${spec.module}: missing rules`)
  if (operation !== 'edit') {
    const values = Object.fromEntries(Object.keys(form.controls).filter((field) => field in row).map((field) => [field,row[field]]))
    form.patchValue(values)
    for (const [field, rule] of Object.entries(rules)) {
      if (rule.type === 'image' && (!rule.when || rule.when()) && field !== missingField) await upload(c, spec.module, field)
    }
  }
  if (spec.module === 'permissions') {
    c.groups.set([{ module_id: 1, module_nm: 'Module', rows: [{ id: 1, module_id: 1, selected: true, can_view: true, can_add: false, can_edit: false, can_delete: false }] }])
    c.modulesLoading.set(false)
  }
  if (spec.module === 'product-assignment') { c.items.set([{ id: 1 }]); c.selectedIds.set(new Set([1])); c.productsLoaded.set(true) }
  if (spec.formName === 'payoutForm' && missingField) form.controls[missingField].setValue(null)
  return { c, form, rules, requests, api, row, submit: () => c[spec.handler ?? 'submit']() }
}
for (const spec of cases) for (const operation of spec.operations) {
  const label = `${spec.module}/${spec.formName ?? spec.variant ?? 'form'}/${operation}`
  test(`${label}: valid values call the existing API`, async (t) => {
    const h = await setup(t, spec, operation)
    assert.ok(validation.validateForm(h.form), JSON.stringify(Object.fromEntries(Object.entries(h.form.controls).filter(([,c]) => c.errors).map(([k,c]) => [k,c.errors]))))
    h.submit()
    assert.equal(h.requests.length, 1)
    let expected = expectedRequests[spec.module]?.[operation === 'edit' ? 1 : 0]
    if (spec.module === 'categories') expected = `${operation === 'edit' ? 'update' : 'add'}${{category:'Category',subcategory:'SubCategory',mainfilter:'MainFilter'}[spec.variant]}`
    if (spec.module === 'dev-support') expected = spec.formName === 'remarksForm' ? 'updateTicketRemarks' : 'addDevSupport'
    if (spec.module === 'settlements') expected = spec.formName === 'payoutForm' ? 'submitVendorPayout' : 'createVendorSettlement'
    assert.equal(h.requests[0].method, expected)
  })
  test(`${label}: each required field is individually blocked and has a message`, async (t) => {
    const baseline = await setup(t,spec,operation)
    const required = Object.entries(baseline.rules).filter(([field,rule]) =>
      rule.required !== false && !rule.allowEmptyChoice && (!rule.when || rule.when()) && baseline.form.controls[field].enabled)
    assert.ok(required.length)
    for (const [field] of required) {
      const h = await setup(t,spec,operation,field)
      h.submit()
      assert.equal(h.requests.length,0,`${field}: request was made`)
      assert.ok(h.form.controls[field].invalid, `${field}: not invalid`)
      assert.ok(validation.fieldError(h.form,field,field),`${field}: no message`)
    }
  })
  test(`${label}: empty form is blocked`, async (t) => {
    const h = await setup(t,spec,operation)
    validation.resetValidation(h.form)
    h.form.reset(Object.fromEntries(Object.keys(h.form.controls).map((field) => [field,null])))
    h.submit()
    assert.equal(h.requests.length,0)
    assert.ok(h.form.invalid)
  })
  test(`${label}: invalid values are blocked; correcting them permits submission`, async (t) => {
    const h = await setup(t,spec,operation)
    for (const [field,rule] of Object.entries(h.rules)) {
      const control = h.form.controls[field]
      if (control.disabled || (rule.when && !rule.when())) continue
      if (rule.type === 'image') {
        for (const file of [new File(['text'],'file.txt',{type:'text/plain'}),new File([],'empty.png',{type:'image/png'})]) {
          await upload(h.c,spec.module,field,file)
          h.submit()
          assert.equal(h.requests.length,0,`${field}: invalid upload submitted`)
          assert.ok(validation.fieldError(h.form,field,field),`${field}: upload message`)
        }
        await upload(h.c,spec.module,field)
        continue
      }
      const old = control.value
      const invalid = rule.type === 'email' ? 'bad@' : rule.type === 'phone' ? '123' : rule.type === 'url' ? 'javascript:alert(1)' :
        ['number','integer'].includes(rule.type) ? 'abc' : rule.type === 'date' ? '2026-02-30' : rule.type === 'datetime' ? '2026-02-30T09:00' :
        rule.type === 'time' ? '25:99' : rule.type === 'color' ? '#oops' : rule.choices ? 'unknown-selection' : rule.pattern ? '?' :
        rule.equalsField ? 'different-password' : rule.required === false ? null : '   '
      if (invalid == null) continue
      control.setValue(invalid)
      h.submit()
      assert.equal(h.requests.length,0,`${field}: invalid value submitted`)
      assert.ok(control.invalid,`${field}: not invalid`)
      assert.ok(validation.fieldError(h.form,field,field),`${field}: no error message`)
      control.setValue(old)
    }
    assert.ok(validation.validateForm(h.form),'Correction did not restore validity')
    h.submit()
    assert.equal(h.requests.length,1)
  })
  test(`${label}: every configured field has a nearby template message`, () => {
    const { template } = componentType(spec.module)
    assert.ok(template.includes('fieldError('))
    for (const field of [...template.matchAll(/formControlName="([^"]+)"/g)].map((m) => m[1])) {
      if (field === 'phone_address') continue // Read-only derived data.
      assert.ok(template.includes(`'${field}',`),`${field}: missing message`)
    }
  })
}

test('Banner destinations are conditional and No link remains valid', async (t) => {
  const h = await setup(t,cases.find((s) => s.module==='banners'),'add')
  for (const [type,field,bad,good] of [
    ['vendor','vendor_id',999,1],['product','product_id',999,1],['external','external_url','bad-url','https://example.com'],
  ]) {
    h.form.controls.link_type.setValue(type)
    h.form.controls[field].setValue(bad)
    assert.equal(validation.validateForm(h.form),false)
    h.form.controls[field].setValue(good)
    assert.equal(validation.validateForm(h.form),true)
  }
  h.form.patchValue({link_type:'',vendor_id:null,product_id:null,external_url:''})
  assert.equal(validation.validateForm(h.form),true)
})
test('Coupon fixed discounts do not require a cap; null usage remains Unlimited', async (t) => {
  const h=await setup(t,cases.find((s)=>s.module==='coupons'),'add')
  h.form.patchValue({discount_type:'fixed',discount_value:150,max_discount_amount:null,total_usage_limit:null})
  assert.equal(validation.validateForm(h.form),true)
  h.form.patchValue({discount_type:'percentage',discount_value:101})
  assert.equal(validation.validateForm(h.form),false)
  h.form.patchValue({discount_value:10,max_discount_amount:20,valid_upto:'2025-12-31T09:00'})
  assert.equal(validation.validateForm(h.form),false)
})
test('Admin module selection is required without requiring every permission flag',async(t)=>{
  const spec=cases.find((s)=>s.module==='permissions')
  for(const operation of ['add','edit']) {
    const h=await setup(t,spec,operation)
    h.c.groups.set([]);h.submit();assert.equal(h.requests.length,0)
    assert.match(h.c.moduleSelectionError(),/at least one module/)
    h.c.groups.set([{rows:[{id:1,module_id:1,selected:true,can_view:true,can_add:false,can_edit:false,can_delete:false}]}])
    assert.equal(h.c.moduleSelectionError(),'');h.submit();assert.equal(h.requests.length,1)
  }
})
test('Empty optional Admin Edit password is valid; whitespace is invalid',async(t)=>{
  const h=await setup(t,cases.find((s)=>s.module==='permissions'),'edit')
  assert.equal(h.form.controls.pwd.value,'');assert.equal(validation.validateForm(h.form),true)
  h.form.controls.pwd.setValue('   ');assert.equal(validation.validateForm(h.form),false)
})
test('Disabling online payment does not demand unrelated new credentials',async(t)=>{
  const h=await setup(t,cases.find((s)=>s.module==='settings'),'update')
  h.form.patchValue({api_key:'',api_secret:'',webhook_secret:'',is_active:0})
  h.c.saveGateway({target:{checked:false}})
  assert.equal(h.requests.length,1)
  assert.equal(h.requests[0].method,'updatePaymentGateway')
})
test('Async image reads block submission; failure and replacement errors persist until corrected',()=>{
  const form=validation.withValidation(new forms.FormBuilder().group({image:['uploads/old.png']}),{image:{type:'image'}})
  const control=form.controls.image
  const file=new File(['image'],'image.png',{type:'image/png'})
  assert.equal(validation.beginImageRead(control,file),true)
  assert.equal(validation.validateForm(form),false)
  validation.failImageRead(control,file)
  assert.match(validation.fieldError(form,'image','Image'),/Could not read/)
  validation.beginImageRead(control,file)
  validation.completeImageRead(control,'data:image/png;base64,aW1hZ2U=',file)
  assert.equal(validation.validateForm(form),true)
  validation.checkImageFile(control,new File(['text'],'file.txt',{type:'text/plain'}))
  assert.equal(validation.validateForm(form),false)
  validation.resetValidation(form);form.reset({image:'uploads/old.png'})
  validation.completeImageRead(control,'stale',file)
  assert.equal(control.value,'uploads/old.png')
})
test('Configured numeric/date ranges, comparisons and file-size limits are enforced',()=>{
  const form=validation.withValidation(new forms.FormBuilder().group({quantity:[1],price:[100],discount:[90],percent:[10],date:['2026-01-01'],image:[null]}),{
    quantity:{type:'integer',min:0},price:{type:'number',min:0},discount:{type:'number',min:0,maxField:'price'},
    percent:{type:'number',min:0,max:100},date:{type:'date'},image:{type:'image',maxBytes:4},
  })
  const file=new File(['image'],'image.png',{type:'image/png'})
  assert.equal(validation.checkImageFile(form.controls.image,file,'image/*',4),false)
  assert.equal(validation.validateForm(form),false)
  validation.resetValidation(form);form.controls.image.setValue(new File(['x'],'image.png',{type:'image/png'}))
  assert.equal(validation.validateForm(form),true)
  for(const [field,value] of [['quantity',1.5],['quantity',-1],['price',Infinity],['discount',101],['percent',101],['date','2026-02-30'],['date','0000-01-01']]) {
    const old=form.controls[field].value;form.controls[field].setValue(value)
    assert.equal(validation.validateForm(form),false,`${field}=${value}`)
    form.controls[field].setValue(old)
  }
})


test('Saved settings load correctly and missing editable values stay invalid', async (t) => {
  for (const module of ['brand-settings','footer-settings','website-theme-settings','settings']) {
    const h=await setup(t,cases.find((s)=>s.module===module),'update')
    const emit=(data)=>({subscribe(observer){observer.next({status:200,data})}})
    let data={...base}
    if(module==='brand-settings') {
      h.api.getTenantSettings=()=>emit({settings:data,branding:data})
      h.c.load();assert.equal(h.form.controls.tenant_name.value,base.tenant_name)
      data={...base,support_email:null};h.c.load()
      assert.equal(validation.validateForm(h.form),false)
    } else if(module==='footer-settings') {
      h.api.getWebsiteFooterSettings=()=>emit(data)
      h.c.load();assert.equal(h.form.controls.contact_email.value,base.contact_email)
      data={...base,contact_email:null};h.c.load()
      assert.equal(validation.validateForm(h.form),false)
    } else if(module==='website-theme-settings') {
      h.api.getWebsiteThemeSettings=()=>emit(data)
      h.c.load();assert.equal(h.form.controls.primary_color.value,base.primary_color)
      data={...base,primary_color:null};h.c.load()
      assert.equal(validation.validateForm(h.form),false)
    } else {
      h.api.getPaymentGateway=()=>emit([data])
      h.c.loadGateway();assert.equal(h.form.controls.is_active.value,0)
      data={...base,is_active:null,gateway_name:null};h.c.loadGateway()
      assert.equal(h.form.controls.is_active.value,null)
      assert.equal(validation.validateForm(h.form),false)
    }
  }
})
test('Saved database date/time strings populate native inputs without losing their values',async(t)=>{
  for(const module of ['coupons']) {
    const h=await setup(t,cases.find((s)=>s.module===module),'edit')
    h.c.openEdit({...base,valid_from:'2026-01-01 09:00:00',valid_upto:'2026-12-31T22:00:00.000Z',start_time:'09:00:00',end_time:'11:00:00'})
    assert.equal(validation.validateForm(h.form),true)
    assert.equal(h.form.controls.valid_from.value,'2026-01-01T09:00')
  }
})
test('Read-only product vendor and assignment details are not newly required',async(t)=>{
  for(const module of ['products','master-data']) {
    const h=await setup(t,cases.find((s)=>s.module===module),'edit','vendor_id')
    assert.equal(h.form.controls.vendor_id.disabled,true)
    assert.equal(validation.validateForm(h.form),true)
  }
  const h=await setup(t,cases.find((s)=>s.module==='product-assignment'),'assign','phone_address')
  assert.equal(validation.validateForm(h.form),true)
  h.c.selectedIds.set(new Set());h.submit();assert.equal(h.requests.length,0)
})
test('Actual async upload handlers retain read failures as field errors',async(t)=>{
  for(const module of ['brand-settings','home-page','website-banners']) {
    const spec=cases.find((s)=>s.module===module),operation=spec.operations[0]
    const h=await setup(t,spec,operation)
    h.c.fileToBase64=()=>Promise.reject(new Error('Test read failure'))
    const field=Object.keys(uploadHandlers[module])[0]
    const oldError=console.error;console.error=()=>{}
    try {await upload(h.c,module,field)} finally {console.error=oldError}
    assert.equal(validation.validateForm(h.form),false)
    assert.ok(h.form.controls[field].hasError('fileRead'))
    h.submit();assert.equal(h.requests.length,0)
  }
})
test('Edit-to-Add resets password requirements and clears saved upload state',async(t)=>{
  for(const module of ['delivery-partners','permissions']) {
    const h=await setup(t,cases.find((s)=>s.module===module),'edit')
    assert.equal(h.form.controls.pwd.value,'')
    assert.equal(validation.validateForm(h.form),true)
    h.c.openAdd();h.form.patchValue({...base,pwd:''})
    assert.equal(validation.validateForm(h.form),false)
    assert.ok(h.form.controls.pwd.hasError('required'))
    assert.ok(h.form.touched)
  }
})
test('Active sign-in blocks empty, invalid mobile and whitespace password without changing login payload', (t)=>{
  class Router{};class ActivatedRoute{};class BrandingService{}
  const source=readFileSync(new URL('../../views/auth/sign-in/sign-in.ts',import.meta.url),'utf8')
  const {SignIn}=evaluate(source,{...dependencies,
    '@/app/constants':{currentYear:2026,META_DATA:{author:'Test'}},
    '@angular/router':{Router,ActivatedRoute,RouterLink:class{}},
    '@core/services/branding.service':{BrandingService},
  })
  const calls=[]
  const injector=core.createEnvironmentInjector([
    {provide:forms.FormBuilder,useValue:new forms.FormBuilder()},
    {provide:MultivendorService,useValue:{}},
    {provide:AuthService,useValue:{login:(...args)=>{calls.push(args);return{subscribe(){}}}}},
    {provide:Router,useValue:{}},{provide:ActivatedRoute,useValue:{}},{provide:BrandingService,useValue:{}},
  ])
  t.after(()=>injector.destroy())
  const c=core.runInInjectionContext(injector,()=>new SignIn())
  c.onSubmit();assert.equal(calls.length,0)
  c.form.patchValue({mobile:'123',password:'password'});c.onSubmit();assert.equal(calls.length,0)
  c.form.patchValue({mobile:'9876543210',password:'   '});c.onSubmit();assert.equal(calls.length,0)
  c.form.controls.password.setValue('password');c.onSubmit()
  assert.deepEqual(calls,[['9876543210','password']])
})

for (const operation of ['add', 'edit']) {
  test('delivery-partners/' + operation + ': identity normalization and supported licence formats', async (t) => {
    const h = await setup(t, { module: 'delivery-partners' }, operation)
    h.form.patchValue({ pan_number: '  abcde1234f ', bank_ifsc_code: ' sbin0001234 ', bank_account_number: ' 00123456789 ', aadhar_number: ' 2345 6789 0123 ', driving_license_number: ' ap-01 / 2020 / 0000001 ' })
    h.submit()
    assert.equal(h.requests.length, 1)
    const payload = h.requests[0].args[0]
    assert.equal(payload.get('pan_number'), 'ABCDE1234F')
    assert.equal(payload.get('bank_ifsc_code'), 'SBIN0001234')
    assert.equal(payload.get('bank_account_number'), '00123456789')
    assert.equal(payload.get('aadhar_number'), base.aadhar_number)
    assert.equal(payload.get('driving_license_number'), 'AP-01/2020/0000001')
    assert.equal(payload.has('pwd'), operation === 'add')
    for (const licence of ['AP0120200000001', 'AP01 20200000001', 'RJ-13/DLC/12/123456', 'F/TN/040/123456/2004', '1/1234/2012']) {
      h.form.controls.driving_license_number.setValue(licence)
      h.c.normalizeIdentityDetails()
      assert.ok(validation.validateForm(h.form), 'Supported licence format rejected')
    }
  })
  test('delivery-partners/' + operation + ': identity and bank malformed values cannot reach API', async (t) => {
    const h = await setup(t, { module: 'delivery-partners' }, operation)
    const cases = {
      aadhar_number: ['123456789012', '012345678901', '23456789012', '2345678901234', '2345-6789-0123', '2345a7890123'],
      pan_number: ['ABCD1234F', 'ABCDE12345', 'ABCD11234F'],
      driving_license_number: ['?', 'NOT A LICENCE', '123456', 'AP@01#20200000001'],
      bank_account_number: ['12345678', '1'.repeat(19), '12345ABC678', '00123-456789', '00123 456789'],
      bank_ifsc_code: ['SBIN1001234', 'SBIN000123', 'SB1N0001234', 'SBIN00012!4'],
    }
    for (const [field, values] of Object.entries(cases)) for (const value of values) {
      const old = h.form.controls[field].value
      h.form.controls[field].setValue(value)
      h.submit()
      assert.equal(h.requests.length, 0, field + ' reached API')
      assert.ok(validation.fieldError(h.form, field, field), field + ' has no message')
      h.form.controls[field].setValue(old)
    }
    for (const account of ['000000001', '1'.repeat(18)]) {
      h.form.controls.bank_account_number.setValue(account)
      assert.ok(validation.validateForm(h.form))
    }
    const file = new File([new Uint8Array(8 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
    await upload(h.c, 'delivery-partners', 'aadhar_image', file)
    h.submit()
    assert.equal(h.requests.length, 0)
    assert.ok(validation.fieldError(h.form, 'aadhar_image', 'Aadhaar image'))
  })
}
