// All persistence is mocked. These tests never open a real database connection.
jest.mock('../config/dbconnect', () => ({ MySQLConPool: {} }));
jest.mock('../public_app/lib/db', () => ({ one: jest.fn(), query: jest.fn(), transaction: jest.fn() }));
jest.mock('../partner_app/lib/db', () => ({ one: jest.fn(), query: jest.fn(), handle: fn => fn, refuse: (res, message) => res.json({ status: 202, message }) }));
jest.mock('../partner_app/lib/branding', () => ({ load: jest.fn(async () => ({})) }));
const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../public_app/lib/db');
const partnerDb = require('../partner_app/lib/db');
global.appRoot = require('path').resolve(__dirname, '..');
const app = express();
app.use(express.json());
app.use('/dashboard_api', require('../dashboard_api/routes/routes'));
const partnerAuth = require('../partner_app/controllers/authCtrl');
const secret = process.env.MV_ADMIN_JWT_SECRET || 'mv-admin-dev-secret';
const token = (tenant = 7) => jwt.sign({ admin_id: 10, tenant_id: tenant }, secret);
const endpoints = ['getfranchises', 'addfranchise', 'updatefranchise', 'deletefranchise', 'updatefranchiseloginstatus', 'updatefranchiseactivestatus'];
const send = (name, body = {}, auth = token()) => {
    const req = name === 'getfranchises' ? request(app).get('/dashboard_api/' + name) : request(app).post('/dashboard_api/' + name).send(body);
    return auth ? req.set('Authorization', 'Bearer ' + auth) : req;
};
const valid = () => ({ franchise_name: 'Test Franchise', mobile_number: '9876543210', pwd: 'test password', email: 'test@example.com', bank_account_number: '00123456789', bank_ifsc_code: 'sbin0001234', commission_percentage: '12.50' });
let rows, allowed, blocked;
beforeEach(() => {
    jest.clearAllMocks();
    allowed = true; blocked = [];
    rows = [
        { id: 1, tenant_id: 7, franchise_name: 'Own', mobile_number: '9876543211', pwd: 'original-secret', login_status: 0, active_status: 1, d_in: 0 },
        { id: 2, tenant_id: 8, franchise_name: 'Other', mobile_number: '9876543212', pwd: 'other-secret', login_status: 0, active_status: 1, d_in: 0 },
        { id: 3, tenant_id: 7, franchise_name: 'Deleted', mobile_number: '9876543213', pwd: 'deleted-secret', login_status: 0, active_status: 1, d_in: 1 },
    ];
    db.one.mockImplementation(async (sql, params) => {
        if (sql.includes('FROM admin_user_permissions')) {
            expect(sql).toContain('a.tenant_id = ?');
            expect(sql).toContain('a.d_in = 0 AND a.login_status = 0');
            expect(sql).toContain('s.route_path = ?');
            expect(sql).toContain('p.can_view = 1');
            expect(sql).toContain('s.is_active = 1');
            expect(params).toEqual([10, expect.any(Number), '/masters/franchise/franchise-list']);
            return allowed && !blocked.some(flag => sql.includes('p.' + flag + ' = 1')) ? { id: 42 } : null;
        }
        if (sql.includes('mobile_number = ?')) return rows.find(row => row.mobile_number === params[0] && row.d_in === 0 && row.id !== params[1]) || null;
        expect(sql).toContain('id = ? AND tenant_id = ? AND d_in = 0');
        return rows.find(row => row.id === params[0] && row.tenant_id === params[1] && row.d_in === 0) || null;
    });
    db.query.mockImplementation(async (sql, params) => {
        if (sql.startsWith('SELECT')) {
            expect(sql).not.toMatch(/\bpwd\b|SELECT \*/i);
            expect(sql).toContain('tenant_id = ? AND d_in = 0 ORDER BY id DESC');
            return rows.filter(row => row.tenant_id === params[0] && row.d_in === 0);
        }
        expect(sql).not.toMatch(/aadhar|aadhaar|pan_|image|ALTER|CREATE TABLE|DELETE FROM/i);
        if (sql.startsWith('INSERT')) {
            const keys = sql.match(/\(([^)]+)\)/)[1].split(',').map(key => key.trim());
            const row = { id: 4, login_status: 0, active_status: 1, d_in: 0 };
            keys.forEach((key, i) => row[key] = params[i]); rows.push(row);
            return { insertId: row.id, affectedRows: 1 };
        }
        expect(sql).toContain('WHERE id = ? AND tenant_id = ? AND d_in = 0');
        const row = rows.find(row => row.id === params[params.length - 2] && row.tenant_id === params[params.length - 1] && row.d_in === 0);
        if (!row) return { affectedRows: 0 };
        const keys = sql.match(/SET (.*) WHERE/)[1].split(',').map(part => part.trim().split(' ')[0]);
        keys.forEach((key, i) => row[key] = params[i]);
        return { affectedRows: 1 };
    });
});

test.each(endpoints)('%s rejects missing, invalid and partner JWTs before querying', async endpoint => {
    for (const auth of [null, 'invalid', jwt.sign({ ref_id: 1, tenant_id: 7, role: 'franchise' }, 'partner-only-secret')]) {
        expect((await send(endpoint, {}, auth)).status).toBe(401);
    }
    expect(db.one).not.toHaveBeenCalled(); expect(db.query).not.toHaveBeenCalled();
});
test.each(endpoints)('%s fails closed without a catalog permission', async endpoint => {
    allowed = false;
    expect((await send(endpoint, { id: 1, value: 1 })).status).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
});
test.each([
    ['getfranchises', 'can_view'], ['addfranchise', 'can_add'], ['updatefranchise', 'can_edit'],
    ['deletefranchise', 'can_delete'], ['updatefranchiseloginstatus', 'can_edit'], ['updatefranchiseactivestatus', 'can_edit'],
])('%s checks the corresponding CRUD flag', async (endpoint, flag) => {
    blocked = [flag];
    expect((await send(endpoint, { ...valid(), id: 1, value: 1 })).status).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
});
test('list excludes deleted/foreign records and explicitly strips credentials', async () => {
    const response = await send('getfranchises');
    expect(response.body.status).toBe(200);
    expect(response.body.data.map(row => row.id)).toEqual([1]);
    expect(response.body.data[0]).not.toHaveProperty('pwd');
    expect(JSON.stringify(response.body)).not.toContain('original-secret');
    expect((await send('getfranchises', {}, token(8))).body.data.map(row => row.id)).toEqual([2]);
});
test('Add uses token tenant, hashes the password, defaults statuses and returns only ID', async () => {
    const response = await send('addfranchise', valid());
    expect(response.body).toEqual({ status: 200, message: 'Franchise added successfully', id: 4 });
    const row = rows.find(row => row.id === 4);
    expect(row.tenant_id).toBe(7); expect(row.login_status).toBe(0); expect(row.active_status).toBe(1);
    expect(row.bank_ifsc_code).toBe('SBIN0001234'); expect(row.bank_account_number).toBe('00123456789');
    expect(row.pwd).toMatch(/^\$2[aby]\$12\$/); expect(await bcrypt.compare(valid().pwd, row.pwd)).toBe(true);
    // Execute the existing franchise login controller with the newly generated hash.
    partnerDb.one.mockImplementation(async sql => sql.includes('FROM franchises') ? row : null);
    const res = { json: jest.fn() };
    await partnerAuth.login({ body: { mobile: row.mobile_number, password: valid().pwd, role: 'franchise' } }, res);
    expect(res.json.mock.calls[0][0]).toEqual(expect.objectContaining({ status: 200, role: 'franchise', token: expect.any(String) }));
    expect(JSON.stringify(res.json.mock.calls)).not.toContain(row.pwd);
});
test('Add to another tenant still uses only the authenticated context', async () => {
    const response = await send('addfranchise', { ...valid(), mobile_number: '9876543299' }, token(8));
    expect(response.body.status).toBe(200); expect(rows.find(row => row.id === 4).tenant_id).toBe(8);
});
test.each(['tenant_id', 'd_in', 'i_ts', 'aadhar_number', 'pan_number', 'aadhar_image', 'pan_image', 'bank_image', 'bank_details_image'])('unsupported %s is rejected without writing', async field => {
    for (const endpoint of ['addfranchise', 'updatefranchise']) {
        const response = await send(endpoint, { ...valid(), ...(endpoint === 'updatefranchise' ? { id: 1 } : {}), [field]: 'bad' });
        expect(response.body.status).toBe(202); expect(response.body.errors).toHaveProperty(field);
    }
    expect(db.query).not.toHaveBeenCalled();
});
test.each([
    ['franchise_name', ''], ['mobile_number', '123'], ['email', 'bad'], ['commission_percentage', -1],
    ['commission_percentage', '100.001'], ['commission_percentage', 101], ['commission_percentage', true],
    ['bank_ifsc_code', 'BAD'], ['bank_account_number', 'ABC'], ['franchise_code', 'x'.repeat(51)],
    ['login_status', 2], ['active_status', false], ['pwd', ''], ['pwd', 'short'], ['pwd', 'x'.repeat(73)], ['pwd', '\u{1F600}'.repeat(25)],
])('rejects invalid %s', async (field, value) => {
    const response = await send('addfranchise', { ...valid(), [field]: value });
    expect(response.body.status).toBe(202); expect(response.body.errors).toHaveProperty(field); expect(db.query).not.toHaveBeenCalled();
});
test('required fields are enforced; optional nullable/blank fields are accepted', async () => {
    expect((await send('addfranchise')).body.errors).toEqual(expect.objectContaining({ franchise_name: expect.any(String), mobile_number: expect.any(String), pwd: expect.any(String) }));
    expect((await send('addfranchise', { ...valid(), email: null, area: '', city: null })).body.status).toBe(200);
});
test.each([undefined, '', '   '])('Edit preserves password for omitted/blank input %s', async pwd => {
    const response = await send('updatefranchise', { id: 1, owner_name: 'New owner', ...(pwd === undefined ? {} : { pwd }) });
    expect(response.body.status).toBe(200); expect(rows[0].pwd).toBe('original-secret');
    expect(db.query.mock.calls[0][0]).not.toMatch(/pwd/);
});
test('Edit hashes a replacement password; responses do not disclose it', async () => {
    const response = await send('updatefranchise', { id: 1, pwd: 'replacement password' });
    expect(response.body.status).toBe(200); expect(await bcrypt.compare('replacement password', rows[0].pwd)).toBe(true);
    expect(JSON.stringify(response.body)).not.toMatch(/pwd|password|\$2/);
});
test.each(['addfranchise', 'updatefranchise'])('%s rejects duplicate active mobiles, including other tenants', async endpoint => {
    const response = await send(endpoint, { ...valid(), mobile_number: '9876543212', ...(endpoint === 'updatefranchise' ? { id: 1 } : {}) });
    expect(response.body.errors.mobile_number).toBe('Mobile number is already registered.'); expect(db.query).not.toHaveBeenCalled();
});
test('unchanged own mobile and deleted mobiles do not count as duplicates', async () => {
    expect((await send('updatefranchise', { id: 1, mobile_number: '9876543211' })).body.status).toBe(200);
    expect((await send('addfranchise', { ...valid(), mobile_number: '9876543213' })).body.status).toBe(200);
});
test.each(['updatefranchise', 'deletefranchise', 'updatefranchiseloginstatus', 'updatefranchiseactivestatus'])('%s never mutates foreign, deleted or missing records', async endpoint => {
    for (const id of [2, 3, 999]) {
        const body = endpoint === 'updatefranchise' ? { id, owner_name: 'Changed' } : endpoint.includes('status') ? { id, value: 1 } : { id };
        const response = await send(endpoint, body);
        expect(response.body.status).toBe(202); expect(response.body.errors.id).toBe('Franchise not found.');
    }
    expect(rows[1].owner_name).toBeUndefined(); expect(rows[1].d_in).toBe(0); expect(rows[1].login_status).toBe(0); expect(rows[1].active_status).toBe(1);
});
test.each(['updatefranchise', 'deletefranchise', 'updatefranchiseloginstatus', 'updatefranchiseactivestatus'])('%s rejects malformed IDs', async endpoint => {
    for (const id of [undefined, 0, -1, '1 OR 1=1', {}, 1.5, true]) {
        expect((await send(endpoint, { id, value: 1 })).body.status).toBe(202);
    }
    expect(db.query).not.toHaveBeenCalled();
});
test('Delete is soft, scoped and repeat deletion is refused', async () => {
    expect((await send('deletefranchise', { id: 1 })).body.status).toBe(200);
    expect(rows[0].d_in).toBe(1); expect(rows).toHaveLength(3);
    expect((await send('deletefranchise', { id: 1 })).body.status).toBe(202);
});
test.each([['updatefranchiseloginstatus', 'login_status'], ['updatefranchiseactivestatus', 'active_status']])('%s only updates its own status', async (endpoint, field) => {
    for (const value of [0, 1, '0', '1']) {
        expect((await send(endpoint, { id: 1, value })).body.status).toBe(200); expect(rows[0][field]).toBe(Number(value));
        expect(db.query.mock.calls.at(-1)[0]).toContain('SET ' + field + ' = ? WHERE');
    }
    expect(rows[0].d_in).toBe(0);
    for (const value of [2, -1, null, true, [], {}]) expect((await send(endpoint, { id: 1, value })).body.status).toBe(202);
    expect((await send(endpoint, { id: 1, value: 1, d_in: 1 })).body.status).toBe(202);
});
test('Add cannot set status with add-only permission', async () => {
    blocked = ['can_edit'];
    expect((await send('addfranchise', { ...valid(), login_status: 1 })).status).toBe(403);
    expect(db.query).not.toHaveBeenCalled();
});
test('SQL values are parameterized, never concatenated', async () => {
    const name = "O'Reilly; DROP TABLE franchises; --";
    expect((await send('updatefranchise', { id: 1, franchise_name: name })).body.status).toBe(200);
    const [sql, params] = db.query.mock.calls[0]; expect(sql).not.toContain(name); expect(params).toContain(name);
});
test('database failures use the standard safe envelope without logging credentials', async () => {
    db.query.mockRejectedValue(new Error('database diagnostic containing secrets'));
    const log = jest.spyOn(console, 'error').mockImplementation(() => {});
    const response = await send('getfranchises');
    expect(response.body).toEqual({ status: 500, message: 'Internal server error' }); expect(log).not.toHaveBeenCalled(); log.mockRestore();
});


describe('Franchise catalog permission integration', () => {
    const main = require('../dashboard_api/controllers/mainCtrl');
    const franchiseModel = require('../dashboard_api/models/mainModel').franchise;
    beforeEach(() => jest.spyOn(franchiseModel, 'ensureCatalog').mockResolvedValue({ module_id: 71, sub_module_id: 72 }));
    const dbutil = require('../utils/dbutils');
    // Isolated fixture IDs; production mappings are always read from the catalog.
    const catalog = { module_id: 71, id: 72, module_nm: 'Franchise', label: 'Franchise List',
        link: '/masters/franchise/franchise-list', module_order: 14, sub_module_order: 1 };
    const invoke = (handler, body) => new Promise(resolve => handler({ admin: { id: 10, tenant_id: 7 }, body }, { json: resolve }));
    afterEach(() => jest.restoreAllMocks());

    test('the existing Permissions endpoint discovers an unassigned Franchise catalog row', async () => {
        jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => {
            expect(sql).not.toContain('INSERT');
            if (label === 'getupdatemodules-sub') {
                expect(sql).toContain('admin_sub_module');
                return cb(null, [{ ...catalog, check_sub_menu: 0, can_view: 1, can_add: 1, can_edit: 1, can_delete: 1 }]);
            }
            if (label === 'getupdatemodules-standalone') return cb(null, []);
            throw Error('Unexpected query ' + label);
        });
        const result = await invoke(main.getupdatemodules, { usr_id: 10 });
        expect(result.status).toBe(200);
        expect(result.data[0]).toEqual(expect.objectContaining({ module_nm: 'Franchise', label: 'Franchise List', link: catalog.link, check_sub_menu: false }));
    });

    test('module list still includes Franchise with real catalog IDs if the catalog query omits it', async () => {
        jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => {
            if (label === 'getupdatemodules-sub' || label === 'getupdatemodules-standalone') return cb(null, []);
            if (label === 'getupdatemodules-franchise') {
                expect(params).toEqual([10, catalog.module_id, catalog.id]);
                return cb(null, []);
            }
            throw Error('Unexpected query ' + label);
        });
        const result = await invoke(main.getupdatemodules, { usr_id: 10 });
        expect(result.status).toBe(200);
        expect(result.data).toContainEqual(expect.objectContaining({
            module_id: catalog.module_id, id: catalog.id, module_nm: 'Franchise',
            label: 'Franchise List', link: catalog.link, check_sub_menu: false,
        }));
    });

    test('fallback Franchise option preserves existing permission flags', async () => {
        jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => {
            if (label === 'getupdatemodules-sub' || label === 'getupdatemodules-standalone') return cb(null, []);
            if (label === 'getupdatemodules-franchise') {
                return cb(null, [{ id: 99, can_view: 1, can_add: 0, can_edit: 1, can_delete: 0 }]);
            }
            throw Error('Unexpected query ' + label);
        });
        const result = await invoke(main.getupdatemodules, { usr_id: 10 });
        expect(result.data).toContainEqual(expect.objectContaining({
            module_id: catalog.module_id, id: catalog.id, link: catalog.link,
            check_sub_menu: true, can_view: 1, can_add: 0, can_edit: 1, can_delete: 0,
        }));
    });

    test('the existing save endpoint stores explicitly selected Franchise CRUD flags with catalog IDs', async () => {
        const query = jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => cb(null, { affectedRows: 1 }));
        const result = await invoke(main.postusermenulist, { modules: [{ id: catalog.id, module_id: catalog.module_id,
            user_id: 10, link: catalog.link, can_view: 1, can_add: 0, can_edit: 1, can_delete: 0 }] });
        expect(result.status).toBe(200);
        const insert = query.mock.calls.find(call => call[3] === 'savePerms-insert');
        expect(insert[2]).toEqual([10, catalog.module_id, catalog.id, 1, 0, 1, 0]);
    });

    test('menu refresh returns no Franchise menu or permissions without View', async () => {
        const query = jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => {
            expect(label).toBe('buildMenuTree-perms');
            expect(sql).toContain('p.can_view = 1');
            return cb(null, []);
        });
        const result = await invoke(main.getmodulelistdetails, { usr_id: 10 });
        expect(result).toEqual({ status: 200, data: [], permissions: [] });
        expect(query).toHaveBeenCalledTimes(1);
    });

    test('menu refresh maps assigned View and action flags from catalog rows without special Franchise code', async () => {
        jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, cb) => {
            if (label === 'buildMenuTree-perms') return cb(null, [{ admin_main_module_id: catalog.module_id,
                admin_sub_module_id: catalog.id, can_view: 1, can_add: 0, can_edit: 1, can_delete: 0 }]);
            if (label === 'buildMenuTree-modules') return cb(null, [{ id: catalog.module_id, module_name: 'Franchise',
                module_icon: 'ri-store-2-line', module_order: 14, sub_id: catalog.id, sub_module_name: 'Franchise List', route_path: catalog.link }]);
            throw Error('Unexpected query ' + label);
        });
        const result = await invoke(main.getmodulelistdetails, { usr_id: 10 });
        expect(result.data[0].title).toBe('Franchise');
        expect(result.data[0].children[0]).toEqual(expect.objectContaining({ title: 'Franchise List', path: catalog.link, can_view: 1, can_add: 0, can_edit: 1, can_delete: 0 }));
        expect(result.permissions).toEqual([expect.objectContaining({ path: catalog.link, module_id: catalog.module_id,
            sub_module_id: catalog.id, can_view: 1, can_add: 0, can_edit: 1, can_delete: 0 })]);
    });
});


describe('Franchise catalog registration uses the existing database tables', () => {
    const model = require('../dashboard_api/models/mainModel').franchise;
    const parent = { id: 501, module_name: 'Franchise', module_order: 15, is_active: 1, d_in: 0 };
    const child = { id: 502, admin_main_module_id: 501, sub_module_name: 'Franchise List', route_path: '/masters/franchise/franchise-list', is_active: 1, d_in: 0 };
    let query;
    beforeEach(() => {
        query = jest.fn();
        db.transaction.mockImplementation(work => work(query));
    });
    test('missing catalog entries use generated IDs without permission grants or schema writes', async () => {
        query.mockResolvedValueOnce([{ id: 1, module_name: 'Existing', module_order: 14 }])
            .mockResolvedValueOnce({ insertId: parent.id }).mockResolvedValueOnce([]).mockResolvedValueOnce({ insertId: child.id });
        expect(await model.ensureCatalog()).toEqual({ module_id: parent.id, sub_module_id: child.id });
        expect(query.mock.calls[1][1]).toEqual(['Franchise', 'ri-store-2-line', 15]);
        expect(query.mock.calls[3][1]).toEqual([parent.id, 'Franchise List', child.route_path]);
        for (const [sql] of query.mock.calls) expect(sql).not.toMatch(/admin_user_permissions|ALTER|CREATE TABLE|DELETE|UPDATE /i);
    });
    test('existing catalog is idempotent and reactivates disabled Franchise entries', async () => {
        for (const disabled of [false, true]) {
            query.mockResolvedValueOnce([{ ...parent, is_active: disabled ? 0 : 1 }]);
            if (disabled) query.mockResolvedValueOnce({ affectedRows: 1 });
            query.mockResolvedValueOnce([{ ...child, d_in: disabled ? 1 : 0 }]);
            if (disabled) query.mockResolvedValueOnce({ affectedRows: 1 });
            expect(await model.ensureCatalog()).toEqual({ module_id: parent.id, sub_module_id: child.id });
            if (disabled) {
                expect(query.mock.calls.slice(-4).map(([sql]) => sql.split(' ')[0])).toEqual(['SELECT', 'UPDATE', 'SELECT', 'UPDATE']);
                expect(query.mock.calls.at(-3)[1]).toEqual([parent.id]);
                expect(query.mock.calls.at(-1)[1]).toEqual([child.id]);
            } else {
                expect(query.mock.calls.slice(-2).every(([sql]) => sql.startsWith('SELECT'))).toBe(true);
            }
        }
    });
    test('existing parent is reused when only the child is missing', async () => {
        query.mockResolvedValueOnce([parent]).mockResolvedValueOnce([]).mockResolvedValueOnce({ insertId: child.id });
        expect(await model.ensureCatalog()).toEqual({ module_id: parent.id, sub_module_id: child.id });
        expect(query.mock.calls.filter(([sql]) => sql.startsWith('INSERT'))).toHaveLength(1);
    });
    test('conflicting mappings fail instead of reassigning existing permissions', async () => {
        query.mockResolvedValueOnce([parent]).mockResolvedValueOnce([{ ...child, admin_main_module_id: 999 }]);
        await expect(model.ensureCatalog()).rejects.toThrow('Conflicting');
        expect(query.mock.calls.every(([sql]) => sql.startsWith('SELECT'))).toBe(true);
    });
    test('catalog initialization failure is reported instead of returning an incomplete permission list', async () => {
        const main = require('../dashboard_api/controllers/mainCtrl');
        db.transaction.mockRejectedValueOnce(new Error('unavailable'));
        const res = { json: jest.fn() };
        await main.getupdatemodules({ body: { usr_id: 0 } }, res);
        expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ status: 500, message: expect.stringContaining('Franchise module catalog') }));
    });
});
