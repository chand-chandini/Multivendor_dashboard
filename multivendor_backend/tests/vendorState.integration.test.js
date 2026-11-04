// Integration test for GET /getvendorstate: the Home "Today" card and mini-bars (VA-002) and the product
// carried by each order line (VA-001). It needs a MariaDB/MySQL database that already holds
// multivendor_saas_db.sql plus database/migration_partner_app_gaps.sql, and it is skipped unless one is
// named. It only ever runs against a database whose name starts with "mv_test", never a real one:
//
//   MV_TEST_DB_PORT=3307 MV_TEST_DB_NAME=mv_test npx jest tests/vendorState.integration.test.js
//
// Fixture rows use ids from 9001 up and are removed again afterwards.

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

const TENANT = 9001;
const VENDOR = 9001;
const OTHER_VENDOR = 9002;
const CUSTOMER = 9001;
const LOCATION = 9001;

// order_status: 0 placed · 1 accepted · 2 preparing · 3 out_for_delivery · 4 delivered · 5 cancelled · 6 rejected · 7 ready
const DELIVERED = 4;

suite('GET /getvendorstate against a test database', () => {
    let db;
    let ctrl;

    const run = async () => {
        const req = { partner: { id: VENDOR, tenant_id: TENANT }, protocol: 'http', get: () => 'localhost', originalUrl: '/getvendorstate', headers: {}, query: {}, body: {} };
        return new Promise((resolve, reject) => {
            const res = { headersSent: false, status() { return this; }, json: body => resolve(body) };
            ctrl.getvendorstate(req, res);
            setTimeout(() => reject(new Error('getvendorstate did not answer')), 15000);
        });
    };

    let orderSeq = 0;
    // `at` and `deliveredAt` are SQL expressions so the day boundaries follow the database's own clock.
    const order = async ({ status, total, at = 'NOW()', deliveredAt = 'NULL', vendor = VENDOR, deleted = 0, items = [] }) => {
        orderSeq += 1;
        const r = await db.query(
            'INSERT INTO orders (order_number, customer_id, vendor_id, sub_total, grand_total, order_status, order_date_time, delivered_at, d_in) ' +
                `VALUES (?, ?, ?, ?, ?, ?, ${at}, ${deliveredAt}, ?)`,
            ['T-' + orderSeq, CUSTOMER, vendor, total, total, status, deleted],
            'test-order');
        for (const variantId of items) {
            await db.query(
                'INSERT INTO order_items (order_id, product_variant_id, product_name_snapshot, quantity, unit_price, total_price) VALUES (?, ?, ?, 1, ?, ?)',
                [r.insertId, variantId, 'Snapshot name ' + variantId, total, total], 'test-item');
        }
        return r.insertId;
    };

    const clean = async () => {
        const ids = (await db.query('SELECT id FROM orders WHERE vendor_id IN (?, ?)', [VENDOR, OTHER_VENDOR], 'test-ids')).map(o => o.id);
        if (ids.length) await db.query('DELETE FROM order_items WHERE order_id IN (?)', [ids], 'test-clean');
        await db.query('DELETE FROM orders WHERE vendor_id IN (?, ?)', [VENDOR, OTHER_VENDOR], 'test-clean');
        await db.query('DELETE FROM product_images WHERE product_id BETWEEN 9101 AND 9199', [], 'test-clean');
        await db.query('DELETE FROM product_variants WHERE id BETWEEN 9201 AND 9299', [], 'test-clean');
        await db.query('DELETE FROM products WHERE id BETWEEN 9101 AND 9199', [], 'test-clean');
        await db.query('DELETE FROM vendors WHERE id IN (?, ?)', [VENDOR, OTHER_VENDOR], 'test-clean');
        await db.query('DELETE FROM customers WHERE id = ?', [CUSTOMER], 'test-clean');
        await db.query('DELETE FROM locations WHERE id = ?', [LOCATION], 'test-clean');
        await db.query('DELETE FROM tenants WHERE id = ?', [TENANT], 'test-clean');
    };

    beforeAll(async () => {
        db = require('../partner_app/lib/db');
        ctrl = require('../partner_app/controllers/vendorCtrl');
        await db.query('INSERT IGNORE INTO measurement_units (id, unit_name) VALUES (1, ?)', ['plate'], 'test-unit');
        await clean();
        await db.query('INSERT INTO tenants (id, tenant_name) VALUES (?, ?)', [TENANT, 'Test tenant'], 'test');
        await db.query('INSERT INTO locations (id, tenant_id, area, city) VALUES (?, ?, ?, ?)', [LOCATION, TENANT, 'Anna Nagar', 'Chennai'], 'test');
        for (const id of [VENDOR, OTHER_VENDOR]) {
            await db.query(
                'INSERT INTO vendors (id, tenant_id, location_id, vendor_name, store_category, opening_time, closing_time, commission_percentage) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
                [id, TENANT, LOCATION, 'Test kitchen ' + id, 'food', '09:00:00', '22:00:00', 10], 'test');
        }
        await db.query('INSERT INTO customers (id, tenant_id, customer_name) VALUES (?, ?, ?)', [CUSTOMER, TENANT, 'Test customer'], 'test');
        // 9101 has a photo, 9102 none, 9103 was renamed after the order, 9104 is soft-deleted but kept its photo.
        await db.query(
            'INSERT INTO products (id, vendor_id, category_id, product_name, is_veg, is_available, active_status, d_in) VALUES ' +
                "(9101, ?, 1, 'Photo dish', 1, 1, 1, 0), (9102, ?, 1, 'No photo dish', 1, 1, 1, 0), " +
                "(9103, ?, 1, 'Renamed dish (new name)', 1, 1, 1, 0), (9104, ?, 1, 'Removed dish', 1, 0, 0, 1)",
            [VENDOR, VENDOR, VENDOR, VENDOR], 'test');
        await db.query(
            'INSERT INTO product_variants (id, product_id, measurement_unit_id, variant_name, price, d_in) VALUES ' +
                "(9201, 9101, 1, 'Regular', 100, 0), (9202, 9102, 1, 'Regular', 100, 0), (9203, 9103, 1, 'Regular', 100, 0), (9204, 9104, 1, 'Regular', 100, 0)",
            [], 'test');
        await db.query(
            'INSERT INTO product_images (product_id, image_path, is_primary, d_in) VALUES ' +
                "(9101, '/uploads/partner_app/photo-dish.jpg', 1, 0), (9103, '/uploads/partner_app/renamed.jpg', 1, 0), " +
                "(9104, '/uploads/partner_app/removed.jpg', 1, 0), (9101, '/uploads/partner_app/second.jpg', 0, 0)",
            [], 'test');
    });

    afterAll(async () => {
        await clean();
        db.query('SELECT 1', [], 'noop').catch(() => {});
    });

    beforeEach(async () => {
        await db.query('DELETE FROM order_items WHERE order_id IN (SELECT id FROM orders WHERE vendor_id IN (?, ?))', [VENDOR, OTHER_VENDOR], 'test');
        await db.query('DELETE FROM orders WHERE vendor_id IN (?, ?)', [VENDOR, OTHER_VENDOR], 'test');
    });

    describe('Today card and mini-bars count delivered orders only', () => {
        test('undelivered, cancelled and rejected orders add nothing', async () => {
            for (const status of [0, 1, 2, 7, 3, 5, 6]) await order({ status, total: 999 });
            const { data } = await run();
            expect(data.today.amount).toBe(0);
            expect(data.today.orders).toBe(0);
            expect(data.today.avg).toBe(0);
            expect(data.dailySales.every(d => d.amount === 0)).toBe(true);
            expect(data.today.bars.every(b => b === 0.08)).toBe(true);
        });

        test('a delivered order counts in the card and in the last bar', async () => {
            await order({ status: DELIVERED, total: 100.5, deliveredAt: 'NOW()' });
            await order({ status: DELIVERED, total: 50.25, deliveredAt: 'NOW()' });
            for (const status of [0, 1, 2, 7, 3, 5, 6]) await order({ status, total: 999 });
            const { data } = await run();
            expect(data.today.orders).toBe(2);
            expect(data.today.amount).toBe(Math.round(150.75));
            expect(data.today.avg).toBe(Math.round(150.75 / 2));
            expect(data.dailySales[6].amount).toBe(Math.round(150.75));
            expect(data.today.bars[6]).toBe(1);
            expect(data.today.bars.slice(0, 6).every(b => b === 0.08)).toBe(true);
        });

        test('a delivered order counts for the day it was delivered, not the day it was placed', async () => {
            await order({ status: DELIVERED, total: 80, at: 'NOW() - INTERVAL 2 DAY', deliveredAt: 'NOW()' });
            const { data } = await run();
            expect(data.today.amount).toBe(80);
            expect(data.dailySales[6].amount).toBe(80);
            expect(data.dailySales[4].amount).toBe(0);
        });

        test('midnight boundaries: delivered at 00:00:00 today is today, 23:59:59 yesterday is not', async () => {
            await order({ status: DELIVERED, total: 10, deliveredAt: 'CURDATE()' });
            await order({ status: DELIVERED, total: 20, deliveredAt: 'CURDATE() - INTERVAL 1 SECOND' });
            const { data } = await run();
            expect(data.today.amount).toBe(10);
            expect(data.today.orders).toBe(1);
            expect(data.dailySales[6].amount).toBe(10);
            expect(data.dailySales[5].amount).toBe(20);
        });

        test('the bars cover the last seven days and no further back', async () => {
            await order({ status: DELIVERED, total: 200.25, deliveredAt: 'NOW() - INTERVAL 3 DAY' });
            await order({ status: DELIVERED, total: 70, deliveredAt: 'CURDATE() - INTERVAL 6 DAY' });
            await order({ status: DELIVERED, total: 500, deliveredAt: 'CURDATE() - INTERVAL 7 DAY' });
            const { data } = await run();
            expect(data.dailySales[3].amount).toBe(200);
            expect(data.dailySales[0].amount).toBe(70);
            expect(data.dailySales.reduce((s, d) => s + d.amount, 0)).toBe(270);
            expect(data.today.amount).toBe(0);
            // the biggest day fills its bar and the others scale against it
            expect(data.today.bars[3]).toBe(1);
            expect(data.today.bars[0]).toBeCloseTo(70 / 200.25, 2);
        });

        test('deleted orders and other vendors’ orders are left out', async () => {
            await order({ status: DELIVERED, total: 40, deliveredAt: 'NOW()', deleted: 1 });
            await order({ status: DELIVERED, total: 60, deliveredAt: 'NOW()', vendor: OTHER_VENDOR });
            await order({ status: DELIVERED, total: 25, deliveredAt: 'NOW()' });
            const { data } = await run();
            expect(data.today.amount).toBe(25);
            expect(data.today.orders).toBe(1);
        });

        test('the amount is the order grand total, so fees and discounts are already in it', async () => {
            const id = await order({ status: DELIVERED, total: 100, deliveredAt: 'NOW()' });
            await db.query('UPDATE orders SET sub_total = 90, grand_total = 123.4 WHERE id = ?', [id], 'test');
            const { data } = await run();
            expect(data.today.amount).toBe(123);
        });
    });

    describe('order lines carry the product', () => {
        const linesOf = async (data, id) => data.orders.find(o => o.orderId === id).lines;

        test('a line has the product id and the primary photo', async () => {
            const id = await order({ status: 0, total: 100, items: [9201] });
            const { data } = await run();
            const [line] = await linesOf(data, id);
            expect(line.productId).toBe('9101');
            expect(line.image).toBe('/uploads/partner_app/photo-dish.jpg');
        });

        test('a product with no photo has productId and a null image', async () => {
            const id = await order({ status: 0, total: 100, items: [9202] });
            const { data } = await run();
            const [line] = await linesOf(data, id);
            expect(line.productId).toBe('9102');
            expect(line.image).toBeNull();
        });

        test('a renamed product keeps its identity and photo, whatever the line snapshot says', async () => {
            const id = await order({ status: DELIVERED, total: 100, deliveredAt: 'NOW()', items: [9203] });
            const { data } = await run();
            const [line] = await linesOf(data, id);
            expect(line.name).toBe('Snapshot name 9203');
            expect(line.productId).toBe('9103');
            expect(line.image).toBe('/uploads/partner_app/renamed.jpg');
        });

        test('a removed product still shows on historical orders with its photo', async () => {
            const id = await order({ status: DELIVERED, total: 100, deliveredAt: 'NOW()', items: [9204] });
            const { data } = await run();
            const [line] = await linesOf(data, id);
            expect(line.productId).toBe('9104');
            expect(line.image).toBe('/uploads/partner_app/removed.jpg');
        });

        test('only the primary photo is used when a product has several', async () => {
            const id = await order({ status: 0, total: 100, items: [9201] });
            const { data } = await run();
            expect((await linesOf(data, id))[0].image).toBe('/uploads/partner_app/photo-dish.jpg');
        });

        test('an order with several lines gets each line its own photo', async () => {
            const id = await order({ status: 0, total: 100, items: [9201, 9202, 9203] });
            const { data } = await run();
            expect((await linesOf(data, id)).map(l => l.image)).toEqual([
                '/uploads/partner_app/photo-dish.jpg',
                null,
                '/uploads/partner_app/renamed.jpg',
            ]);
        });
    });
});
