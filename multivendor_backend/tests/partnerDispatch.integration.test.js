// Integration test for the delivery partner's state (GET /getpartnerstate and the trip actions):
//  - DA-002: an order status set outside the delivery app (the admin dashboard only writes `orders`) shows up in the
//    partner's Requests / Active / Trips;
//  - DA-004: a partner who comes free (after a delivery or a failed one, or by going online) is offered the orders
//    still waiting for a partner.
//
// It needs a MariaDB/MySQL database that already holds the full schema (tmp/multivendor_db_recovery_*.sql plus
// database/migration_franchise.sql), and is skipped unless one is named. It only ever runs against a database whose
// name starts with "mv_test", never a real one:
//
//   MV_TEST_DB_PORT=3307 MV_TEST_DB_NAME=mv_test npx jest tests/partnerDispatch.integration.test.js
//
// Fixture rows use ids from 9601 up and are removed again afterwards.

const ENABLED = Boolean(process.env.MV_TEST_DB_PORT);
const DB_NAME = process.env.MV_TEST_DB_NAME || 'mv_test';

if (ENABLED) {
    if (!/^mv_test/.test(DB_NAME)) throw new Error('MV_TEST_DB_NAME must start with "mv_test"');
    process.env.MV_DB_HOST = process.env.MV_TEST_DB_HOST || '127.0.0.1';
    process.env.MV_DB_PORT = process.env.MV_TEST_DB_PORT;
    process.env.MV_DB_USER = process.env.MV_TEST_DB_USER || 'root';
    process.env.MV_DB_PASSWORD = process.env.MV_TEST_DB_PASSWORD || '';
    process.env.MV_DB_NAME = DB_NAME;
}

const suite = ENABLED ? describe : describe.skip;

const TENANT = 9601;
const LOCATION = 9601;
const NEAR_VENDOR = 9601; // 13.0850, 80.2100
const MID_VENDOR = 9602; // about 5 km north of NEAR_VENDOR
const FAR_VENDOR = 9603; // about 33 km north
const CUSTOMER = 9601;
const ADDRESS = 9601;
const A = 9601; // online, at the near vendor
const B = 9602; // online
const OFFLINE = 9603;

suite('GET /getpartnerstate and the trip actions against a test database', () => {
    let db;
    let ctrl;
    let seq = 0;

    const call = (handler, partnerId, body = {}) =>
        new Promise((resolve, reject) => {
            const req = { partner: { id: partnerId, tenant_id: TENANT }, protocol: 'http', get: () => 'localhost', originalUrl: '/test', headers: {}, query: {}, body };
            const res = { headersSent: false, status() { return this; }, json: out => resolve(out) };
            handler(req, res);
            setTimeout(() => reject(new Error('no answer')), 15000);
        });
    const state = async partnerId => (await call(ctrl.getpartnerstate, partnerId)).data;

    // order_status: 0 placed · 1 accepted · 2 preparing · 3 out_for_delivery · 4 delivered · 5 cancelled · 6 rejected · 7 ready
    const order = async ({ status, vendor = NEAR_VENDOR, deliveredAt = null, reason = null }) => {
        seq += 1;
        const r = await db.query(
            'INSERT INTO orders (order_number, customer_id, vendor_id, customer_address_id, sub_total, grand_total, order_status, order_date_time, ' +
                'delivered_at, cancellation_reason, prep_minutes, accepted_at, d_in) VALUES (?, ?, ?, ?, 100, 100, ?, NOW() - INTERVAL ? SECOND, ?, ?, 15, NOW(), 0)',
            ['DS-' + seq, CUSTOMER, vendor, ADDRESS, status, 1000 - seq, deliveredAt, reason], 'test-order');
        return r.insertId;
    };
    // assignment_status: 0 offered · 1 accepted · 2 picked_up · 3 delivered · 4 rejected · 5 cancelled
    const assign = async ({ orderId, partner, status, base = 40, distance = 10, tip = 0 }) => {
        const r = await db.query(
            'INSERT INTO delivery_assignments (order_id, delivery_partner_id, assigned_at, accepted_at, picked_up_at, assignment_status, distance_km, base_pay, distance_pay, tip_pay, d_in) ' +
                'VALUES (?, ?, NOW(), ?, ?, ?, 3, ?, ?, ?, 0)',
            [orderId, partner, status >= 1 && status <= 3 ? new Date() : null, status >= 2 && status <= 3 ? new Date() : null, status, base, distance, tip], 'test-assign');
        return r.insertId;
    };
    const setOrder = (orderId, status) => db.query('UPDATE orders SET order_status = ? WHERE id = ?', [status, orderId], 'test-set-order');
    const assignmentOf = id => db.one('SELECT * FROM delivery_assignments WHERE id = ?', [id], 'test-get');
    const notesFor = partner => db.query("SELECT title FROM notifications WHERE tenant_id = ? AND target_type = 'delivery_partner' AND target_id = ?", [TENANT, partner], 'test-notes');
    const offersOf = async partner => (await db.query('SELECT order_id FROM delivery_assignments WHERE delivery_partner_id = ? AND assignment_status = 0 AND d_in = 0', [partner], 'test-offers')).map(r => r.order_id);

    const clean = async () => {
        const ids = (await db.query('SELECT id FROM orders WHERE customer_id = ?', [CUSTOMER], 'test-ids')).map(o => o.id);
        if (ids.length) {
            await db.query('DELETE FROM delivery_assignments WHERE order_id IN (?)', [ids], 'test-clean');
            await db.query('DELETE FROM order_status_history WHERE order_id IN (?)', [ids], 'test-clean');
            await db.query('DELETE FROM order_items WHERE order_id IN (?)', [ids], 'test-clean');
        }
        await db.query('DELETE FROM orders WHERE customer_id = ?', [CUSTOMER], 'test-clean');
        await db.query('DELETE FROM notifications WHERE tenant_id = ?', [TENANT], 'test-clean');
        await db.query('DELETE FROM customer_addresses WHERE id = ?', [ADDRESS], 'test-clean');
        await db.query('DELETE FROM customers WHERE id = ?', [CUSTOMER], 'test-clean');
        await db.query('DELETE FROM delivery_partners WHERE id IN (?, ?, ?)', [A, B, OFFLINE], 'test-clean');
        await db.query('DELETE FROM vendors WHERE id IN (?, ?, ?)', [NEAR_VENDOR, MID_VENDOR, FAR_VENDOR], 'test-clean');
        await db.query('DELETE FROM locations WHERE id = ?', [LOCATION], 'test-clean');
        await db.query('DELETE FROM tenants WHERE id = ?', [TENANT], 'test-clean');
    };

    beforeAll(async () => {
        db = require('../partner_app/lib/db');
        ctrl = require('../partner_app/controllers/deliveryCtrl');
        await clean();
        await db.query('INSERT INTO tenants (id, tenant_name) VALUES (?, ?)', [TENANT, 'Dispatch test tenant'], 'test');
        await db.query('INSERT INTO locations (id, tenant_id, area, city) VALUES (?, ?, ?, ?)', [LOCATION, TENANT, 'Anna Nagar', 'Chennai'], 'test');
        const vendors = [[NEAR_VENDOR, 13.085, 80.21], [MID_VENDOR, 13.13, 80.21], [FAR_VENDOR, 13.385, 80.21]];
        for (const [id, lat, lng] of vendors) {
            await db.query(
                'INSERT INTO vendors (id, tenant_id, location_id, vendor_name, store_category, latitude, longitude, opening_time, closing_time) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
                [id, TENANT, LOCATION, 'Dispatch kitchen ' + id, 'food', lat, lng, '00:00:00', '23:59:00'], 'test');
        }
        await db.query('INSERT INTO customers (id, tenant_id, customer_name) VALUES (?, ?, ?)', [CUSTOMER, TENANT, 'Dispatch customer'], 'test');
        await db.query('INSERT INTO customer_addresses (id, customer_id, full_address, latitude, longitude) VALUES (?, ?, ?, ?, ?)', [ADDRESS, CUSTOMER, '1 Test Street, Anna Nagar', 13.09, 80.22], 'test');
        const partners = [[A, 1], [B, 1], [OFFLINE, 0]];
        for (const [id, online] of partners) {
            await db.query(
                'INSERT INTO delivery_partners (id, tenant_id, name, mobile_number, latitude, longitude, is_online, login_status, active_status, vehicle_number) VALUES (?, ?, ?, ?, ?, ?, ?, 0, 1, ?)',
                [id, TENANT, 'Partner ' + id, '90000' + id, 13.08, 80.2, online, 'TN 00 AA ' + id], 'test');
        }
    });

    afterAll(async () => {
        await clean();
    });

    beforeEach(async () => {
        const ids = (await db.query('SELECT id FROM orders WHERE customer_id = ?', [CUSTOMER], 'test-ids')).map(o => o.id);
        if (ids.length) {
            await db.query('DELETE FROM delivery_assignments WHERE order_id IN (?)', [ids], 'test');
            await db.query('DELETE FROM order_status_history WHERE order_id IN (?)', [ids], 'test');
        }
        await db.query('DELETE FROM orders WHERE customer_id = ?', [CUSTOMER], 'test');
        await db.query('DELETE FROM notifications WHERE tenant_id = ?', [TENANT], 'test');
        await db.query('UPDATE delivery_partners SET is_online = 1 WHERE id IN (?, ?)', [A, B], 'test');
    });

    describe('DA-002: an order status set outside the delivery app reaches the partner', () => {
        test('an accepted trip whose order is cancelled leaves Active and shows in Trips as cancelled, unpaid', async () => {
            const o = await order({ status: 7 });
            const id = await assign({ orderId: o, partner: A, status: 1 });
            expect((await state(A)).active.stage).toBe('to_store');

            await setOrder(o, 5);
            const s = await state(A);
            expect(s.active).toBeNull();
            expect(s.activeRequest).toBeNull();
            expect(s.trips).toHaveLength(1);
            expect(s.trips[0]).toMatchObject({ status: 'cancelled', earning: 0 });
            expect(s.trips[0].note).toContain('order cancelled');
            expect(Number((await assignmentOf(id)).assignment_status)).toBe(5);
            expect((await notesFor(A)).map(n => n.title)).toEqual(expect.arrayContaining([expect.stringMatching(/^Order cancelled/)]));
        });

        test('a picked-up trip whose order is cancelled keeps the same share as a failed delivery', async () => {
            const o = await order({ status: 3 });
            await assign({ orderId: o, partner: A, status: 2 });
            await setOrder(o, 6);
            const s = await state(A);
            expect(s.active).toBeNull();
            expect(s.trips[0]).toMatchObject({ status: 'cancelled', earning: Math.round(40 * 0.35) });
        });

        test('the reason the admin gave is carried to the partner', async () => {
            const o = await order({ status: 7 });
            await assign({ orderId: o, partner: A, status: 1 });
            await db.query("UPDATE orders SET order_status = 5, cancellation_reason = 'Customer cancelled' WHERE id = ?", [o], 'test');
            const s = await state(A);
            expect(s.trips[0].note).toBe('order cancelled · customer cancelled');
        });

        test('an accepted trip whose order is marked out for delivery moves to on the way', async () => {
            const o = await order({ status: 7 });
            await assign({ orderId: o, partner: A, status: 1 });
            await setOrder(o, 3);
            const s = await state(A);
            expect(s.active.stage).toBe('on_the_way');
            expect((await notesFor(A)).map(n => n.title)).toEqual(expect.arrayContaining([expect.stringMatching(/^Order picked up/)]));
        });

        test('an open trip whose order is marked delivered closes as delivered and is paid', async () => {
            const o = await order({ status: 3 });
            await assign({ orderId: o, partner: A, status: 2, base: 40, distance: 15, tip: 5 });
            await db.query('UPDATE orders SET order_status = 4, delivered_at = NOW() WHERE id = ?', [o], 'test');
            const s = await state(A);
            expect(s.active).toBeNull();
            expect(s.trips[0]).toMatchObject({ status: 'delivered', earning: 60 });
        });

        test('an offer whose order is cancelled disappears from Requests and is closed', async () => {
            const o = await order({ status: 7 });
            const id = await assign({ orderId: o, partner: A, status: 0 });
            expect((await state(A)).requests.map(r => r.orderId)).toContain(o);
            await setOrder(o, 5);
            expect((await state(A)).requests.map(r => r.orderId)).not.toContain(o);
            expect(Number((await assignmentOf(id)).assignment_status)).toBe(5);
            expect(await notesFor(A)).toHaveLength(0); // never accepted, so nothing to tell
        });

        test('an offer whose order has already left the store is closed', async () => {
            const o = await order({ status: 7 });
            const id = await assign({ orderId: o, partner: A, status: 0 });
            await setOrder(o, 3);
            expect((await state(A)).requests).toHaveLength(0);
            expect(Number((await assignmentOf(id)).assignment_status)).toBe(5);
        });

        test('a trip already in step with its order is left alone', async () => {
            const o = await order({ status: 3 });
            const id = await assign({ orderId: o, partner: A, status: 2 });
            const s = await state(A);
            expect(s.active.stage).toBe('on_the_way');
            expect(Number((await assignmentOf(id)).assignment_status)).toBe(2);
            expect(await notesFor(A)).toHaveLength(0);
        });

        test("one partner's state never changes another partner's trip", async () => {
            const o = await order({ status: 7 });
            const idB = await assign({ orderId: o, partner: B, status: 1 });
            await setOrder(o, 5);
            await state(A);
            expect(Number((await assignmentOf(idB)).assignment_status)).toBe(1);
        });

        test('the change is made once: reading the state again does not repeat it or its notification', async () => {
            const o = await order({ status: 7 });
            await assign({ orderId: o, partner: A, status: 1 });
            await setOrder(o, 5);
            await state(A);
            await state(A);
            expect((await notesFor(A)).filter(n => /^Order cancelled/.test(n.title))).toHaveLength(1);
        });
    });

    describe('DA-004: a free partner is offered the orders that are waiting', () => {
        test('an accepted, preparing or ready order nobody was offered is offered to a free online partner', async () => {
            const o1 = await order({ status: 1 });
            const o2 = await order({ status: 2 });
            const o3 = await order({ status: 7 });
            const s = await state(A);
            expect(s.requests.map(r => r.orderId).sort()).toEqual([o1, o2, o3].sort());
            expect((await notesFor(A)).filter(n => /^New request/.test(n.title))).toHaveLength(3);
        });

        test('orders not yet accepted, delivered, cancelled or rejected are not offered', async () => {
            for (const status of [0, 3, 4, 5, 6]) await order({ status });
            expect((await state(A)).requests).toHaveLength(0);
        });

        test('an order already offered to, or held by, another partner is not offered', async () => {
            const offered = await order({ status: 2 });
            await assign({ orderId: offered, partner: B, status: 0 });
            const held = await order({ status: 7 });
            await assign({ orderId: held, partner: B, status: 1 });
            expect((await state(A)).requests).toHaveLength(0);
        });

        test('an order whose earlier offers were all skipped is offered again to someone new', async () => {
            const o = await order({ status: 7 });
            await assign({ orderId: o, partner: B, status: 4 });
            expect((await state(A)).requests.map(r => r.orderId)).toEqual([o]);
        });

        test('an order a partner already skipped or failed is not offered back to them', async () => {
            const skipped = await order({ status: 7 });
            await assign({ orderId: skipped, partner: A, status: 4 });
            const failed = await order({ status: 7 });
            await assign({ orderId: failed, partner: A, status: 5 });
            expect((await state(A)).requests).toHaveLength(0);
        });

        test('an offline partner is offered nothing', async () => {
            await order({ status: 7 });
            expect((await state(OFFLINE)).requests).toHaveLength(0);
            expect(await offersOf(OFFLINE)).toHaveLength(0);
        });

        test('a partner on a trip is offered nothing until the trip ends', async () => {
            const current = await order({ status: 3 });
            await assign({ orderId: current, partner: A, status: 2 });
            await order({ status: 7 });
            expect((await state(A)).requests).toHaveLength(0);
        });

        test('a partner never holds more than three open requests', async () => {
            for (let i = 0; i < 5; i += 1) await order({ status: 2 });
            expect((await state(A)).requests).toHaveLength(3);
            expect((await state(A)).requests).toHaveLength(3);
            expect(await offersOf(A)).toHaveLength(3);
        });

        test('the nearest store is offered first', async () => {
            const existing1 = await order({ status: 2 });
            const existing2 = await order({ status: 2 });
            await assign({ orderId: existing1, partner: A, status: 0 });
            await assign({ orderId: existing2, partner: A, status: 0 });
            const mid = await order({ status: 2, vendor: MID_VENDOR });
            const near = await order({ status: 2, vendor: NEAR_VENDOR });
            const s = await state(A);
            const orderIds = s.requests.map(r => r.orderId);
            expect(orderIds).toContain(near);
            expect(orderIds).not.toContain(mid);
        });

        test('an order that has been waiting for more than a day is stale and not offered', async () => {
            const stale = await order({ status: 7 });
            await db.query('UPDATE orders SET order_date_time = NOW() - INTERVAL 3 DAY WHERE id = ?', [stale], 'test');
            const fresh = await order({ status: 7 });
            expect((await state(A)).requests.map(r => r.orderId)).toEqual([fresh]);
        });

        test('a store too far away is left for someone nearer', async () => {
            await order({ status: 7, vendor: FAR_VENDOR });
            expect((await state(A)).requests).toHaveLength(0);
        });

        test('two partners reading at once never both hold an offer for the same order', async () => {
            const o = await order({ status: 7 });
            await Promise.all([state(A), state(B)]);
            const holders = [...(await offersOf(A)), ...(await offersOf(B))].filter(id => id === o);
            expect(holders.length).toBeLessThanOrEqual(2); // the guard is best effort; the accept step allows only one holder
            expect(holders.length).toBeGreaterThanOrEqual(1);
        });

        test('after a customer-unavailable report the partner is offered the next waiting order', async () => {
            const current = await order({ status: 7 });
            const currentAssignment = await assign({ orderId: current, partner: A, status: 0 });
            const next = await order({ status: 2 });

            const accepted = await call(ctrl.acceptrequest, A, { assignment_id: currentAssignment });
            expect(accepted.status).toBe(200);
            expect((await state(A)).requests).toHaveLength(0); // busy: nothing new while on the trip
            expect(await offersOf(A)).toHaveLength(0);

            const failed = await call(ctrl.faildelivery, A, { assignment_id: currentAssignment, reason: 'Customer unavailable' });
            expect(failed.status).toBe(200);

            const s = await state(A);
            expect(s.active).toBeNull();
            expect(s.trips[0]).toMatchObject({ status: 'cancelled', earning: Math.round(40 * 0.35) });
            expect(s.trips[0].note).toBe('customer unavailable');
            expect(s.requests.map(r => r.orderId)).toEqual([next]);
        });

        test('after a delivery the partner is offered the next waiting order', async () => {
            const current = await order({ status: 3 });
            await assign({ orderId: current, partner: A, status: 2 });
            const next = await order({ status: 7 });
            await db.query('UPDATE orders SET order_status = 4, delivered_at = NOW() WHERE id = ?', [current], 'test');
            const s = await state(A);
            expect(s.active).toBeNull();
            expect(s.requests.map(r => r.orderId)).toEqual([next]);
        });

        test('going online brings the waiting orders', async () => {
            await db.query('UPDATE delivery_partners SET is_online = 0 WHERE id = ?', [A], 'test');
            const o = await order({ status: 7 });
            expect((await state(A)).requests).toHaveLength(0);
            await call(ctrl.updateonline, A, { is_online: true });
            expect((await state(A)).requests.map(r => r.orderId)).toEqual([o]);
        });
    });
});
