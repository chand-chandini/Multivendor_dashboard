// Run: node --test src/app/views/multivendor/vendors/vendors.validation.test.mjs
// Exercise the actual component with Angular DI/forms. Stub external services,
// template dependencies and FileReader; no browser or live API is required.
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { test } from 'node:test'
import ts from 'typescript'
import '@angular/compiler'
import * as core from '@angular/core'
import * as forms from '@angular/forms'

class MultivendorService {}
class NotifyService {}
class PermissionService {}
class NgbModal {}
class PreviewReader {
  readAsDataURL() {
    this.result = 'data:image/png;base64,cHJldmlldw=='
    this.onload?.()
  }
}

const dependencies = {
  '@angular/core': core,
  '@angular/forms': forms,
  '@app/components/data-table/data-table': { DataTable: class {} },
  '@app/components/page-breadcrumb/page-breadcrumb': { PageBreadcrumb: class {} },
  '@/app/config/api.config': { API_CONFIG: { baseUrl: 'https://example.test/dashboard_api/' } },
  '@core/services/multivendor.service': { MultivendorService },
  '@core/services/notify.service': { NotifyService },
  '@core/services/permission.service': { PermissionService },
  '@ng-bootstrap/ng-bootstrap': { NgbModal },
}
const source = readFileSync(new URL('./vendors.ts', import.meta.url), 'utf8')
const template = readFileSync(new URL('./vendors.html', import.meta.url), 'utf8')
const { outputText } = ts.transpileModule(source, {
  compilerOptions: {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
    experimentalDecorators: true,
  },
})
const exports = {}
new Function('require', 'exports', 'FileReader', outputText)((name) => {
  assert.ok(name in dependencies, `Unexpected dependency: ${name}`)
  return dependencies[name]
}, exports, PreviewReader)
const { Vendors } = exports
const response = (data = []) => ({ subscribe: (observer) => observer.next({ status: 200, data }) })
const uploadFields = ['shop_image', 'shop_interior_image1', 'shop_interior_image2']
const numericFields = [
  'commission_percentage', 'admin_service', 'packing_charges',
  'max_free_delivery_cost', 'minimum_order_amount', 'minimum_km',
  'minimum_delivery_charge', 'per_km_charges', 'maximum_delivery_km',
]
const valid = {
  vendor_name: 'Test shop', vendor_mobile_number: '9876543210',
  vendor_mobile_number2: '9123456780', vendor_email: 'shop@example.com',
  pwd: 'initial password', location_id: 1, subcategory: 'Groceries', filter: 'All',
  vendor_unique_code: 'SHOP001', vendor_address: '1 Main Road', special_offer: '10% OFF',
  opening_time: '09:00', closing_time: '22:00', commission_percentage: 0, kyc_status: 0,
  fssai_license_number: '12345678901234', gst_number: '27ABCDE1234F1Z5', pan_number: 'ABCDE1234F',
  shop_image: 'uploads/shop.png', shop_interior_image1: 'uploads/interior1.png',
  shop_interior_image2: 'uploads/interior2.png', shop_interior_image3: 'uploads/interior3.png',
  bank_account_holder: 'Shop owner', bank_account_number: '00123456789',
  bank_ifsc_code: 'SBIN0001234', bank_name: 'Bank', upi_id: 'shop@bank',
  admin_service: 0, packing_charges: 0, max_free_delivery_cost: 0,
  minimum_order_amount: 0, minimum_km: 0, minimum_delivery_charge: 0,
  per_km_charges: 0, maximum_delivery_km: 0, latitude: '16.9891', longitude: '81.7847',
}
const requiredFields = Object.keys(valid).filter((field) => field !== 'shop_interior_image3')

function setup(t, operation = 'add') {
  const requests = []
  const api = {
    getVendors: () => response(), getLocations: () => response([{ id: 1 }]),
    getCategories: () => response(), getSubCategories: () => response([{ category_name: 'Groceries' }]),
    addVendor: (payload) => { requests.push({ operation: 'add', payload }); return response() },
    updateVendor: (payload) => { requests.push({ operation: 'edit', payload }); return response() },
  }
  const injector = core.createEnvironmentInjector([
    { provide: forms.FormBuilder, useValue: new forms.FormBuilder() },
    { provide: MultivendorService, useValue: api },
    { provide: NotifyService, useValue: { success() {}, error() {} } },
    { provide: PermissionService, useValue: {} },
    { provide: NgbModal, useValue: { open() {}, dismissAll() {} } },
  ])
  t.after(() => injector.destroy())
  const component = core.runInInjectionContext(injector, () => new Vendors())
  component.formModal = () => ({}) // No rendered modal is needed for form/API tests.
  component.ngOnInit()
  if (operation === 'edit') component.openEdit({ ...valid, id: 17 })
  else component.openAdd()
  return { component, requests, api }
}
function select(component, field, file = new File(['image'], 'shop.png', { type: 'image/png' })) {
  const event = { target: { files: [file] } }
  if (field === 'shop_image') component.onShopImageSelected(event)
  else component.onInteriorImageSelected(event, field)
}
function fillAdd(component) {
  component.form.patchValue({ ...valid, shop_interior_image3: '' })
  for (const field of uploadFields) select(component, field)
}

for (const operation of ['add', 'edit']) {
  test(`${operation}: empty form is blocked`, (t) => {
    const { component: c, requests } = setup(t, operation)
    for (const [field, control] of Object.entries(c.form.controls)) {
      if (field !== 'bank_details_image') control.setValue('')
    }
    c.submit()
    assert.equal(requests.length, 0)
    assert.ok(c.form.invalid)
    assert.ok(c.form.touched)
  })
  for (const field of requiredFields.filter((key) => operation === 'add' || key !== 'pwd')) {
    test(`${operation}: missing ${field} blocks the request and shows its message`, (t) => {
      const { component: c, requests } = setup(t, operation)
      if (operation === 'add') fillAdd(c)
      assert.ok(c.form.valid)
      if (uploadFields.includes(field)) c.selectedImages[field] = null
      c.form.controls[field].setValue('')
      c.submit()
      assert.equal(requests.length, 0)
      assert.ok(c.form.controls[field].invalid)
      assert.equal(c.fieldError(field, field), `${field} is required.`)
    })
  }
  const invalidValues = {
    vendor_name: ['   '], vendor_mobile_number: ['123', 'abcdefghij', ' 9876543210'],
    vendor_mobile_number2: ['123', 'abcdefghij', '          '], vendor_email: ['bad@', '   '],
    location_id: [0, 999, 'not-a-location'], subcategory: ['Unknown', '   '],
    filter: ['Unknown', '   '], vendor_unique_code: ['   '], vendor_address: ['   '],
    special_offer: ['   '], opening_time: ['25:00', '9:00'], closing_time: ['12:99'],
    kyc_status: [2, -1, 'unknown'], fssai_license_number: ['123', 'abcdefghijklmn'],
    gst_number: ['123456789012345'], pan_number: ['1234567890'],
    bank_account_holder: ['   '], bank_account_number: ['12abc', '   '],
    bank_ifsc_code: ['12345678901', 'SBIN1001234'], bank_name: ['   '], upi_id: ['shop', 'shop @bank'],
    latitude: ['91', '-91', 'abc', '   '], longitude: ['181', '-181', 'abc'],
    ...Object.fromEntries(numericFields.map((key) => [key, [-1, Infinity, NaN, 'abc', '   ']])),
  }
  invalidValues.commission_percentage.push(101)
  invalidValues.admin_service.push(101)
  if (operation === 'add') invalidValues.pwd = ['   ']
  for (const [field, values] of Object.entries(invalidValues)) {
    test(`${operation}: invalid ${field} values are blocked`, (t) => {
      const { component: c, requests } = setup(t, operation)
      if (operation === 'add') fillAdd(c)
      for (const value of values) {
        c.form.controls[field].setValue(value)
        c.submit()
        assert.equal(requests.length, 0, `${field}: ${value}`)
        assert.ok(c.form.controls[field].invalid, `${field}: ${value}`)
        assert.ok(c.fieldError(field, field), `${field}: message`)
      }
    })
  }
  for (const field of uploadFields) {
    test(`${operation}: ${field} rejects non-images and empty uploads, then accepts a correction`, (t) => {
      const { component: c, requests } = setup(t, operation)
      if (operation === 'add') fillAdd(c)
      for (const file of [
        new File(['text'], 'file.txt', { type: 'text/plain' }),
        new File([], 'empty.png', { type: 'image/png' }),
        new File(['data'], 'unknown.png'),
      ]) {
        select(c, field, file)
        c.submit()
        assert.equal(requests.length, 0)
        assert.ok(c.form.controls[field].hasError('image'))
        assert.match(c.fieldError(field, field), /non-empty image file/)
      }
      select(c, field)
      assert.equal(c.fieldError(field, field), '')
      c.submit()
      assert.equal(requests.length, 1)
    })
  }
  test(`${operation}: valid form submits using the existing multipart fields`, (t) => {
    const { component: c, requests } = setup(t, operation)
    if (operation === 'add') fillAdd(c)
    c.submit()
    assert.equal(requests.length, 1)
    const { payload } = requests[0]
    assert.equal(requests[0].operation, operation)
    assert.ok(payload instanceof FormData)
    assert.equal(payload.get('vendor_mobile_number2'), valid.vendor_mobile_number2)
    assert.equal(payload.get('bank_account_number'), '00123456789')
    assert.equal(payload.get('packing_charges'), '0')
    assert.equal(payload.has('shop_interior_image3'), false)
    if (operation === 'add') {
      assert.equal(payload.get('pwd'), valid.pwd)
      assert.equal(payload.has('id'), false)
      for (const field of uploadFields) assert.ok(payload.get(field) instanceof File)
    } else {
      assert.equal(payload.get('id'), '17')
      assert.equal(payload.has('pwd'), false)
      for (const field of uploadFields) assert.equal(payload.has(field), false)
    }
  })
}

test('Edit preserves saved values/images, formats times, and resets touched state', (t) => {
  const { component: c } = setup(t, 'edit')
  c.form.markAllAsTouched()
  c.openEdit({ ...valid, id: 17, opening_time: '09:00:00', closing_time: '22:00:00' })
  assert.ok(c.form.valid)
  assert.equal(c.form.touched, false)
  for (const [field, value] of Object.entries(valid)) {
    assert.equal(c.form.controls[field].value, field === 'pwd' ? '' : value, field)
  }
  assert.equal(c.imageNames().shop_interior_image3, 'interior3.png')
  assert.ok(c.imagePreviews().shop_image.endsWith('/uploads/shop.png'))
})
for (const field of [...numericFields, 'kyc_status']) {
  test(`Edit does not silently replace missing saved ${field} with zero`, (t) => {
    const { component: c, requests } = setup(t, 'edit')
    c.openEdit({ ...valid, id: 17, [field]: null })
    assert.equal(c.form.controls[field].value, null)
    c.submit()
    assert.equal(requests.length, 0)
    assert.equal(c.fieldError(field, field), `${field} is required.`)
  })
}
test('Errors wait for touch/submit and clear after correction', (t) => {
  const { component: c } = setup(t)
  assert.equal(c.fieldError('bank_name', 'Bank name'), '')
  c.submit()
  assert.equal(c.fieldError('bank_name', 'Bank name'), 'Bank name is required.')
  c.form.controls.bank_name.setValue('Bank')
  assert.equal(c.fieldError('bank_name', 'Bank name'), '')
})
test('Add after Edit restores password/upload requirements and clears previous files', (t) => {
  const { component: c, requests } = setup(t, 'edit')
  select(c, 'shop_image')
  c.openAdd()
  assert.equal(c.form.touched, false)
  assert.ok(c.form.controls.pwd.hasValidator(forms.Validators.required))
  assert.equal(c.selectedImages.shop_image, null)
  c.form.patchValue({ ...valid, shop_interior_image3: '' })
  c.submit()
  assert.equal(requests.length, 0)
  for (const field of uploadFields) assert.ok(c.form.controls[field].hasError('required'))
})
test('Submissions recheck lookup options and prevent duplicate requests while saving', (t) => {
  const { component: c, requests, api } = setup(t, 'edit')
  c.locations.set([])
  c.submit()
  assert.equal(requests.length, 0)
  assert.ok(c.form.controls.location_id.hasError('selection'))
  c.ngOnInit()
  assert.ok(c.form.controls.location_id.valid)
  c.subcategories.set([])
  c.submit()
  assert.equal(requests.length, 0)
  assert.ok(c.form.controls.subcategory.hasError('selection'))
  c.ngOnInit()
  assert.ok(c.form.controls.subcategory.valid)
  api.updateVendor = (payload) => { requests.push({ payload }); return { subscribe() {} } }
  c.submit()
  c.submit()
  assert.equal(requests.length, 1)
})
test('Unsupported third image stays visible/read-only; direct upload handlers cannot silently drop it', (t) => {
  const { component: c, requests } = setup(t, 'edit')
  assert.match(template, /id="interiorImage3"\s+disabled/)
  assert.match(template, /New uploads for Interior Image 3 are unavailable/)
  select(c, 'shop_interior_image3')
  c.submit()
  assert.equal(requests.length, 0)
  assert.ok(c.form.controls.shop_interior_image3.hasError('unsupportedUpload'))
})
test('Existing required controls retain their markers and validation messages', () => {
  const controls = [...template.matchAll(/<(input|select|textarea)\b[^>]*formControlName="([^"]+)"[^>]*>/g)].filter((match) => match[2] !== 'store_category')
  assert.equal(controls.length + uploadFields.length + 1, Object.keys(valid).length)
  for (const match of controls) {
    const [tag, kind, field] = match
    const start = match.index
    const end = kind === 'input' ? start + tag.length : template.indexOf(`</${kind}>`, start) + kind.length + 3
    const nearby = template.slice(end, template.indexOf('</div>', end) + 6)
    assert.match(nearby, /text-danger fs-xs mt-1/, field)
    const id = tag.match(/\bid="([^"]+)"/)[1]
    const label = template.match(new RegExp(`<label for="${id}"[^>]*>[\\s\\S]*?</label>`))[0]
    assert.match(label, /text-danger/, field)
  }
})


test('Store types use unique valid API verticals and readable labels', (t) => {
  const { component: c } = setup(t)
  c.categories.set([{ vertical: 'food' }, { vertical: 'grocery' }, { vertical: 'food' },
    { vertical: ' ' }, { vertical: null }, {}, { vertical: 123 }, { vertical: 'x'.repeat(21) }, { vertical: 'fresh_produce' }])
  assert.deepEqual(c.storeTypes(), [
    { value: 'food', label: 'Food' }, { value: 'grocery', label: 'Grocery' },
    { value: 'fresh_produce', label: 'Fresh Produce' },
  ])
})

test('Store type is submitted on Add, selected on Edit, changed and reopened', (t) => {
  const { component: c, requests } = setup(t)
  c.categories.set([{ vertical: 'food' }, { vertical: 'grocery' }])
  fillAdd(c)
  c.form.controls.store_category.setValue('food')
  c.submit()
  assert.equal(requests.length, 1)
  assert.equal(requests[0].payload.get('store_category'), 'food')
  c.openEdit({ ...valid, id: 17, store_category: requests[0].payload.get('store_category') })
  assert.equal(c.form.controls.store_category.value, 'food')
  c.form.controls.store_category.setValue('grocery')
  c.submit()
  assert.equal(requests.length, 2)
  assert.equal(requests[1].payload.get('store_category'), 'grocery')
  c.openEdit({ ...valid, id: 17, store_category: requests[1].payload.get('store_category') })
  assert.equal(c.form.controls.store_category.value, 'grocery')
})

test('Saved store type survives missing categories and API errors without unrelated edit changes', (t) => {
  const { component: c, requests, api } = setup(t, 'edit')
  c.openEdit({ ...valid, id: 17, store_category: 'bakery' })
  api.getCategories = () => ({ subscribe: (observer) => observer.error(new Error('Unavailable')) })
  c.ngOnInit()
  assert.equal(c.categoriesLoading(), false)
  assert.equal(c.categoriesError(), true)
  assert.deepEqual(c.storeTypes(), [{ value: 'bakery', label: 'Bakery' }])
  c.submit()
  assert.equal(requests[0].payload.get('store_category'), 'bakery')
  c.form.controls.store_category.setValue('not-from-api')
  c.submit()
  assert.equal(requests.length, 1)
  assert.ok(c.form.controls.store_category.hasError('selection'))
  c.openAdd()
  assert.equal(c.form.controls.store_category.value, '')
  assert.equal(c.storeTypes().length, 0)
})
