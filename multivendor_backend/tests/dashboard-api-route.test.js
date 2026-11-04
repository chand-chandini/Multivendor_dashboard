const app = require('../app');

describe('dashboard api app bootstrap', () => {
  test('loads without crashing when dashboard routes register', () => {
    expect(app).toBeTruthy();
  });
});


const request = require('supertest');
const jwt = require('jsonwebtoken');
const identity = require('../validators/mstrVldt');
const dbutil = require('../utils/dbutils');
const main = require('../dashboard_api/controllers/mainCtrl');
const savedDocuments = { aadhar_image: 'saved/a.png', pan_image: 'saved/p.png', driving_license_image: 'saved/d.png', bank_details_image: 'saved/b.png' };
const identityBody = () => ({
  name: 'Test Partner', mobile_number: '9876543210', pwd: 'test password',
  address: 'Test street', location_id: '1', cod_limit: '0',
  aadhar_number: '234567890123', pan_number: 'ABCDE1234F',
  driving_license_number: 'AP0120200000001',
  bank_account_number: '00123456789', bank_ifsc_code: 'SBIN0001234',
});
const documentFiles = () => Object.fromEntries(Object.keys(savedDocuments).map(field => [field, [{ filename: field + '.png', originalname: 'document.png', mimetype: 'image/png', size: 12 }]]));
const authToken = jwt.sign({ admin_id: 1, tenant_id: 1 }, process.env.MV_ADMIN_JWT_SECRET || 'mv-admin-dev-secret');

describe('identity format validation before persistence', () => {
  afterEach(() => jest.restoreAllMocks());

  test('normalization preserves leading zeroes and does not change KYC state', () => {
    const body = { ...identityBody(), pan_number: ' abcde1234f ', bank_ifsc_code: ' sbin0001234 ', bank_account_number: ' 00123456789 ', aadhar_number: ' 2345 6789 0123 ', driving_license_number: ' ap-01 / 2020 / 0000001 ', kyc_status: 0 };
    expect(identity.validateIdentityDetails(body, { editing: true, saved: savedDocuments })).toEqual({});
    expect(body.pan_number).toBe('ABCDE1234F');
    expect(body.bank_ifsc_code).toBe('SBIN0001234');
    expect(body.bank_account_number).toBe('00123456789');
    expect(body.aadhar_number).toHaveLength(12);
    expect(body.driving_license_number).toBe('AP-01/2020/0000001');
    expect(body.kyc_status).toBe(0);
  });

  test.each([
    ['pan_number', 'BAD'], ['pan_number', 'ABCDE12345'],
    ['aadhar_number', '123456789012'], ['aadhar_number', '012345678901'],
    ['aadhar_number', '23456789012'], ['aadhar_number', '2345678901234'], ['aadhar_number', '2345-6789-0123'], ['aadhar_number', '2345a7890123'],
    ['driving_license_number', 'NOT A LICENCE'], ['driving_license_number', '123456'], ['driving_license_number', 'AP@01#2020'],
    ['bank_account_number', '12345678'], ['bank_account_number', '1'.repeat(19)], ['bank_account_number', '12345ABC678'], ['bank_account_number', '00123-456789'],
    ['bank_ifsc_code', 'SBIN1001234'], ['bank_ifsc_code', 'SB1N0001234'],
    ['name', ' '], ['address', ' '], ['mobile_number', '123'], ['cod_limit', '-1'], ['cod_limit', ' '],
  ])('direct Add/Edit requests reject malformed %s without any write', async (field, value) => {
    const query = jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => {
      if (label === 'updatedeliverypartner-get') return cb(null, [savedDocuments]);
      throw new Error('Unexpected database operation');
    });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    for (const endpoint of ['adddeliverypartner', 'updatedeliverypartner']) {
      const body = { ...identityBody(), id: 17, [field]: value };
      const response = await request(app).post('/dashboard_api/' + endpoint).set('Authorization', 'Bearer ' + authToken).send(body);
      expect(response.status).toBe(200);
      expect(response.body.status).toBe(202);
      expect(response.body.errors[field]).toEqual(expect.any(String));
      expect(query.mock.calls.every(call => !/INSERT|UPDATE\s/i.test(call[1]))).toBe(true);
    }
  });

  test.each(['AP0120200000001', 'AP01 20200000001', 'RJ-13/DLC/12/123456', 'F/TN/040/123456/2004', '1/1234/2012'])('supported standard and legacy licence format %s', licence => {
    const errors = identity.validateIdentityDetails({ ...identityBody(), driving_license_number: licence }, { editing: true, saved: savedDocuments });
    expect(errors).toEqual({});
  });

  test('bank checks retain the existing variable length rule and optional bank name', () => {
    for (const account of ['000000001', '1'.repeat(18)]) {
      expect(identity.validateBankDetails({ bank_account_number: account, bank_ifsc_code: 'sbin0001234' }, false)).toEqual({});
    }
    expect(identity.validateBankDetails({ bank_account_number: '00123456789', bank_ifsc_code: 'SBIN0001234' }, true)).toHaveProperty('bank_account_holder');
  });

  test('document checks reject unsupported, empty and oversized files; Edit reuses saved images', () => {
    expect(identity.validateIdentityDetails(identityBody(), { editing: true, saved: savedDocuments })).toEqual({});
    for (const change of [{ mimetype: 'application/pdf', originalname: 'document.pdf' }, { size: 0 }, { size: 8 * 1024 * 1024 + 1 }]) {
      const files = documentFiles();
      Object.assign(files.aadhar_image[0], change);
      expect(identity.validateIdentityDetails(identityBody(), { files })).toHaveProperty('aadhar_image');
    }
    expect(identity.validateIdentityDetails(identityBody(), { editing: true, saved: { ...savedDocuments, aadhar_image: null } })).toHaveProperty('aadhar_image');
    expect(identity.validateIdentityDetails({ ...identityBody(), pwd: '' }, { files: documentFiles() })).toHaveProperty('pwd');
    expect(identity.validateIdentityDetails({ ...identityBody(), pwd: '' }, { editing: true, saved: savedDocuments })).not.toHaveProperty('pwd');
  });

  test('valid Add/Edit reaches existing SQL with normalized identity and banking data', async () => {
    const query = jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => {
      if (label === 'adddeliverypartner-check') return cb(null, []);
      if (label === 'updatedeliverypartner-get') return cb(null, [savedDocuments]);
      return cb(null, { insertId: 23, affectedRows: 1 });
    });
    const add = await new Promise(resolve => main.adddeliverypartner({ admin: { tenant_id: 1 }, body: { ...identityBody(), pan_number: ' abcde1234f ', bank_ifsc_code: ' sbin0001234 ' }, files: documentFiles() }, { json: resolve }));
    expect(add.status).toBe(200);
    const insert = query.mock.calls.find(call => call[3] === 'adddeliverypartner');
    expect(insert[2]).toEqual(expect.arrayContaining(['ABCDE1234F', 'SBIN0001234', '00123456789']));
    const edit = await new Promise(resolve => main.updatedeliverypartner({ admin: { tenant_id: 1 }, body: { ...identityBody(), id: 17, pwd: '' } }, { json: resolve }));
    expect(edit.status).toBe(200);
    expect(query.mock.calls.find(call => call[3] === 'updatedeliverypartner')[2]).toEqual(expect.arrayContaining(Object.values(savedDocuments)));
  });

  test('request logs redact identity and banking values before validation', async () => {
    const log = jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(dbutil, 'sqlinjection').mockImplementation(() => { throw new Error('Invalid input must not reach SQL'); });
    const body = { ...identityBody(), pan_number: 'invalid', bank_account_number: 'invalid' };
    await request(app).post('/dashboard_api/adddeliverypartner').set('Authorization', 'Bearer ' + authToken).send(body);
    const logged = JSON.stringify(log.mock.calls);
    expect(logged.includes(body.aadhar_number)).toBe(false);
    expect(logged.includes(body.bank_ifsc_code)).toBe(false);
    expect(logged).toContain('[redacted]');
  });
});


describe('other existing identity and banking forms', () => {
  afterEach(() => jest.restoreAllMocks());

  test('Vendor Add/Edit rejects malformed PAN and bank details before SQL', async () => {
    const query = jest.spyOn(dbutil, 'sqlinjection').mockImplementation(() => { throw new Error('Invalid vendor identity must not reach SQL'); });
    jest.spyOn(console, 'log').mockImplementation(() => {});
    const body = { vendor_name: 'Shop', vendor_mobile_number: '9876543210', id: 17, pan_number: 'BAD', bank_account_number: '123', bank_ifsc_code: 'BAD', bank_account_holder: 'Owner', bank_name: 'Bank' };
    for (const handler of [main.addvendor, main.updatevendor]) {
      const response = await new Promise(resolve => handler({ admin: { tenant_id: 1 }, body: { ...body } }, { json: resolve }));
      expect(response.status).toBe(202);
      expect(response.errors).toHaveProperty('pan_number');
      expect(response.errors).toHaveProperty('bank_account_number');
      expect(response.errors).toHaveProperty('bank_ifsc_code');
    }
    expect(query).not.toHaveBeenCalled();
  });

  test('Vendor normalization uses the same formats without changing optional licence fields', () => {
    const body = { pan_number: ' abcde1234f ', bank_account_number: ' 00123456789 ', bank_ifsc_code: ' sbin0001234 ', bank_account_holder: ' Owner ', bank_name: ' Bank ', drug_license_number: null };
    expect(identity.validateIdentityDetails(body, { vendor: true })).toEqual({});
    expect(body.pan_number).toBe('ABCDE1234F');
    expect(body.bank_ifsc_code).toBe('SBIN0001234');
    expect(body.bank_account_number).toBe('00123456789');
    expect(body.drug_license_number).toBeNull();
  });

  test('partner bank update shares validation, preserves optional bank name, and rejects embedded characters', async () => {
    const partnerDb = require('../partner_app/lib/db');
    const auth = require('../partner_app/controllers/authCtrl');
    const query = jest.spyOn(partnerDb, 'query').mockResolvedValue({ affectedRows: 1 });
    for (const account of ['00123-456789', '00123 456789', '12345678', '12345ABC678']) {
      const response = await new Promise(resolve => auth.updatebankaccount({ partner: { id: 17, role: 'delivery' }, body: { accountNumber: account, ifsc: 'SBIN0001234' } }, { json: resolve }));
      expect(response.status).toBe(202);
    }
    expect(query).not.toHaveBeenCalled();
    const response = await new Promise(resolve => auth.updatebankaccount({ partner: { id: 17, role: 'vendor' }, body: { accountNumber: ' 00123456789 ', ifsc: ' sbin0001234 ', holder: ' Owner ' } }, { json: resolve }));
    expect(response.status).toBe(200);
    expect(query.mock.calls[0][1]).toEqual([null, '00123456789', 'SBIN0001234', 'Owner', 17]);
  });
});


describe('retired Delivery Slots admin module', () => {
  afterEach(() => jest.restoreAllMocks());
  test.each([['post','adddeliveryslot'],['get','getdeliveryslots'],['post','updatedeliveryslot'],['post','deletedeliveryslot']])('%s %s is no longer registered', async (method, endpoint) => {
    const response = await request(app)[method]('/dashboard_api/' + endpoint).set('Authorization', 'Bearer ' + authToken);
    expect(response.status).toBe(404);
  });
  test('permission editor omits retired module without database writes', async () => {
    jest.spyOn(require('../dashboard_api/models/mainModel').franchise, 'ensureCatalog').mockResolvedValue({ module_id: 71, sub_module_id: 72 });
    jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => {
      if (label === 'getupdatemodules-sub') return cb(null, [{ link: '/masters/deliveryslots' }, { link: '/masters/vendors' }]);
      if (label === 'getupdatemodules-standalone') return cb(null, []);
      throw new Error('Unexpected database operation: ' + label);
    });
    const result = await new Promise(resolve => main.getupdatemodules({ body: { usr_id: 1 } }, { json: resolve }));
    expect(result.data.map(row => row.link)).toEqual(['/masters/vendors']);
  });
});
