// Partner App - vendor workspace (store, orders, menu, earnings, coupons).
// GET /getvendorstate returns everything the vendor screens render; each action
// returns { status, message } and the app refetches the state.

var db = require('../lib/db');
var fmt = require('../lib/format');
var notifications = require('../lib/notifications');
var branding = require('../lib/branding');
var prefs = require('../lib/prefs');
var history = require('../lib/orderHistory');
var upload = require('../middleware/upload');

var ITEM_NOUN = { food: 'dish', grocery: 'product', produce: 'item', bakery: 'item', meat: 'cut' };

async function vendorFor(req) {
    return db.one(
        'SELECT v.*, l.area AS location_area FROM vendors v LEFT JOIN locations l ON l.id = v.location_id ' +
        'WHERE v.id = ? AND v.tenant_id = ? AND v.d_in = 0', [req.partner.id, req.partner.tenant_id], 'vendor-self');
}

function withVendor(fn) {
    return db.handle(async function (req, res) {
        var vendor = await vendorFor(req);
        if (!vendor) return res.status(401).json({ status: 401, message: 'Vendor account not found' });
        return fn(req, res, vendor);
    });
}

// The store's picture (vendors.shop_image) as an address the app can fetch. The dashboard
// stores a full URL in production and /uploads/<file> locally. A base64 data URI is left
// out: this state is polled, and it would ride along on every refresh.
function logoUrl(stored, req) {
    var value = String(stored || '').trim();
    if (!value || /^data:/i.test(value)) return null;
    if (/^https?:\/\//i.test(value)) return value;
    return req.protocol + '://' + req.get('host') + '/' + value.replace(/^\/+/, '');
}

// ─── Orders ──────────────────────────────────────────────────────────────────

async function loadOrders(vendor) {
    var rows = await db.query(
        'SELECT o.*, c.customer_name, c.mobile_number AS customer_phone, a.full_address, a.latitude AS a_lat, a.longitude AS a_lng ' +
        'FROM orders o LEFT JOIN customers c ON c.id = o.customer_id LEFT JOIN customer_addresses a ON a.id = o.customer_address_id ' +
        'WHERE o.vendor_id = ? AND o.d_in = 0 AND (o.order_status IN (0,1,2,7) OR o.order_date_time >= NOW() - INTERVAL 1 DAY) ' +
        'ORDER BY o.order_date_time DESC LIMIT 100', [vendor.id], 'vendor-orders');
    if (!rows.length) return [];

    var ids = rows.map(function (r) { return r.id; });
    var items = await db.query(
        'SELECT oi.id, oi.order_id, oi.product_name_snapshot, oi.quantity, oi.total_price, pv.variant_name, pv.product_id, p.is_veg ' +
        'FROM order_items oi LEFT JOIN product_variants pv ON pv.id = oi.product_variant_id LEFT JOIN products p ON p.id = pv.product_id ' +
        'WHERE oi.order_id IN (?) AND oi.d_in = 0 ORDER BY oi.id', [ids], 'vendor-order-items');
    var itemIds = items.map(function (i) { return i.id; });
    // The line's product comes from its variant, so it stays the same dish when the product is renamed or
    // later removed (soft delete); the photo is the product's primary one, as the menu shows it.
    var productIds = items.map(function (i) { return i.product_id; }).filter(function (id, n, all) { return id && all.indexOf(id) === n; });
    var photos = productIds.length ? await db.query(
        'SELECT product_id, image_path FROM product_images WHERE product_id IN (?) AND is_primary = 1 AND d_in = 0 ORDER BY id',
        [productIds], 'vendor-order-photos') : [];
    var options = itemIds.length ? await db.query(
        'SELECT order_item_id, addon_name_snapshot FROM order_item_options WHERE order_item_id IN (?) AND d_in = 0',
        [itemIds], 'vendor-order-options') : [];
    var partners = await db.query(
        'SELECT da.order_id, da.assignment_status, da.arrived_store_at, dp.name, dp.vehicle_number, dp.rating ' +
        'FROM delivery_assignments da JOIN delivery_partners dp ON dp.id = da.delivery_partner_id ' +
        'WHERE da.order_id IN (?) AND da.assignment_status IN (1,2,3) AND da.d_in = 0', [ids], 'vendor-order-partners');

    var commission = fmt.num(vendor.commission_percentage) / 100;

    return rows.map(function (r) {
        var status = fmt.orderStatus(r.order_status);
        var a = partners.find(function (p) { return p.order_id === r.id; });
        var reason = r.cancellation_reason ? String(r.cancellation_reason).toLowerCase() : '';
        var closeNote;
        if (status === 'cancelled') closeNote = 'Cancelled' + (reason ? ' · ' + reason : '');
        if (status === 'rejected') closeNote = 'Rejected' + (reason ? ' · ' + reason : '');
        if (status === 'picked_up' && a) closeNote = 'Picked up · ' + a.name;

        return {
            orderId: r.id,
            id: r.order_number || String(r.id),
            status: status,
            placedAt: fmt.ms(r.order_date_time),
            lines: items.filter(function (i) { return i.order_id === r.id; }).map(function (i) {
                var opts = options.filter(function (o) { return o.order_item_id === i.id; }).map(function (o) { return o.addon_name_snapshot; });
                var photo = photos.find(function (ph) { return ph.product_id === i.product_id; });
                return {
                    productId: i.product_id ? String(i.product_id) : undefined,
                    image: photo ? photo.image_path : null,
                    name: i.product_name_snapshot,
                    qty: fmt.num(i.quantity),
                    variant: i.variant_name || undefined,
                    options: opts.length ? opts.join(' · ') : undefined,
                    veg: Number(i.is_veg) === 1,
                    price: fmt.num(i.total_price)
                };
            }),
            itemTotal: fmt.num(r.sub_total),
            packing: fmt.num(r.packing_charges),
            gst: fmt.num(r.tax_amount),
            coupon: fmt.num(r.discount_amount) > 0 ? { code: r.coupon_code || 'Discount', amount: fmt.num(r.discount_amount) } : undefined,
            total: fmt.num(r.grand_total),
            payout: Math.round(fmt.num(r.sub_total) * (1 - commission) + fmt.num(r.packing_charges)),
            payment: r.payment_type === 'cod' ? 'cod' : 'prepaid',
            refunded: (status === 'cancelled' || status === 'rejected') && r.payment_type !== 'cod',
            customer: {
                name: r.customer_name || 'Customer',
                phone: r.customer_phone ? String(r.customer_phone).replace(/[^0-9+]/g, '') : undefined,
                area: fmt.areaFrom(r.full_address),
                distanceKm: fmt.km(vendor.latitude, vendor.longitude, r.a_lat, r.a_lng)
            },
            note: r.order_instructions || undefined,
            prepMinutes: r.prep_minutes === null ? undefined : fmt.num(r.prep_minutes),
            acceptedAt: fmt.ms(r.accepted_at),
            readyAt: fmt.ms(r.ready_at),
            partner: a ? {
                name: a.name,
                initials: fmt.initials(a.name),
                vehicle: a.vehicle_number || '',
                rating: fmt.num(a.rating),
                atCounter: Number(a.assignment_status) === 1 && Boolean(a.arrived_store_at)
            } : undefined,
            handoverCode: r.handover_code || undefined,
            parcels: fmt.num(r.parcel_count, 1) || 1,
            closedAt: fmt.ms(r.delivered_at || r.cancelled_at || r.picked_up_at),
            closeNote: closeNote
        };
    });
}

// ─── Products ────────────────────────────────────────────────────────────────

function shortVariant(name) {
    return String(name).replace(/ plate$/i, '');
}

function productJson(p, variants, addons, storeCategory, image) {
    var attrs = fmt.parseJson(p.attributes_json);
    var isSub = p.parent_id !== null && p.parent_id !== undefined && Boolean(p.category_name);
    var available = Number(p.is_available) === 1;
    var stock = fmt.num(p.stock_quantity);
    var prep = fmt.num(p.prep_minutes, 15) || 15;
    var base = {
        id: String(p.id),
        category: storeCategory,
        name: p.product_name,
        // A product points at one categories row: a top-level category, or a sub
        // category whose parent_id is the category. The app shows both.
        group: (isSub ? p.parent_category_name : p.category_name) || 'Menu',
        categoryId: isSub ? Number(p.parent_id) : (p.category_name ? Number(p.category_id) : null),
        subCategoryId: isSub ? Number(p.category_id) : null,
        subCategory: isSub ? p.category_name : null,
        veg: Number(p.is_veg) === 1,
        available: available,
        // The primary product_images row, as a path the app resolves against
        // the server it is talking to. Null when none has been uploaded.
        image: image || null,
        outNote: attrs.out_note || undefined
    };

    if (storeCategory === 'grocery') {
        var packs = variants.map(function (v) {
            return { name: v.variant_name, mrp: fmt.num(v.price), price: fmt.num(v.discount_price || v.price), on: Number(v.is_active) === 1 };
        });
        return Object.assign(base, {
            priceLine: packs.map(function (v) { return v.name.replace(/ (pouch|box|bag|sack)$/i, '') + ' ₹' + v.price; }).join(' · ') || '₹' + fmt.num(p.base_price),
            stockLine: 'Stock ' + stock,
            sheet: {
                kind: 'grocery', brand: attrs.brand || '—', ean: attrs.ean || (p.product_code ? 'EAN ' + p.product_code : 'EAN —'), packs: packs,
                stock: stock, lowStockAlert: fmt.num(attrs.low_stock_alert, 10), batchExpiry: attrs.batch_expiry || '—',
                hsnGst: attrs.hsn_gst || '—', maxPerOrder: fmt.num(attrs.max_per_order, 5)
            }
        });
    }
    if (storeCategory === 'produce') {
        var unit = attrs.unit || 'kg';
        var rate = fmt.num(p.discount_price || p.base_price);
        return Object.assign(base, {
            priceLine: '₹' + rate + ' / ' + unit,
            stockLine: attrs.grade || 'Available',
            sheet: { kind: 'produce', unit: unit, rate: rate, yesterday: attrs.yesterday, note: attrs.note || '', tags: attrs.tags || [] }
        });
    }
    if (storeCategory === 'bakery') {
        var soldAs = variants.map(function (v) { return { name: v.variant_name, price: fmt.num(v.price), on: Number(v.is_active) === 1 }; });
        return Object.assign(base, {
            priceLine: soldAs.map(function (v) { return v.name + ' ₹' + v.price; }).join(' · ') || '₹' + fmt.num(p.base_price),
            stockLine: stock + ' left now',
            sheet: {
                kind: 'bakery', soldAs: soldAs, bakedAt: attrs.baked_at || 'Baked today', nextBatch: attrs.next_batch || 'Next batch —',
                shelfLife: attrs.shelf_life || 'Shelf life 24 h', preorder: Boolean(attrs.preorder), bakedToday: fmt.num(attrs.baked_today, stock),
                tags: attrs.tags || []
            }
        });
    }
    if (storeCategory === 'meat') {
        var perKg = fmt.num(attrs.price_per_kg, fmt.num(p.base_price));
        return Object.assign(base, {
            priceLine: '₹' + perKg + ' / kg',
            stockLine: stock + ' kg in hand',
            sheet: {
                kind: 'meat', pricePerKg: perKg,
                slabs: variants.map(function (v, i) { return { weight: v.variant_name, pieces: (attrs.pieces || [])[i] || '', price: fmt.num(v.price) }; }),
                preparation: attrs.preparation || [{ name: 'Cleaned', on: true }], stockKg: stock, cutAt: attrs.cut_at || '—',
                tolerance: attrs.tolerance || '± 30 g, billed actual', packingRule: attrs.packing_rule || 'Leak-proof pouch with an ice pack.',
                tags: attrs.tags || []
            }
        });
    }

    // Food
    var foodVariants = variants.map(function (v) { return { name: v.variant_name, price: fmt.num(v.price), on: Number(v.is_active) === 1 }; });
    var priceLine = attrs.price_line || (foodVariants.length > 1
        ? foodVariants.map(function (v) { return shortVariant(v.name) + ' ₹' + v.price; }).join(' · ') + ' · ' + prep + ' min'
        : '₹' + fmt.num(foodVariants.length ? foodVariants[0].price : p.base_price) + ' · ' + prep + ' min');
    return Object.assign(base, {
        priceLine: priceLine,
        stockLine: available ? (stock > 0 && stock <= 30 ? stock + ' plates left today' : 'Available') : 'Out of stock',
        sheet: {
            kind: 'food', prepMin: prep, variants: foodVariants,
            addons: addons.map(function (a) { return { name: a.addon_name, price: fmt.num(a.addon_price) }; }),
            spiceChoice: Boolean(attrs.spice_choice), stockToday: stock, tags: attrs.tags || []
        }
    });
}

async function loadProducts(vendor, storeCategory) {
    var products = await db.query(
        'SELECT p.*, c.category_name, c.parent_id, pc.category_name AS parent_category_name ' +
        'FROM products p LEFT JOIN categories c ON c.id = p.category_id LEFT JOIN categories pc ON pc.id = c.parent_id ' +
        'WHERE p.vendor_id = ? AND p.d_in = 0 AND p.active_status = 1 ORDER BY COALESCE(pc.category_order, c.category_order), c.category_order, p.id',
        [vendor.id], 'vendor-products');
    if (!products.length) return [];
    var ids = products.map(function (p) { return p.id; });
    var variants = await db.query('SELECT * FROM product_variants WHERE product_id IN (?) AND d_in = 0 ORDER BY id', [ids], 'vendor-variants');
    var addons = await db.query('SELECT * FROM product_addons WHERE product_id IN (?) AND d_in = 0 AND is_active = 1 ORDER BY id', [ids], 'vendor-addons');
    var images = await db.query(
        'SELECT product_id, image_path FROM product_images WHERE product_id IN (?) AND is_primary = 1 AND d_in = 0',
        [ids], 'vendor-product-images');
    return products.map(function (p) {
        var image = images.find(function (i) { return i.product_id === p.id; });
        return productJson(p,
            variants.filter(function (v) { return v.product_id === p.id; }),
            addons.filter(function (a) { return a.product_id === p.id; }),
            storeCategory,
            image ? image.image_path : null);
    });
}

// The categories.vertical a store's products belong to.
function verticalOf(vendor) {
    return vendor.store_category === 'produce' ? 'fruit' : vendor.store_category || 'food';
}

// The category picker: top-level categories for the store's vertical, each with
// its sub categories (categories rows whose parent_id points at it).
async function loadCategoryTree(vendor) {
    var top = await db.query(
        'SELECT id, category_name FROM categories WHERE tenant_id = ? AND vertical = ? AND parent_id IS NULL AND d_in = 0 AND is_active = 1 ORDER BY category_order, id',
        [vendor.tenant_id, verticalOf(vendor)], 'vendor-category-tree');
    if (!top.length) return [];
    var subs = await db.query(
        'SELECT id, parent_id, category_name FROM categories WHERE tenant_id = ? AND parent_id IN (?) AND d_in = 0 AND is_active = 1 ORDER BY category_order, id',
        [vendor.tenant_id, top.map(function (c) { return c.id; })], 'vendor-subcategory-tree');
    return top.map(function (c) {
        return {
            id: Number(c.id),
            name: c.category_name,
            subCategories: subs
                .filter(function (s) { return Number(s.parent_id) === Number(c.id); })
                .map(function (s) { return { id: Number(s.id), name: s.category_name }; })
        };
    });
}

// Checks the category / sub category a vendor picked and returns the categories.id
// the product should point at (the sub category when there is one). { id: null }
// means nothing was picked; { error } is a message for the vendor.
async function resolveProductCategory(vendor, categoryId, subCategoryId) {
    categoryId = Number(categoryId) || null;
    subCategoryId = Number(subCategoryId) || null;
    if (!categoryId && !subCategoryId) return { id: null };

    var sub = null;
    if (subCategoryId) {
        sub = await db.one(
            'SELECT id, parent_id FROM categories WHERE id = ? AND tenant_id = ? AND parent_id IS NOT NULL AND d_in = 0 AND is_active = 1',
            [subCategoryId, vendor.tenant_id], 'save-product-subcategory');
        if (!sub) return { error: 'That sub category is not available.' };
        if (categoryId && Number(sub.parent_id) !== categoryId) return { error: 'That sub category does not belong to the chosen category.' };
        categoryId = Number(sub.parent_id);
    }
    var cat = await db.one(
        'SELECT id FROM categories WHERE id = ? AND tenant_id = ? AND vertical = ? AND parent_id IS NULL AND d_in = 0 AND is_active = 1',
        [categoryId, vendor.tenant_id, verticalOf(vendor)], 'save-product-category-check');
    if (!cat) return { error: 'That category is not available for your store.' };
    return { id: sub ? Number(sub.id) : Number(cat.id) };
}

// ─── Money ───────────────────────────────────────────────────────────────────

async function periodTotals(vendor, fromSql, toSql) {
    var row = await db.one(
        'SELECT COUNT(*) AS orders, COALESCE(SUM(sub_total),0) AS gross, COALESCE(SUM(discount_amount),0) AS coupon FROM orders ' +
        'WHERE vendor_id = ? AND d_in = 0 AND order_status = 4 AND delivered_at >= ' + fromSql + ' AND delivered_at < ' + toSql,
        [vendor.id], 'vendor-period');
    var gross = fmt.num(row.gross);
    var commission = Math.round(gross * fmt.num(vendor.commission_percentage) / 100);
    var coupon = Math.round(fmt.num(row.coupon));
    return { orders: fmt.num(row.orders), gross: Math.round(gross), commission: commission, coupon: coupon, net: Math.round(gross) - commission - coupon };
}

async function loadEarnings(vendor) {
    var now = new Date();
    var monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    var month = await periodTotals(vendor, "DATE_FORMAT(NOW(), '%Y-%m-01')", 'NOW() + INTERVAL 1 DAY');
    var lastMonth = await periodTotals(vendor, "DATE_FORMAT(NOW() - INTERVAL 1 MONTH, '%Y-%m-01')", "DATE_FORMAT(NOW(), '%Y-%m-01')");
    var custom = await periodTotals(vendor, 'CURDATE() - INTERVAL 13 DAY', 'NOW() + INTERVAL 1 DAY');
    var twoWeeksAgo = new Date(now.getTime() - 13 * 86400000);
    return {
        month: Object.assign({ label: monthNames[now.getMonth()] }, month),
        lastMonth: Object.assign({ label: monthNames[(now.getMonth() + 11) % 12] }, lastMonth),
        custom: Object.assign({ label: fmt.rangeLabel(twoWeeksAgo, now) }, custom)
    };
}

async function loadDailySales(vendor) {
    var rows = await db.query(
        'SELECT DATE(delivered_at) AS d, COALESCE(SUM(grand_total),0) AS amount FROM orders ' +
        'WHERE vendor_id = ? AND d_in = 0 AND order_status = 4 AND delivered_at >= CURDATE() - INTERVAL 6 DAY ' +
        'GROUP BY DATE(delivered_at)', [vendor.id], 'vendor-daily');
    var days = [];
    for (var i = 6; i >= 0; i--) {
        var d = new Date(Date.now() - i * 86400000);
        var match = rows.find(function (r) { return new Date(r.d).toDateString() === d.toDateString(); });
        days.push({ date: d, amount: Math.round(fmt.num(match && match.amount)) });
    }
    var max = Math.max.apply(null, days.map(function (d) { return d.amount; }).concat([1]));
    return days.map(function (d, i) {
        var value = d.amount / max;
        return { day: fmt.dayName(d.date), amount: d.amount, value: value, tone: i === 6 ? 'dark' : value >= 0.7 ? 'mid' : 'light' };
    });
}

async function loadSettlements(vendor) {
    var bank = fmt.bankLabel(vendor.bank_name, vendor.bank_account_number, vendor.bank_ifsc_code);
    var rows = await db.query(
        'SELECT s.*, p.transaction_reference, p.paid_at FROM vendor_settlements s ' +
        'LEFT JOIN vendor_payouts p ON p.vendor_settlement_id = s.id AND p.payout_status = 1 AND p.d_in = 0 ' +
        'WHERE s.vendor_id = ? AND s.d_in = 0 ORDER BY s.period_end DESC LIMIT 12', [vendor.id], 'vendor-settlements');
    var list = rows.map(function (s) {
        var range = fmt.rangeLabel(s.period_start, s.period_end);
        var paid = Number(s.settlement_status) === 2;
        var expected = fmt.dayMonth(new Date(new Date(s.period_end).getTime() + 3 * 86400000));
        return {
            id: String(s.id),
            amount: Math.round(fmt.num(s.net_payable)),
            status: paid ? 'settled' : 'pending',
            title: paid ? fmt.inr(s.net_payable) : fmt.inr(s.net_payable) + ' pending',
            subtitle: paid ? range + (s.transaction_reference ? ' · UTR ' + s.transaction_reference : '') + ' · ' + bank : 'Cycle ' + range + ' · payout ' + expected,
            period: range,
            orders: fmt.num(s.total_orders),
            gross: Math.round(fmt.num(s.gross_sales)),
            commission: Math.round(fmt.num(s.commission_amount)),
            refunds: 0,
            utr: s.transaction_reference || undefined,
            paidOn: paid ? 'Paid ' + fmt.dayMonth(s.paid_at || s.period_end) : 'Expected ' + expected
        };
    });

    var refund = await db.one(
        "SELECT id, order_number, grand_total, cancellation_reason, cancelled_at FROM orders WHERE vendor_id = ? AND d_in = 0 " +
        "AND order_status IN (5,6) AND payment_type <> 'cod' AND cancelled_at >= NOW() - INTERVAL 7 DAY ORDER BY cancelled_at DESC LIMIT 1",
        [vendor.id], 'vendor-refund');
    if (refund) {
        list.push({
            id: 'rf-' + refund.id,
            amount: Math.round(fmt.num(refund.grand_total)),
            status: 'refund',
            title: fmt.inr(refund.grand_total) + ' refund adjusted',
            subtitle: '#' + refund.order_number + ' · linked to original payment',
            period: fmt.dayMonth(refund.cancelled_at),
            refunds: Math.round(fmt.num(refund.grand_total)),
            paidOn: 'Adjusted in the current cycle',
            orderNumber: refund.order_number,
            reason: refund.cancellation_reason || undefined
        });
    }
    return list;
}

async function loadReportRows(vendor, earnings, settlements) {
    var counts = await db.one(
        "SELECT SUM(order_status = 4) AS completed, SUM(order_status = 5) AS cancelled, SUM(order_status = 6) AS rejected, " +
        "SUM(order_status IN (5,6) AND payment_type <> 'cod') AS refunded FROM orders " +
        "WHERE vendor_id = ? AND d_in = 0 AND order_date_time >= DATE_FORMAT(NOW(), '%Y-%m-01')", [vendor.id], 'vendor-report-counts');
    var top = await db.one(
        "SELECT oi.product_name_snapshot AS name, SUM(oi.quantity) AS qty FROM order_items oi JOIN orders o ON o.id = oi.order_id " +
        "WHERE o.vendor_id = ? AND o.d_in = 0 AND o.order_status = 4 AND o.delivered_at >= DATE_FORMAT(NOW(), '%Y-%m-01') " +
        "GROUP BY oi.product_name_snapshot ORDER BY qty DESC LIMIT 1", [vendor.id], 'vendor-report-top');
    var peak = await db.one(
        "SELECT HOUR(order_date_time) AS h, COUNT(*) AS c FROM orders WHERE vendor_id = ? AND d_in = 0 AND order_status NOT IN (5,6) " +
        "AND order_date_time >= DATE_FORMAT(NOW(), '%Y-%m-01') GROUP BY HOUR(order_date_time) ORDER BY c DESC LIMIT 1", [vendor.id], 'vendor-report-peak');
    var refundSum = await db.one(
        "SELECT COALESCE(SUM(grand_total),0) AS total FROM orders WHERE vendor_id = ? AND d_in = 0 AND order_status IN (5,6) " +
        "AND payment_type <> 'cod' AND cancelled_at >= DATE_FORMAT(NOW(), '%Y-%m-01')", [vendor.id], 'vendor-report-refunds');

    var hourLabel = function (h) { var x = h % 12 === 0 ? 12 : h % 12; var y = (h + 1) % 12 === 0 ? 12 : (h + 1) % 12; return x + '–' + y + ((h + 1) % 24 < 12 ? ' AM' : ' PM'); };
    var sum = function (status) {
        return settlements.filter(function (s) { return s.status === status; }).reduce(function (t, s) { return t + s.amount; }, 0);
    };
    var m = earnings.month;
    return {
        orders: [
            { label: 'Completed', value: String(fmt.num(counts.completed)) },
            { label: 'Cancelled', value: String(fmt.num(counts.cancelled)) },
            { label: 'Rejected by store', value: String(fmt.num(counts.rejected)) },
            { label: 'Refunded', value: String(fmt.num(counts.refunded)) }
        ],
        sales: [
            { label: 'Gross sales', value: fmt.inr(m.gross) },
            { label: 'Average order', value: m.orders ? fmt.inr(m.gross / m.orders) : '—' },
            { label: 'Top item', value: top ? top.name + ' · ' + fmt.num(top.qty) : '—' },
            { label: 'Peak hour', value: peak ? hourLabel(fmt.num(peak.h)) : '—' }
        ],
        settlements: [
            { label: 'Settled', value: fmt.inr(sum('settled')) },
            { label: 'Pending', value: fmt.inr(sum('pending')) },
            { label: 'Commission', value: fmt.inr(m.commission) },
            { label: 'Refund adjustments', value: fmt.inr(refundSum.total) }
        ]
    };
}

async function loadCoupons(vendor) {
    var rows = await db.query(
        'SELECT cp.*, (SELECT COUNT(*) FROM orders o WHERE o.vendor_id = cp.vendor_id AND o.coupon_code = cp.coupon_code AND o.d_in = 0) AS used ' +
        'FROM coupons cp WHERE cp.vendor_id = ? AND cp.d_in = 0 ORDER BY cp.is_active DESC, cp.id DESC', [vendor.id], 'vendor-coupons');
    var now = Date.now();
    return rows.map(function (c) {
        return {
            couponId: c.id,
            code: c.coupon_code,
            kind: c.discount_type === 'percentage' ? 'percent' : 'flat',
            value: fmt.num(c.discount_value),
            maxDiscount: c.max_discount_amount === null ? undefined : fmt.num(c.max_discount_amount),
            minOrder: fmt.num(c.min_order_value),
            validTill: c.valid_upto ? fmt.dayMonth(c.valid_upto) : '—',
            used: fmt.num(c.used),
            active: Number(c.is_active) === 1 && (!c.valid_upto || fmt.ms(c.valid_upto) > now)
        };
    });
}


/**
 * The vendor's named service windows ("Lunch 12:00 PM - 3:30 PM"). Exactly one
 * is active; vendor_dayparts is seeded per vendor by the migration, so a store
 * always has something to switch between.
 */
async function loadDayparts(vendor) {
    var rows = await db.query(
        'SELECT daypart_key, label, start_time, end_time, is_active FROM vendor_dayparts ' +
        'WHERE vendor_id = ? AND d_in = 0 ORDER BY daypart_order, id',
        [vendor.id], 'vendor-dayparts');
    return rows.map(function (r) {
        return {
            id: r.daypart_key,
            label: r.label,
            window: fmt.timeLabel(r.start_time) + '-' + fmt.timeLabel(r.end_time),
            active: Number(r.is_active) === 1
        };
    });
}

function hoursJson(vendor) {
    var days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    var holiday = String(vendor.weekly_holiday || '').slice(0, 3).toLowerCase();
    return days.map(function (d) {
        return { day: d, open: d.toLowerCase() !== holiday, from: fmt.timeLabel(vendor.opening_time), to: fmt.timeLabel(vendor.closing_time) };
    });
}

// GET /getvendorstate
exports.getvendorstate = withVendor(async function (req, res, vendor) {
    var category = fmt.category(vendor.store_category);
    var closeHour = Number(String(vendor.closing_time || '23').split(':')[0]);

    var results = await Promise.all([
        loadOrders(vendor),
        loadProducts(vendor, category),
        loadEarnings(vendor),
        loadDailySales(vendor),
        loadSettlements(vendor),
        loadCoupons(vendor),
        notifications.load(vendor.tenant_id, 'vendor', vendor.id),
        branding.load(vendor.tenant_id),
        prefs.load('vendor', vendor.id),
        db.one("SELECT COUNT(*) AS n, COALESCE(SUM(grand_total),0) AS amount, AVG(prep_minutes) AS prep FROM orders " +
            'WHERE vendor_id = ? AND d_in = 0 AND order_status = 4 AND delivered_at >= CURDATE()', [vendor.id], 'vendor-today'),
        db.one('SELECT COUNT(*) AS n FROM reviews WHERE vendor_id = ? AND d_in = 0', [vendor.id], 'vendor-ratings').catch(function () { return { n: 0 }; }),
        loadDayparts(vendor),
        loadCategoryTree(vendor),
        db.one('SELECT tenant_name FROM tenants WHERE id = ? AND d_in = 0', [vendor.tenant_id], 'vendor-tenant').catch(function () { return null; })
    ]);
    var orders = results[0], products = results[1], earnings = results[2], dailySales = results[3], settlements = results[4];
    var coupons = results[5], notes = results[6], theme = results[7], settings = results[8];
    var today = results[9], ratings = results[10], dayparts = results[11], categories = results[12], tenant = results[13];

    var groups = [];
    products.forEach(function (p) { if (groups.indexOf(p.group) < 0) groups.push(p.group); });

    var todayOrders = fmt.num(today.n);
    var reportRows = await loadReportRows(vendor, earnings, settlements);

    return res.json({
        status: 200,
        data: {
            store: {
                category: category,
                name: vendor.vendor_name,
                initials: fmt.initials(vendor.vendor_name),
                logo: logoUrl(vendor.shop_image, req),
                // The business this store belongs to (tenants.tenant_name), printed on invoices.
                tenantName: tenant && tenant.tenant_name ? tenant.tenant_name : null,
                area: vendor.location_area || fmt.areaFrom(vendor.vendor_address),
                address: vendor.vendor_address || '',
                // For the map on Store details.
                latitude: vendor.latitude === null ? null : fmt.num(vendor.latitude),
                longitude: vendor.longitude === null ? null : fmt.num(vendor.longitude),
                code: vendor.vendor_unique_code || 'V-' + vendor.id,
                rating: fmt.num(vendor.vendor_rating),
                ratings: fmt.num(ratings && ratings.n),
                hours: fmt.hoursLabel(vendor.opening_time, vendor.closing_time),
                closesAt: fmt.timeLabel(vendor.closing_time),
                // Raw 24-hour values, so the app can preselect its time picker.
                openingTime: String(vendor.opening_time || '').slice(0, 5),
                closingTime: String(vendor.closing_time || '').slice(0, 5),
                service: category === 'food' ? (closeHour <= 16 ? 'Lunch service' : 'Dinner service') : 'Open today',
                bank: fmt.bankLabel(vendor.bank_name, vendor.bank_account_number, vendor.bank_ifsc_code),
                groups: groups,
                categories: categories,
                itemNoun: ITEM_NOUN[category]
            },
            details: {
                phone: vendor.vendor_mobile_number ? '+91 ' + vendor.vendor_mobile_number.slice(0, 5) + ' ' + vendor.vendor_mobile_number.slice(5) : '',
                alternatePhone: vendor.vendor_mobile_number2 || '',
                email: vendor.vendor_email || '',
                kycVerified: Number(vendor.kyc_status) === 1,
                documents: [
                    vendor.fssai_license_number && { title: 'FSSAI licence', detail: vendor.fssai_license_number },
                    vendor.gst_number && { title: 'GST certificate', detail: vendor.gst_number },
                    vendor.trade_license_number && { title: 'Trade licence', detail: vendor.trade_license_number },
                    vendor.pan_number && { title: 'PAN', detail: String(vendor.pan_number).slice(0, 5) + '••' + String(vendor.pan_number).slice(-3) }
                ].filter(Boolean),
                bank: {
                    bank: vendor.bank_name || '—',
                    account: vendor.bank_account_number ? '••••••••' + String(vendor.bank_account_number).slice(-4) : '—',
                    holder: vendor.bank_account_holder || '—',
                    ifsc: vendor.bank_ifsc_code || '—'
                },
                commission: fmt.num(vendor.commission_percentage)
            },
            open: Number(vendor.is_online) === 1,
            busyMode: Number(vendor.is_busy) === 1,
            orders: orders,
            products: products,
            coupons: coupons,
            settlements: settlements,
            earnings: earnings,
            today: {
                amount: Math.round(fmt.num(today.amount)),
                orders: todayOrders,
                avg: todayOrders ? Math.round(fmt.num(today.amount) / todayOrders) : 0,
                avgPrep: Math.round(fmt.num(today.prep)),
                bars: dailySales.map(function (d) { return Math.max(0.08, d.value); })
            },
            dailySales: dailySales,
            reportRows: reportRows,
            hours: hoursJson(vendor),
            dayparts: dayparts,
            // Rates are published for a day, so anything older than today is stale.
            ratesPublished: fmt.isToday(vendor.rates_published_on),
            allowSubstitution: Number(vendor.allow_substitution) !== 0,
            prefs: { orderNotifications: settings.alerts },
            options: prefs.options(),
            notifications: notes,
            branding: theme
        }
    });
});

// GET /getvendorhistory?from=YYYY-MM-DD&to=YYYY-MM-DD
// The end is inclusive for the caller and exclusive in SQL, avoiding timezone
// and end-of-day precision errors.
exports.getvendorhistory = withVendor(async function (req, res, vendor) {
    var from = String(req.query.from || '');
    var to = String(req.query.to || '');
    var validDate = function (value) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        var parts = value.split('-').map(Number);
        var date = new Date(parts[0], parts[1] - 1, parts[2]);
        return date.getFullYear() === parts[0] && date.getMonth() === parts[1] - 1 && date.getDate() === parts[2];
    };
    if (!validDate(from) || !validDate(to) || from > to) {
        return db.refuse(res, 'Choose a valid From and To date');
    }

    var end = new Date(to + 'T00:00:00');
    end.setDate(end.getDate() + 1);
    var endExclusive = end.getFullYear() + '-' + String(end.getMonth() + 1).padStart(2, '0') + '-' + String(end.getDate()).padStart(2, '0');
    var results = await Promise.all([
        db.one(
            'SELECT COUNT(*) AS orders, COALESCE(SUM(grand_total), 0) AS gross, ' +
            'COALESCE(SUM(sub_total * (1 - ?) + packing_charges), 0) AS payout, ' +
            'COALESCE(AVG(grand_total), 0) AS avg ' +
            'FROM orders WHERE vendor_id = ? AND d_in = 0 AND order_status NOT IN (5,6) ' +
            'AND order_date_time >= ? AND order_date_time < ?',
            [fmt.num(vendor.commission_percentage) / 100, vendor.id, from, endExclusive], 'vendor-history-summary'),
        db.query(
            "SELECT order_number, grand_total, order_status, DATE_FORMAT(order_date_time, '%e %b, %l:%i %p') AS placed_at " +
            'FROM orders WHERE vendor_id = ? AND d_in = 0 AND order_status NOT IN (5,6) ' +
            'AND order_date_time >= ? AND order_date_time < ? ORDER BY order_date_time DESC LIMIT 100',
            [vendor.id, from, endExclusive], 'vendor-history-recent')
    ]);
    var summary = results[0], recentRows = results[1];

    return res.json({
        status: 200,
        data: {
            orders: fmt.num(summary.orders),
            gross: Math.round(fmt.num(summary.gross)),
            payout: Math.round(fmt.num(summary.payout)),
            avg: Math.round(fmt.num(summary.avg)),
            recentOrders: recentRows.map(function (row) {
                var status = fmt.orderStatus(row.order_status);
                return {
                    id: row.order_number || String(row.id),
                    placedAt: row.placed_at,
                    amount: Math.round(fmt.num(row.grand_total)),
                    status: status === 'ready' ? 'Ready' : status === 'cooking' ? 'Cooking' : 'Delivered'
                };
            })
        }
    });
});

// ─── Store actions ───────────────────────────────────────────────────────────

// POST /updatestoreonline { is_online }
exports.updatestoreonline = withVendor(async function (req, res, vendor) {
    await db.query('UPDATE vendors SET is_online = ? WHERE id = ?', [req.body.is_online ? 1 : 0, vendor.id], 'store-online');
    return res.json({ status: 200, message: req.body.is_online ? 'Accepting orders' : 'Not accepting orders' });
});

// POST /updatestorebusy { is_busy }
exports.updatestorebusy = withVendor(async function (req, res, vendor) {
    await db.query('UPDATE vendors SET is_busy = ? WHERE id = ?', [req.body.is_busy ? 1 : 0, vendor.id], 'store-busy');
    return res.json({ status: 200, message: req.body.is_busy ? 'Busy mode on' : 'Busy mode off' });
});

// POST /updateweeklyholiday { day, open }
exports.updateweeklyholiday = withVendor(async function (req, res, vendor) {
    var day = String(req.body.day || '').slice(0, 3);
    if (!day) return db.refuse(res, 'Day is required');
    var current = String(vendor.weekly_holiday || '').slice(0, 3).toLowerCase();
    var next = req.body.open ? (current === day.toLowerCase() ? null : vendor.weekly_holiday) : day;
    await db.query('UPDATE vendors SET weekly_holiday = ? WHERE id = ?', [next, vendor.id], 'store-holiday');
    return res.json({ status: 200, message: 'Hours updated' });
});

// ─── Order actions ───────────────────────────────────────────────────────────

async function orderFor(vendor, orderId) {
    return db.one('SELECT * FROM orders WHERE id = ? AND vendor_id = ? AND d_in = 0', [orderId, vendor.id], 'order-for-vendor');
}

/** Offers a ready-soon order to up to three nearby online partners (assignment status 0). */
async function offerToPartners(order, vendor) {
    var existing = await db.one(
        'SELECT COUNT(*) AS n FROM delivery_assignments WHERE order_id = ? AND assignment_status IN (0,1,2,3) AND d_in = 0',
        [order.id], 'offer-existing');
    if (fmt.num(existing.n) > 0) return 0;

    var address = await db.one('SELECT latitude, longitude FROM customer_addresses WHERE id = ?', [order.customer_address_id], 'offer-address');
    var dropKm = address ? fmt.km(vendor.latitude, vendor.longitude, address.latitude, address.longitude) : 3;
    var partners = await db.query(
        'SELECT id, latitude, longitude FROM delivery_partners WHERE tenant_id = ? AND d_in = 0 AND active_status = 1 AND login_status = 0 AND is_online = 1 ' +
        'AND (? <> \'cod\' OR cod_limit IS NULL OR cod_limit <> 0)',
        [vendor.tenant_id, order.payment_type], 'offer-partners');
    partners.sort(function (a, b) {
        return fmt.km(vendor.latitude, vendor.longitude, a.latitude, a.longitude) - fmt.km(vendor.latitude, vendor.longitude, b.latitude, b.longitude);
    });

    var picked = partners.slice(0, 3);
    for (var i = 0; i < picked.length; i++) {
        await db.query(
            'INSERT INTO delivery_assignments (order_id, delivery_partner_id, assigned_at, assignment_status, distance_km, base_pay, distance_pay, tip_pay, i_ts, d_in) ' +
            'VALUES (?, ?, NOW(), 0, ?, 40, ?, ?, NOW(), 0)',
            [order.id, picked[i].id, dropKm || 1, Math.round((dropKm || 1) * 3), fmt.num(order.tip_amount)], 'offer-insert');
        await notifications.send(vendor.tenant_id, 'delivery_partner', picked[i].id,
            'New request · ' + vendor.vendor_name, '#' + order.order_number + ' · ' + dropKm + ' km drop');
    }
    return picked.length;
}

// POST /acceptorder { order_id, prep_minutes }
exports.acceptorder = withVendor(async function (req, res, vendor) {
    var order = await orderFor(vendor, req.body.order_id);
    if (!order) return db.refuse(res, 'Order not found');
    if (Number(order.order_status) !== 0) return db.refuse(res, 'This order was already handled.');

    var prep = Math.min(120, Math.max(5, parseInt(req.body.prep_minutes, 10) || 15)) + (Number(vendor.is_busy) === 1 ? 10 : 0);
    var handover = order.handover_code || fmt.randomCode(4);
    var otp = order.delivery_otp || fmt.randomCode(4);
    var result = await db.query(
        'UPDATE orders SET order_status = 2, accepted_at = NOW(), prep_minutes = ?, handover_code = ?, delivery_otp = ? WHERE id = ? AND order_status = 0',
        [prep, handover, otp, order.id], 'accept-order');
    if (!result.affectedRows) return db.refuse(res, 'This order was already handled.');

    await history(order.id, 0, 2, 'vendor', vendor.id, 'Accepted · ' + prep + ' min');
    var offered = await offerToPartners(order, vendor);
    // The customer app shows this code; logged here until that app exists.
    console.log('[partner_app] ' + order.order_number + ' accepted · handover ' + handover + ' · customer OTP ' + otp);
    return res.json({ status: 200, message: 'Order accepted', prep_minutes: prep, offered_to: offered });
});

// POST /rejectorder { order_id, reason }
exports.rejectorder = withVendor(async function (req, res, vendor) {
    var reason = String(req.body.reason || '').trim();
    if (!reason) return db.refuse(res, 'Choose a reason to reject the order');
    var order = await orderFor(vendor, req.body.order_id);
    if (!order) return db.refuse(res, 'Order not found');
    var result = await db.query(
        'UPDATE orders SET order_status = 6, cancelled_at = NOW(), cancellation_reason = ? WHERE id = ? AND order_status = 0',
        [reason, order.id], 'reject-order');
    if (!result.affectedRows) return db.refuse(res, 'Only new orders can be rejected.');
    await history(order.id, 0, 6, 'vendor', vendor.id, reason);
    return res.json({ status: 200, message: 'Order rejected' });
});

// POST /extendpreptime { order_id, minutes }
exports.extendpreptime = withVendor(async function (req, res, vendor) {
    var minutes = Math.min(30, Math.max(1, parseInt(req.body.minutes, 10) || 5));
    var result = await db.query(
        'UPDATE orders SET prep_minutes = COALESCE(prep_minutes, 0) + ? WHERE id = ? AND vendor_id = ? AND order_status IN (1,2)',
        [minutes, req.body.order_id, vendor.id], 'extend-prep');
    if (!result.affectedRows) return db.refuse(res, 'Only orders being prepared can be extended.');
    return res.json({ status: 200, message: 'Prep time extended by ' + minutes + ' minutes' });
});

// POST /markorderready { order_id }
exports.markorderready = withVendor(async function (req, res, vendor) {
    var order = await orderFor(vendor, req.body.order_id);
    if (!order) return db.refuse(res, 'Order not found');
    var result = await db.query(
        'UPDATE orders SET order_status = 7, ready_at = NOW(), handover_code = COALESCE(handover_code, ?) WHERE id = ? AND order_status IN (1,2)',
        [fmt.randomCode(4), order.id], 'mark-ready');
    if (!result.affectedRows) return db.refuse(res, 'Only orders being prepared can be marked ready.');
    await history(order.id, order.order_status, 7, 'vendor', vendor.id, 'Marked ready');
    await offerToPartners(order, vendor);
    return res.json({ status: 200, message: 'Marked ready · partner notified' });
});

// POST /confirmhandover { order_id }
exports.confirmhandover = withVendor(async function (req, res, vendor) {
    var order = await orderFor(vendor, req.body.order_id);
    if (!order) return db.refuse(res, 'Order not found');
    if (Number(order.order_status) !== 7) return db.refuse(res, 'This order is not waiting for handover.');
    var assignment = await db.one(
        'SELECT id FROM delivery_assignments WHERE order_id = ? AND assignment_status = 1 AND d_in = 0 ORDER BY id DESC LIMIT 1',
        [order.id], 'handover-assignment');
    if (!assignment) return db.refuse(res, 'No delivery partner has accepted this order yet.');

    await db.query('UPDATE delivery_assignments SET assignment_status = 2, picked_up_at = NOW(), arrived_store_at = COALESCE(arrived_store_at, NOW()) WHERE id = ?',
        [assignment.id], 'handover-assignment-update');
    await db.query('UPDATE orders SET order_status = 3, picked_up_at = NOW() WHERE id = ?', [order.id], 'handover-order');
    await history(order.id, 7, 3, 'vendor', vendor.id, 'Handed over to partner');
    return res.json({ status: 200, message: 'Handed over' });
});

// ─── Menu actions ────────────────────────────────────────────────────────────

// POST /updateproductavailability { product_id, is_available }
exports.updateproductavailability = withVendor(async function (req, res, vendor) {
    var result = await db.query('UPDATE products SET is_available = ? WHERE id = ? AND vendor_id = ? AND d_in = 0',
        [req.body.is_available ? 1 : 0, req.body.product_id, vendor.id], 'product-availability');
    if (!result.affectedRows) return db.refuse(res, 'Product not found');
    return res.json({ status: 200, message: req.body.is_available ? 'Marked available' : 'Marked out of stock' });
});

// POST /saveproduct { product: { id?, name, categoryId?, subCategoryId?, veg, available, prepMin?, variants: [{ name, price, mrp?, on }], addons: [{ name, price }] } }
exports.saveproduct = withVendor(async function (req, res, vendor) {
    var p = req.body.product || {};
    var name = String(p.name || '').trim();
    if (!name) return db.refuse(res, 'Product name is required');
    var variants = Array.isArray(p.variants) ? p.variants : [];
    var firstPrice = variants.length ? fmt.num(variants[0].mrp || variants[0].price) : 0;
    var productId = Number(p.id) || null;

    var picked = await resolveProductCategory(vendor, p.categoryId, p.subCategoryId);
    if (picked.error) return db.refuse(res, picked.error);

    if (productId) {
        var owned = await db.one('SELECT id FROM products WHERE id = ? AND vendor_id = ? AND d_in = 0', [productId, vendor.id], 'save-product-owned');
        if (!owned) return db.refuse(res, 'Product not found');
        // No category sent (an older app build): keep the one the product already has.
        await db.query('UPDATE products SET product_name = ?, category_id = COALESCE(?, category_id), is_veg = ?, is_available = ?, prep_minutes = COALESCE(?, prep_minutes) WHERE id = ?',
            [name, picked.id, p.veg ? 1 : 0, p.available === false ? 0 : 1, p.prepMin || null, productId], 'save-product-update');
    } else {
        var categoryId = picked.id;
        if (!categoryId) {
            // Nothing picked: file it under the store's first category, as before.
            var cat = await db.one(
                'SELECT id FROM categories WHERE tenant_id = ? AND d_in = 0 AND is_active = 1 AND vertical = ? AND parent_id IS NULL ORDER BY category_order LIMIT 1',
                [vendor.tenant_id, verticalOf(vendor)], 'save-product-category');
            categoryId = cat ? cat.id : 0;
        }
        var inserted = await db.query(
            'INSERT INTO products (vendor_id, category_id, product_name, base_price, stock_quantity, prep_minutes, is_veg, is_returnable, is_featured, is_available, active_status, i_ts, d_in) ' +
            'VALUES (?, ?, ?, ?, 20, ?, ?, 0, 0, 1, 1, NOW(), 0)',
            [vendor.id, categoryId, name, firstPrice, p.prepMin || null, p.veg ? 1 : 0], 'save-product-insert');
        productId = inserted.insertId;
    }

    var unit = await db.one('SELECT id FROM measurement_units ORDER BY id LIMIT 1', [], 'save-product-unit');
    var existing = await db.query('SELECT id, variant_name FROM product_variants WHERE product_id = ? AND d_in = 0', [productId], 'save-product-variants');
    for (var i = 0; i < variants.length; i++) {
        var v = variants[i];
        var match = existing.find(function (e) { return e.variant_name === v.name; });
        var price = fmt.num(v.mrp || v.price);
        var discount = v.mrp ? fmt.num(v.price) : null;
        if (match) {
            await db.query('UPDATE product_variants SET price = ?, discount_price = ?, is_active = ? WHERE id = ?',
                [price, discount, v.on === false ? 0 : 1, match.id], 'save-variant-update');
        } else if (v.name) {
            await db.query(
                'INSERT INTO product_variants (product_id, measurement_unit_id, variant_name, price, discount_price, stock_quantity, is_default, is_active, i_ts, d_in) ' +
                'VALUES (?, ?, ?, ?, ?, 20, ?, ?, NOW(), 0)',
                [productId, unit ? unit.id : 0, v.name, price, discount, existing.length === 0 && i === 0 ? 1 : 0, v.on === false ? 0 : 1], 'save-variant-insert');
        }
    }

    var addons = Array.isArray(p.addons) ? p.addons : [];
    var existingAddons = await db.query('SELECT addon_name FROM product_addons WHERE product_id = ? AND d_in = 0', [productId], 'save-product-addons');
    for (var j = 0; j < addons.length; j++) {
        if (!existingAddons.some(function (a) { return a.addon_name === addons[j].name; })) {
            await db.query('INSERT INTO product_addons (product_id, addon_name, addon_price, max_quantity, is_active, i_ts, d_in) VALUES (?, ?, ?, 2, 1, NOW(), 0)',
                [productId, addons[j].name, fmt.num(addons[j].price)], 'save-addon-insert');
        }
    }
    return res.json({ status: 200, message: name + ' saved', product_id: productId });
});

// POST /deleteproduct { product_id }: soft-deletes the dish (d_in = 1) with its variants and
// add-ons, so past orders that point at it still read correctly.
exports.deleteproduct = withVendor(async function (req, res, vendor) {
    var productId = Number(req.body.product_id) || null;
    if (!productId) return db.refuse(res, 'Product is required');
    var owned = await db.one('SELECT id, product_name FROM products WHERE id = ? AND vendor_id = ? AND d_in = 0', [productId, vendor.id], 'delete-product-owned');
    if (!owned) return db.refuse(res, 'Product not found');
    await db.query('UPDATE products SET d_in = 1 WHERE id = ?', [productId], 'delete-product');
    await db.query('UPDATE product_variants SET d_in = 1 WHERE product_id = ?', [productId], 'delete-product-variants');
    await db.query('UPDATE product_addons SET d_in = 1 WHERE product_id = ?', [productId], 'delete-product-addons');
    return res.json({ status: 200, message: owned.product_name + ' deleted' });
});

// ─── Coupons ─────────────────────────────────────────────────────────────────

// POST /savecoupon { coupon: { couponId?, code, kind, value, maxDiscount?, minOrder, validDays?, active } }
exports.savecoupon = withVendor(async function (req, res, vendor) {
    var c = req.body.coupon || {};
    var code = String(c.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
    if (code.length < 4 || code.length > 12) return db.refuse(res, 'Use 4–12 letters or numbers for the code.');
    if (!(fmt.num(c.value) > 0)) return db.refuse(res, 'Enter a discount value.');
    var kind = c.kind === 'percent' ? 'percentage' : 'flat';
    var validDays = Math.min(365, Math.max(1, parseInt(c.validDays, 10) || 30));

    if (c.couponId) {
        var result = await db.query(
            'UPDATE coupons SET discount_type = ?, discount_value = ?, max_discount_amount = ?, min_order_value = ?, is_active = ? WHERE id = ? AND vendor_id = ? AND d_in = 0',
            [kind, fmt.num(c.value), kind === 'percentage' ? fmt.num(c.maxDiscount) || null : null, fmt.num(c.minOrder), c.active ? 1 : 0, c.couponId, vendor.id], 'coupon-update');
        if (!result.affectedRows) return db.refuse(res, 'Coupon not found');
    } else {
        var clash = await db.one('SELECT id FROM coupons WHERE vendor_id = ? AND coupon_code = ? AND d_in = 0', [vendor.id, code], 'coupon-clash');
        if (clash) return db.refuse(res, code + ' already exists. Choose another code.');
        await db.query(
            'INSERT INTO coupons (tenant_id, vendor_id, coupon_code, description, discount_type, discount_value, max_discount_amount, min_order_value, ' +
            'usage_limit_per_user, total_usage_limit, valid_from, valid_upto, is_active, i_ts, d_in) ' +
            'VALUES (?, ?, ?, NULL, ?, ?, ?, ?, 3, 1000, NOW(), NOW() + INTERVAL ? DAY, ?, NOW(), 0)',
            [vendor.tenant_id, vendor.id, code, kind, fmt.num(c.value), kind === 'percentage' ? fmt.num(c.maxDiscount) || null : null,
                fmt.num(c.minOrder), validDays, c.active === false ? 0 : 1], 'coupon-insert');
    }
    return res.json({ status: 200, message: code + ' saved' });
});

// POST /togglecoupon { coupon_id }
exports.togglecoupon = withVendor(async function (req, res, vendor) {
    var c = await db.one('SELECT id, coupon_code, is_active, valid_upto FROM coupons WHERE id = ? AND vendor_id = ? AND d_in = 0',
        [req.body.coupon_id, vendor.id], 'coupon-toggle-find');
    if (!c) return db.refuse(res, 'Coupon not found');
    var activating = Number(c.is_active) !== 1;
    if (activating && c.valid_upto && fmt.ms(c.valid_upto) < Date.now()) {
        return db.refuse(res, c.coupon_code + ' has expired. Edit its validity before turning it on.');
    }
    await db.query('UPDATE coupons SET is_active = ? WHERE id = ?', [activating ? 1 : 0, c.id], 'coupon-toggle');
    return res.json({ status: 200, message: activating ? c.coupon_code + ' is live' : c.coupon_code + ' paused' });
});

// POST /readnotifications
exports.readnotifications = withVendor(async function (req, res, vendor) {
    await notifications.markRead(vendor.tenant_id, 'vendor', vendor.id);
    return res.json({ status: 200, message: 'Marked as read' });
});

// POST /vendor/updatepreferences { orderNotifications? }
exports.updatepreferences = withVendor(async function (req, res, vendor) {
    await prefs.save('vendor', vendor.id, { alerts: req.body.orderNotifications });
    return res.json({ status: 200, message: 'Preferences saved' });
});

/** "18:30" or "18:30:00" -> "18:30:00"; anything else is rejected. */
function parseTime(value) {
    var m = String(value || '').match(/^([01]?\d|2[0-3]):([0-5]\d)(?::[0-5]\d)?$/);
    return m ? (m[1].length === 1 ? '0' + m[1] : m[1]) + ':' + m[2] + ':00' : null;
}

// POST /updatestorehours { opening_time, closing_time }
exports.updatestorehours = withVendor(async function (req, res, vendor) {
    var opening = parseTime(req.body.opening_time);
    var closing = parseTime(req.body.closing_time);
    if (!opening || !closing) return db.refuse(res, 'Choose an opening and a closing time.');
    if (opening === closing) return db.refuse(res, 'Opening and closing times cannot be the same.');
    await db.query('UPDATE vendors SET opening_time = ?, closing_time = ? WHERE id = ?',
        [opening, closing, vendor.id], 'store-hours');
    return res.json({ status: 200, message: 'Hours updated' });
});

// ─── Store settings ──────────────────────────────────────────────────────────

/**
 * POST /publishrates
 *
 * Fruits & Veg sell at a rate that is set fresh each morning, so publishing is
 * per-day: the sheet goes live for today and is stale again tomorrow. The rates
 * themselves are ordinary product prices and are saved by /saveproduct before
 * this is called.
 */
exports.publishrates = withVendor(async function (req, res, vendor) {
    await db.query('UPDATE vendors SET rates_published_on = CURDATE() WHERE id = ? AND d_in = 0', [vendor.id], 'publish-rates');
    return res.json({ status: 200, message: "Today's rates are live" });
});

// POST /updatesubstitution { allow }
exports.updatesubstitution = withVendor(async function (req, res, vendor) {
    var allow = req.body.allow === true || req.body.allow === 1 || req.body.allow === '1';
    await db.query('UPDATE vendors SET allow_substitution = ? WHERE id = ? AND d_in = 0', [allow ? 1 : 0, vendor.id], 'update-substitution');
    return res.json({ status: 200, message: allow ? 'Substitution allowed' : 'Substitution turned off' });
});

// POST /updatedaypart { daypart }
exports.updatedaypart = withVendor(async function (req, res, vendor) {
    var key = String(req.body.daypart || '').trim();
    // Scoped to this vendor's own rows, so one store cannot set another's window.
    var target = await db.one('SELECT id FROM vendor_dayparts WHERE vendor_id = ? AND daypart_key = ? AND d_in = 0 LIMIT 1',
        [vendor.id, key], 'daypart-find');
    if (!target) return db.refuse(res, 'That service window is not set up for this store.');

    await db.query('UPDATE vendor_dayparts SET is_active = IF(id = ?, 1, 0) WHERE vendor_id = ? AND d_in = 0',
        [target.id, vendor.id], 'daypart-activate');
    return res.json({ status: 200, message: 'Service window updated' });
});

// ─── Product images ──────────────────────────────────────────────────────────

/**
 * POST /uploadproductimage  (multipart: photo, product_id)
 *
 * product_images already exists and is what the dashboard reads, so one primary
 * row per product is kept there. The photo is saved in the shared upload folder
 * (see middleware/upload.js) and image_path holds its public URL, the same as
 * every dashboard image.
 */
exports.uploadproductimage = withVendor(async function (req, res, vendor) {
    if (!req.file) return db.refuse(res, 'Attach a photo to upload.');

    var productId = Number(req.body.product_id) || 0;
    var owned = await db.one('SELECT id FROM products WHERE id = ? AND vendor_id = ? AND d_in = 0', [productId, vendor.id], 'image-owned');
    if (!owned) {
        upload.removeStored(upload.publicPath(req.file)); // nothing refers to the file we just saved
        return db.refuse(res, 'That item is not on your store.');
    }

    var url = upload.publicPath(req.file);
    var existing = await db.one('SELECT id, image_path FROM product_images WHERE product_id = ? AND is_primary = 1 AND d_in = 0 LIMIT 1',
        [productId], 'image-existing');

    if (existing) {
        // image_data / image_mime are cleared: a row that used to keep its bytes in the database now points at the file.
        await db.query('UPDATE product_images SET image_path = ?, image_data = NULL, image_mime = NULL WHERE id = ?', [url, existing.id], 'image-update');
        upload.removeStored(existing.image_path); // the replaced photo, if it was a file
    } else {
        await db.query(
            'INSERT INTO product_images (product_id, image_path, image_order, is_primary, i_ts, d_in) VALUES (?, ?, 0, 1, NOW(), 0)',
            [productId, url], 'image-insert');
    }

    return res.json({ status: 200, message: 'Photo saved', image: url });
});

/** GET /productimage/:id - streams a photo stored in product_images.image_data. */
exports.productimage = async function (req, res) {
    try {
        var row = await db.one('SELECT image_data, image_mime FROM product_images WHERE id = ? AND d_in = 0', [Number(req.params.id) || 0], 'image-serve');
        if (!row || !row.image_data) return res.status(404).end();
        res.set('Content-Type', row.image_mime || 'image/jpeg');
        res.set('Cache-Control', 'public, max-age=86400');
        return res.end(row.image_data);
    } catch (e) {
        return res.status(500).end();
    }
};
