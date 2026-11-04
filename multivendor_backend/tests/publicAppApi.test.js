const express = require('express');
const request = require('supertest');

jest.mock('../public_app/lib/db', () => ({
    one: jest.fn(),
    query: jest.fn(),
    transaction: jest.fn(),
}));

jest.mock('../public_app/lib/core', () => {
    const core = jest.requireActual('../public_app/lib/core');
    return {
        ...core,
        tenant: (req, res, next) => {
            req.tenant = { id: 7, tenant_unique_code: 'test-store', active_status: 1 };
            next();
        },
    };
});

jest.mock('../public_app/middleware/auth', () => ({
    required: (req, res, next) => {
        req.customer = { id: 12, tenant_id: 7, mobile_number: '9999999999' };
        next();
    },
}));

const db = require('../public_app/lib/db');
const app = express();
app.use(express.json());
app.use('/public_app', require('../public_app/routes/routes'));
const futureDate = (days = 2) => { const date = new Date(); date.setDate(date.getDate() + days); return date.toISOString().slice(0, 10); };

beforeEach(() => jest.clearAllMocks());

describe('customer app API flows', () => {
    test('bootstrap exposes tenant support contacts for customer profile actions', async () => {
        db.one
            .mockResolvedValueOnce({ currency_code: 'INR', currency_symbol: '₹', support_email: 'help@example.test', support_phone: '+911234567890', terms_url: 'https://example.test/terms', privacy_url: 'https://example.test/privacy' })
            .mockResolvedValueOnce({ logo: 'tenant-logo.png' });

        const response = await request(app).get('/public_app/bootstrap').expect(200);

        expect(response.body.data.settings).toEqual(expect.objectContaining({ support_email: 'help@example.test', support_phone: '+911234567890' }));
        expect(response.body.data.tenant.code).toBe('test-store');
    });

    test('app update content is read from the published tenant configuration', async () => {
        db.one.mockResolvedValueOnce({
            revision: 6,
            published_json: JSON.stringify({
                latestVersion: '2.4.1', releaseNotes: ['Faster checkout', 42],
                androidUrl: 'https://play.example/app', iosUrl: 'javascript:alert(1)',
            }),
        });

        const response = await request(app).get('/public_app/app-updates').expect(200);

        expect(response.body.data).toEqual({
            revision: 6, latestVersion: '2.4.1', releaseNotes: ['Faster checkout'],
            androidUrl: 'https://play.example/app', iosUrl: null,
        });
    });

    test('home vertical selection filters categories and restaurants from live catalogue data', async () => {
        db.one.mockResolvedValueOnce({ published_json: JSON.stringify({ tabs: [{ id: 'grocery', label: 'Grocery', imageUrl: 'public_app/banners/tab-grocery.png' }] }), revision: 3 });
        db.query
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([{ id: 33, category_name: 'Fresh Produce', category_image: null, vertical: 'grocery', category_order: 1, child_count: 2 }])
            .mockResolvedValueOnce([{ id: 77, vendor_name: 'Market 77', shop_image: null, average_rating: 4.5, rating_count: 12, has_veg: 1, has_non_veg: 0, is_best_seller: 0, is_online: 1, is_busy: 0, area: 'Central' }]);

        const response = await request(app).get('/public_app/home?vertical=grocery').expect(200);

        expect(response.body.data.categories).toEqual([expect.objectContaining({ id: '33', name: 'Fresh Produce', vertical: 'grocery' })]);
        expect(response.body.data.restaurants).toEqual([expect.objectContaining({ id: '77', name: 'Market 77' })]);
        expect(response.body.data.tabs).toEqual([expect.objectContaining({ id: 'grocery', imageUrl: expect.stringContaining('/uploads/public_app/banners/tab-grocery.png') })]);
        expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('AND c.vertical=?'), [7, 'grocery']);
        expect(db.query).toHaveBeenNthCalledWith(3, expect.stringContaining('pc.vertical=?'), [7, 7, 'grocery']);
    });

    test('public categories report only available children and preserve database ordering', async () => {
        db.query.mockResolvedValueOnce([
            { id: 11, category_name: 'Food', category_image: 'food.png', vertical: 'food', child_count: 2 },
            { id: 12, category_name: 'Grocery', category_image: null, vertical: 'grocery', child_count: 0 },
        ]);

        const response = await request(app).get('/public_app/categories').expect(200);

        expect(response.body.data).toEqual([
            expect.objectContaining({ id: '11', name: 'Food', childCount: 2, hasChildren: true, imageUrl: expect.stringContaining('/uploads/food.png') }),
            expect.objectContaining({ id: '12', name: 'Grocery', childCount: 0, hasChildren: false }),
        ]);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('ch.tenant_id=c.tenant_id AND ch.d_in=0 AND ch.is_active=1'), [7]);
    });

    test('subcategories remain scoped to the selected active parent and tenant', async () => {
        db.one.mockResolvedValueOnce({ id: 11 });
        db.query.mockResolvedValueOnce([
            { id: 21, category_name: 'Biryani', category_image: null, vertical: 'food' },
        ]);

        const response = await request(app).get('/public_app/categories/11/subcategories').expect(200);

        expect(response.body.data).toEqual([{ id: '21', parentId: '11', name: 'Biryani', imageUrl: null, vertical: 'food' }]);
        expect(db.one).toHaveBeenCalledWith(expect.stringContaining('parent_id IS NULL AND d_in=0 AND is_active=1'), [11, 7]);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('parent_id=? AND tenant_id=? AND d_in=0 AND is_active=1'), [11, 7]);

        db.one.mockResolvedValueOnce(null);
        await request(app).get('/public_app/categories/12/subcategories').expect(404);
        expect(db.query).toHaveBeenCalledTimes(1);
    });

    test('category API returns an empty list and handles database failures', async () => {
        db.query.mockResolvedValueOnce([]).mockRejectedValueOnce(new Error('Database unavailable'));

        expect((await request(app).get('/public_app/categories').expect(200)).body.data).toEqual([]);
        expect((await request(app).get('/public_app/categories').expect(500)).body.error.code).toBe('SERVER_ERROR');
    });

    test('product promotion banners include the tenant restaurant needed to open the item', async () => {
        db.query.mockResolvedValueOnce([{
            id: 12, banner_image: 'promo.jpg', link_type: 'product', product_id: 5,
            product_vendor_id: 70, placement: 'home_promo', aspect_ratio: 1.8,
        }]);

        const response = await request(app).get('/public_app/banners?placement=home_promo').expect(200);

        expect(response.body.data[0].target).toEqual({ type: 'product', productId: '5', restaurantId: '70' });
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('bpv.tenant_id=b.tenant_id'), [7, 'home_promo', null]);
    });

    test('published home banners expose public media URLs when catalogue banners are empty', async () => {
        db.one.mockResolvedValueOnce({
            published_json: JSON.stringify({
                headerBanners: [{ id: 'header-1', imageUrl: 'public_app/banners/header.png', altText: 'Header' }],
                banners: [{ id: 'promo-1', imageUrl: 'public_app/banners/promo.png', altText: 'Promo' }],
            }),
            revision: 4,
        });
        db.query
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce([]);

        const response = await request(app).get('/public_app/home').expect(200);

        expect(response.body.data.headerBanners[0].imageUrl).toContain('/uploads/public_app/banners/header.png');
        expect(response.body.data.banners[0].imageUrl).toContain('/uploads/public_app/banners/promo.png');
    });

    test('order history includes persisted item names and delivery address summaries', async () => {
        db.query
            .mockResolvedValueOnce([{
                id: 91, order_number: 'ORD-91', vendor_id: 8, vendor_name: 'Cafe Eight', shop_image: null,
                grand_total: 480, item_count: 3, order_status: 4, payment_type: 'cod', order_date_time: '2026-10-05 12:00:00',
                address_snapshot: JSON.stringify({ label: 'Home', line: '12 Lake Road' }),
            }])
            .mockResolvedValueOnce([
                { order_id: 91, product_name_snapshot: 'Paneer Roll', quantity: 2 },
                { order_id: 91, product_name_snapshot: 'Lime Soda', quantity: 1 },
            ]);

        const response = await request(app).get('/public_app/me/orders').expect(200);

        expect(response.body.data[0]).toEqual(expect.objectContaining({
            id: '91', orderNumber: 'ORD-91', addressLabel: 'Home', addressLine: '12 Lake Road',
            items: [{ name: 'Paneer Roll', quantity: 2 }, { name: 'Lime Soda', quantity: 1 }],
        }));
        expect(db.query).toHaveBeenNthCalledWith(2, expect.stringContaining('FROM order_items'), [91]);
    });

    test('order detail includes current product image and review aggregates', async () => {
        db.one
            .mockResolvedValueOnce({
                id: 91, order_number: 'ORD-91', vendor_id: 8, vendor_name: 'Cafe Eight', order_status: 4,
                address_snapshot: JSON.stringify({ line: '12 Lake Road' }), bill_snapshot: JSON.stringify({ subtotal: 120, total: 120 }),
                grand_total: 120, sub_total: 120,
            })
            .mockResolvedValueOnce({ rating: 5, review_text: 'Great' });
        db.query.mockResolvedValueOnce([{
            id: 501, product_variant_id: 81, product_id: 5, product_name_snapshot: 'Paneer Roll', quantity: 1,
            unit_price: 120, total_price: 120, image_path: 'products/paneer-roll.jpg', average_rating: 4.5, rating_count: 6,
        }]);

        const response = await request(app).get('/public_app/orders/91').expect(200);

        expect(db.one).toHaveBeenNthCalledWith(1, expect.stringContaining('v.vendor_mobile_number AS restaurant_phone'), [91, 12]);
        expect(response.body.data.items[0]).toEqual(expect.objectContaining({
            name: 'Paneer Roll', imageUrl: expect.stringContaining('products/paneer-roll.jpg'), rating: 4.5, ratingCount: 6,
        }));
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('product_images'), [91]);
    });

    test('restaurant menu returns active variant prices and stock from the catalogue', async () => {
        db.one.mockResolvedValueOnce({ id: 70 });
        db.query
            .mockResolvedValueOnce([
                { id: 5, product_name: 'Biryani', description: 'Family meal', base_price: 220, discount_price: 200, stock_quantity: 10, is_veg: 0, is_featured: 1, category_id: 3, category_name: 'Meals', image_path: null },
            ])
            .mockResolvedValueOnce([
                { id: 81, product_id: 5, variant_name: 'Regular', quantity_value: 1, price: 220, discount_price: 200, stock_quantity: 4, is_default: 1 },
                { id: 82, product_id: 5, variant_name: 'Family', quantity_value: 2, price: 400, discount_price: 360, stock_quantity: 2, is_default: 0 },
            ])
            .mockResolvedValueOnce([{ product_id: 5, average_rating: 4.75, rating_count: 8 }]);

        const response = await request(app).get('/public_app/restaurants/70/menu').expect(200);

        expect(response.body.data.sections[0].items[0]).toEqual(expect.objectContaining({
            id: '5', name: 'Biryani', pricePaise: 20000, rating: 4.75, ratingCount: 8, isBestSeller: true,
            variants: [
                expect.objectContaining({ id: '81', name: 'Regular', pricePaise: 20000, stockQuantity: 4, isDefault: true }),
                expect.objectContaining({ id: '82', name: 'Family', pricePaise: 36000, stockQuantity: 2, isDefault: false }),
            ],
        }));
    });

    test('cart addition rejects non-integer quantities before database access', async () => {
        const response = await request(app)
            .post('/public_app/me/cart/items')
            .send({ restaurantId: '70', productVariantId: '81', quantity: 1.5 })
            .expect(400);

        expect(response.body.error.code).toBe('INVALID_QUANTITY');
        expect(db.one).not.toHaveBeenCalled();
    });

    test('cart addition enforces remaining stock including the existing cart quantity', async () => {
        db.one
            .mockResolvedValueOnce({ id: 81, product_id: 5, price: 220, discount_price: 200, stock_quantity: 2, vendor_id: 70 })
            .mockResolvedValueOnce({ id: 60, vendor_id: 70 })
            .mockResolvedValueOnce({ id: 90, quantity: 1 });

        const response = await request(app)
            .post('/public_app/me/cart/items')
            .send({ restaurantId: '70', productVariantId: '81', quantity: 2 })
            .expect(409);

        expect(response.body.error.code).toBe('INSUFFICIENT_STOCK');
        expect(db.query).not.toHaveBeenCalled();
    });

    test('product favourites are tenant scoped and returned with live catalogue details', async () => {
        db.query.mockResolvedValueOnce([
            { target_id: 55, product_name: 'Biryani', base_price: 220, discount_price: 200, image_path: null, vendor_id: 70, vendor_name: 'Kitchen' },
        ]);

        const response = await request(app).get('/public_app/me/favourites?type=product').expect(200);

        expect(response.body.data).toEqual([
            { id: '55', type: 'product', name: 'Biryani', restaurantId: '70', restaurantName: 'Kitchen', pricePaise: 20000, imageUrl: null },
        ]);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('v.tenant_id=?'), [7, 12]);
    });

    test('saving a product favourite validates its restaurant tenant', async () => {
        db.one.mockResolvedValueOnce({ id: 55 });
        db.query.mockResolvedValueOnce({ affectedRows: 1 });

        await request(app).put('/public_app/me/favourites/product/55').send({}).expect(200);

        expect(db.one).toHaveBeenCalledWith(expect.stringContaining('v.tenant_id=?'), [55, 7]);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO customer_favorites'), [12, 55, 12, 55]);
    });

    test('saving a product from another tenant is rejected', async () => {
        db.one.mockResolvedValueOnce(null);

        const response = await request(app).put('/public_app/me/favourites/product/55').send({}).expect(404);

        expect(response.body.error.code).toBe('TARGET_NOT_FOUND');
        expect(db.query).not.toHaveBeenCalled();
    });

    test('delivery slot lookup returns only available slots for the active cart restaurant', async () => {
        const date = futureDate();
        db.one
            .mockResolvedValueOnce({ published_json: JSON.stringify({ scheduling: { enabled: true, advanceDays: 7 } }) })
            .mockResolvedValueOnce({ id: 60, vendor_id: 70 });
        db.query.mockResolvedValueOnce([
            { id: 31, slot_label: '10 AM – 12 PM', start_time: '10:00:00', end_time: '12:00:00', max_orders: 5, booked_orders: 2 },
            { id: 32, slot_label: '12 PM – 2 PM', start_time: '12:00:00', end_time: '14:00:00', max_orders: 2, booked_orders: 2 },
        ]);

        const response = await request(app).get(`/public_app/me/delivery-slots?date=${date}`).expect(200);

        expect(response.body.data).toEqual({ date, slots: [{ id: '31', label: '10 AM – 12 PM', startTime: '10:00:00', endTime: '12:00:00', remainingOrders: 3 }] });
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('s.vendor_id=?'), [date, 70, date, date]);
    });

    test('delivery slot lookup rejects dates outside the configured booking window', async () => {
        db.one.mockResolvedValueOnce({ published_json: JSON.stringify({ scheduling: { enabled: true, advanceDays: 2 } }) });
        const date = futureDate(4);

        const response = await request(app).get(`/public_app/me/delivery-slots?date=${date}`).expect(400);

        expect(response.body.error.code).toBe('DELIVERY_DATE_UNAVAILABLE');
        expect(db.query).not.toHaveBeenCalled();
    });

    test('checkout exposes tenant-published scheduling settings', async () => {
        db.one
            .mockResolvedValueOnce({ cod_enabled: 1 })
            .mockResolvedValueOnce({ revision: 9, published_json: JSON.stringify({ scheduling: { enabled: true, advanceDays: 5 }, deliveryInstructions: [], tipOptions: [{ id: 'tip-25', amount: 25, emoji: '🌟' }] }) });

        const response = await request(app).get('/public_app/checkout/config').expect(200);

        expect(response.body.data.scheduling).toEqual({ enabled: true, advanceDays: 5 });
        expect(response.body.data.tipOptions).toEqual([{ id: 'tip-25', amount: 25, emoji: '🌟' }]);
    });

    test('order placement rechecks slot capacity before creating a scheduled order', async () => {
        const date = futureDate();
        db.one
            .mockResolvedValueOnce({ published_json: JSON.stringify({ scheduling: { enabled: true, advanceDays: 7 } }) })
            .mockResolvedValueOnce({ cod_enabled: 1 })
            .mockResolvedValueOnce({ id: 45, location_id: null })
            .mockResolvedValueOnce({ id: 60, vendor_id: 70 })
            .mockResolvedValueOnce({ location_id: null })
            .mockResolvedValueOnce({ id: 31, start_time: '10:00:00', max_orders: 2 })
            .mockResolvedValueOnce({ booked_orders: 2 });

        const response = await request(app)
            .post('/public_app/orders')
            .send({ addressId: '45', paymentType: 'cod', scheduledDate: date, deliverySlotId: '31' })
            .expect(409);

        expect(response.body.error.code).toBe('DELIVERY_SLOT_FULL');
        expect(db.transaction).not.toHaveBeenCalled();
        expect(db.query).not.toHaveBeenCalled();
    });

    test('order placement stores the selected delivery slot and scheduled time', async () => {
        const date = futureDate();
        db.one
            .mockResolvedValueOnce({ published_json: JSON.stringify({ scheduling: { enabled: true, advanceDays: 7 } }) })
            .mockResolvedValueOnce({ cod_enabled: 1 })
            .mockResolvedValueOnce({ id: 45, location_id: null, address_label: 'home', full_address: 'Street 1' })
            .mockResolvedValueOnce({ id: 60, vendor_id: 70 })
            .mockResolvedValueOnce({ location_id: null })
            .mockResolvedValueOnce({ id: 31, start_time: '10:00:00', max_orders: 10 })
            .mockResolvedValueOnce({ booked_orders: 1 })
            .mockResolvedValueOnce({ handling_charge: 0, packing_charge: 0, donation_charge: 0, rain_surge_active: 0 });
        db.query.mockResolvedValueOnce([{ product_variant_id: 81, quantity: 1, discount_price: 10, price: 10, product_name: 'Biryani', vendor_id: 70, stock_quantity: 5, variant_active: 1, variant_deleted: 0, product_active: 1, product_deleted: 0, is_available: 1 }]);
        const transactionQuery = jest.fn()
            .mockResolvedValueOnce([{ id: 31, start_time: '10:00:00', max_orders: 10 }])
            .mockResolvedValueOnce([{ booked_orders: 1 }])
            .mockResolvedValueOnce({ insertId: 77 })
            .mockResolvedValueOnce({})
            .mockResolvedValueOnce({});
        db.transaction.mockImplementationOnce(work => work(transactionQuery));

        const response = await request(app)
            .post('/public_app/orders')
            .send({ addressId: '45', paymentType: 'cod', scheduledDate: date, deliverySlotId: '31' })
            .expect(200);

        expect(response.body.data.scheduledFor).toBe(`${date} 10:00:00`);
        expect(transactionQuery.mock.calls[2][0]).toContain('delivery_slot_id,scheduled_for');
        expect(transactionQuery.mock.calls[2][1]).toEqual(expect.arrayContaining([31, `${date} 10:00:00`]));
    });

    test('notifications are scoped to the tenant and customer and map unread state', async () => {
        db.query.mockResolvedValueOnce([
            { id: 14, title: 'Order update', message: 'Your order is on the way', notification_type: 'order', sent_at: '2026-10-05 10:00:00', is_read: 0 },
        ]);

        const response = await request(app).get('/public_app/me/notifications').expect(200);

        expect(response.body.data).toEqual([
            { id: '14', title: 'Order update', message: 'Your order is on the way', type: 'order', createdAt: '2026-10-05 10:00:00', read: false },
        ]);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining("n.tenant_id=?"), [12, 7, 12]);
    });

    test('marking notifications read creates customer-specific receipts', async () => {
        db.query.mockResolvedValueOnce({ affectedRows: 2 });

        const response = await request(app).post('/public_app/me/notifications/read').send({}).expect(200);

        expect(response.body.data).toEqual({ updated: 2 });
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO public_notification_receipts'), [12, 7, 12]);
    });

    test('location search returns live service areas and preserves missing coordinates as null', async () => {
        db.query.mockResolvedValueOnce([
            { id: 31, city: 'Hyderabad', area: 'Madhapur', pincode: '500081', latitude: null, longitude: null, max_delivery_service_km: 8 },
        ]);

        const response = await request(app).get('/public_app/locations?q=Madhapur').expect(200);

        expect(response.body.data).toEqual([
            expect.objectContaining({ id: '31', area: 'Madhapur', latitude: null, longitude: null }),
        ]);
        expect(db.query).toHaveBeenCalledWith(expect.stringContaining('l.area LIKE ?'), [7, '%Madhapur%', '%Madhapur%', '%Madhapur%']);
    });

    test('address creation rejects a service area that is inactive or belongs to another tenant', async () => {
        db.one.mockResolvedValueOnce(null);

        const response = await request(app)
            .post('/public_app/me/addresses')
            .send({ fullAddress: 'Street 1, Madhapur', locationId: '99' })
            .expect(400);

        expect(response.body.error.code).toBe('LOCATION_INVALID');
        expect(db.transaction).not.toHaveBeenCalled();
    });

    test('address creation stores the selected location and recipient details', async () => {
        db.one.mockResolvedValueOnce({ id: 31 });
        const query = jest.fn()
            .mockResolvedValueOnce({ affectedRows: 1 })
            .mockResolvedValueOnce({ insertId: 45 });
        db.transaction.mockImplementationOnce(work => work(query));

        const response = await request(app)
            .post('/public_app/me/addresses')
            .send({ fullAddress: 'Street 1, Madhapur', locationId: '31', recipientName: 'Asha', recipientPhone: '9999999999', isDefault: true })
            .expect(200);

        expect(response.body.data.id).toBe('45');
        expect(query).toHaveBeenCalledWith(expect.stringContaining('location_id'), expect.arrayContaining([12, 'home', 'Street 1, Madhapur', 31, 1, 'Asha', '9999999999']));
    });

    test('order placement rejects a saved address whose delivery area is no longer active', async () => {
        db.one
            .mockResolvedValueOnce({ cod_enabled: 1 })
            .mockResolvedValueOnce({ id: 45, location_id: 31 })
            .mockResolvedValueOnce(null);

        const response = await request(app)
            .post('/public_app/orders')
            .send({ addressId: '45', paymentType: 'cod' })
            .expect(409);

        expect(response.body.error.code).toBe('ADDRESS_NOT_SERVICEABLE');
        expect(db.one).toHaveBeenCalledTimes(3);
        expect(db.query).not.toHaveBeenCalled();
    });

    test('order placement rejects a restaurant outside the saved address service area', async () => {
        db.one
            .mockResolvedValueOnce({ cod_enabled: 1 })
            .mockResolvedValueOnce({ id: 45, location_id: 31 })
            .mockResolvedValueOnce({ id: 31 })
            .mockResolvedValueOnce({ id: 70, vendor_id: 8 })
            .mockResolvedValueOnce({ location_id: 32 });

        const response = await request(app)
            .post('/public_app/orders')
            .send({ addressId: '45', paymentType: 'cod' })
            .expect(409);

        expect(response.body.error.code).toBe('RESTAURANT_NOT_SERVICEABLE');
        expect(db.query).not.toHaveBeenCalled();
    });

    test('order review is saved only after delivery', async () => {
        db.one.mockResolvedValueOnce({ id: 81, vendor_id: 4, order_status: 4 });
        const query = jest.fn()
            .mockResolvedValueOnce([])
            .mockResolvedValueOnce({ insertId: 14 });
        db.transaction.mockImplementationOnce(work => work(query));

        const response = await request(app)
            .post('/public_app/orders/81/review')
            .send({ rating: 5, comment: 'Great food' })
            .expect(200);

        expect(response.body.data).toEqual({ orderId: '81', rating: 5, comment: 'Great food' });
        expect(query).toHaveBeenLastCalledWith(expect.stringContaining('INSERT INTO reviews'), [81, 12, 4, 5, 'Great food']);
    });

    test('order review rejects undelivered orders and invalid ratings', async () => {
        const ratingResponse = await request(app)
            .post('/public_app/orders/81/review')
            .send({ rating: 6, comment: '' })
            .expect(400);
        expect(ratingResponse.body.error.code).toBe('INVALID_RATING');

        db.one.mockResolvedValueOnce({ id: 81, vendor_id: 4, order_status: 2 });
        const orderResponse = await request(app)
            .post('/public_app/orders/81/review')
            .send({ rating: 4, comment: '' })
            .expect(409);
        expect(orderResponse.body.error.code).toBe('ORDER_NOT_DELIVERED');
        expect(db.transaction).not.toHaveBeenCalled();
    });
});

describe('admin-created item purchase safeguards', () => {
    test.each([-1, 'bad', null])('cart rejects invalid catalogue price %s before creating a cart', async price => {
        db.one.mockResolvedValueOnce({ id: 81, product_id: 5, price, discount_price: null, stock_quantity: 3, vendor_id: 70 });
        const response = await request(app).post('/public_app/me/cart/items').send({ restaurantId: '70', productId: '5', quantity: 1 }).expect(409);
        expect(response.body.error.code).toBe('INVALID_PRICE');
        expect(db.transaction).not.toHaveBeenCalled();
        expect(db.query).not.toHaveBeenCalled();
    });

    test.each([
        [{ variant_active: 0 }, 'PRODUCT_UNAVAILABLE'],
        [{ product_active: 0 }, 'PRODUCT_UNAVAILABLE'],
        [{ is_available: 0 }, 'PRODUCT_UNAVAILABLE'],
        [{ product_deleted: 1 }, 'PRODUCT_UNAVAILABLE'],
        [{ vendor_id: 71 }, 'PRODUCT_UNAVAILABLE'],
        [{ stock_quantity: 0 }, 'INSUFFICIENT_STOCK'],
        [{ price: -1, discount_price: null }, 'INVALID_PRICE'],
        [{ price: 10, discount_price: 11 }, 'INVALID_PRICE'],
    ])('checkout rejects changed catalogue state %j', async (change, code) => {
        db.one.mockResolvedValueOnce({ cod_enabled: 1 })
            .mockResolvedValueOnce({ id: 45, location_id: null })
            .mockResolvedValueOnce({ id: 60, vendor_id: 70 })
            .mockResolvedValueOnce({ location_id: null });
        db.query.mockResolvedValueOnce([{ product_variant_id: 81, quantity: 1, price: 10, discount_price: null, product_name: 'Item', vendor_id: 70, stock_quantity: 5, variant_active: 1, variant_deleted: 0, product_active: 1, product_deleted: 0, is_available: 1, ...change }]);
        const response = await request(app).post('/public_app/orders').send({ addressId: '45', paymentType: 'cod' }).expect(409);
        expect(response.body.error.code).toBe(code);
        expect(db.transaction).not.toHaveBeenCalled();
    });
});
