const db = require('../lib/db');
const auth = require('../middleware/auth');
const sms = require('../lib/sms');
const { fail, handle, id, text, uuid, hash, media, coordinates, distance } = require('../lib/core');

const response = (res, data, meta) => res.json(meta ? { data, meta } : { data });
const active = 'd_in=0';
const customerRow = async (tenantId, mobile) => db.one('SELECT * FROM customers WHERE tenant_id=? AND mobile_number=? AND d_in=0 LIMIT 1', [tenantId, mobile]);
const contentRow = async (tenantId, collection) => {
    try { return await db.one('SELECT published_json,revision FROM app_content WHERE tenant_id=? AND collection=?', [tenantId, collection]); }
    catch (_) { return null; }
};
function calendarDate(value) {
    const date = text(value, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
    const parsed = new Date(`${date}T00:00:00.000Z`);
    return Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== date ? null : date;
}

exports.bootstrap = handle(async (req, res) => {
    const settings = await db.one('SELECT currency_code,currency_symbol,timezone,primary_color,secondary_color,default_language,support_email,support_phone,terms_url,privacy_url FROM tenant_settings WHERE tenant_id=? AND d_in=0 LIMIT 1', [req.tenant.id]);
    const branding = await db.one('SELECT * FROM tenant_branding WHERE tenant_id=? AND d_in=0 LIMIT 1', [req.tenant.id]);
    return response(res, { tenant: { id: String(req.tenant.id), code: req.tenant.tenant_unique_code }, settings: settings || {}, branding: branding || {}, features: [] });
});

exports.onboarding = handle(async (req, res) => {
    const row = await contentRow(req.tenant.id, 'onboarding');
    const value = row && row.published_json ? JSON.parse(row.published_json) : { displayPolicy: 'first_use', slides: [] };
    return response(res, { revision: row ? row.revision : 0, displayPolicy: value.displayPolicy || 'first_use', slides: Array.isArray(value.slides) ? value.slides.map(s => ({ ...s, mediaUrl: media(req, s.mediaUrl || s.imageUrl) })) : [] });
});

exports.requestOtp = handle(async (req, res) => {
    const mobile = String(req.body.phoneNumber || '').replace(/\D/g, '').slice(-10);
    if (mobile.length !== 10) fail(400, 'INVALID_PHONE', 'Enter a valid 10-digit mobile number.');
    const requestId = uuid();
    const exposeDevelopmentOtp = process.env.NODE_ENV !== 'production' && process.env.MV_PUBLIC_RETURN_DEV_OTP === '1';
    const fixedTestNumbers = new Set(['7993563933', '6302404371']);
    const code = fixedTestNumbers.has(mobile)
        ? '2025'
        : exposeDevelopmentOtp
            ? (process.env.MV_PUBLIC_DEV_OTP || '1234')
            : String(Math.floor(1000 + Math.random() * 9000));
    if (process.env.MV_PUBLIC_LOG_OTP === '1') {
        console.log(`[public_app] login OTP for ${mobile}: ${code}`);
    }
    try {
        await sms.sendLoginOtp({ mobile, otp: code });
    } catch (error) {
        console.error('[public_app] login OTP SMS failed:', error.code || error.message);
        fail(502, 'OTP_DELIVERY_FAILED', 'Unable to send the OTP right now. Please try again.');
    }
    await db.query('INSERT INTO public_otp_challenges (id,tenant_id,mobile,digest,expires_at) VALUES (?,?,?,?,DATE_ADD(NOW(),INTERVAL 5 MINUTE))', [requestId, req.tenant.id, mobile, hash(code)]);
    if (exposeDevelopmentOtp) return res.json({ requestId, resendAfterSeconds: 30, developmentOtp: code });
    return res.json({ requestId, resendAfterSeconds: 30 });
});

exports.verifyOtp = handle(async (req, res) => {
    const mobile = String(req.body.phoneNumber || '').replace(/\D/g, '').slice(-10);
    const challenge = await db.one('SELECT * FROM public_otp_challenges WHERE id=? AND tenant_id=? AND mobile=? AND consumed_at IS NULL AND expires_at>NOW()', [req.body.requestId, req.tenant.id, mobile]);
    if (!challenge || Number(challenge.attempts) >= 5 || challenge.digest !== hash(req.body.otp)) fail(401, 'INVALID_OTP', 'The OTP is invalid or expired.');
    await db.query('UPDATE public_otp_challenges SET consumed_at=NOW() WHERE id=?', [challenge.id]);
    let customer = await customerRow(req.tenant.id, mobile);
    if (!customer) { const result = await db.query('INSERT INTO customers (tenant_id,mobile_number,customer_name,active_status,d_in) VALUES (?,?,?,1,0)', [req.tenant.id, mobile, '']); customer = { id: result.insertId, tenant_id: req.tenant.id, mobile_number: mobile, active_status: 1 }; }
    return res.json({ accessToken: auth.sign({ customerId: customer.id, tenantId: req.tenant.id }), customer: { id: String(customer.id), name: customer.customer_name || '', phoneNumber: mobile } });
});

exports.home = handle(async (req, res) => {
    const locationId = req.query.locationId ? id(req.query.locationId) : null;
    const vertical = text(req.query.vertical, 60);
    const content = await contentRow(req.tenant.id, 'home');
    const published = content && content.published_json ? JSON.parse(content.published_json) : {};
    const bannerWhere = `b.tenant_id=? AND ${active} AND b.is_active=1 AND (b.placement IS NULL OR b.placement IN ('home_header','home_promo'))`;
    let banners = [];
    try { banners = await db.query(`SELECT b.id,b.banner_image,b.link_type,b.vendor_id,b.product_id,b.external_url,b.banner_order,b.placement,b.category_id,b.subcategory_id,b.aspect_ratio,b.alt_text,bpv.id AS product_vendor_id FROM banners b LEFT JOIN products bp ON bp.id=b.product_id AND bp.d_in=0 LEFT JOIN vendors bpv ON bpv.id=bp.vendor_id AND bpv.tenant_id=b.tenant_id AND bpv.d_in=0 WHERE ${bannerWhere} AND (b.location_id IS NULL OR b.location_id=?) ORDER BY b.placement,b.banner_order,b.id`, [req.tenant.id, locationId]); } catch (_) { banners = []; }
    const categorySql = 'SELECT c.id,c.category_name,c.category_image,c.vertical,c.category_order,COUNT(ch.id) AS child_count FROM categories c LEFT JOIN categories ch ON ch.parent_id=c.id AND ch.tenant_id=c.tenant_id AND ch.d_in=0 AND ch.is_active=1 WHERE c.tenant_id=? AND c.parent_id IS NULL AND c.d_in=0 AND c.is_active=1' + (vertical ? ' AND c.vertical=?' : '') + ' GROUP BY c.id ORDER BY c.category_order,c.id';
    const categories = await db.query(categorySql, vertical ? [req.tenant.id, vertical] : [req.tenant.id]);
    const restaurantClauses = [];
    const restaurantParams = [req.tenant.id];
    if (locationId) { restaurantClauses.push('v.location_id=?'); restaurantParams.push(locationId); }
    if (vertical) {
        restaurantClauses.push('v.id IN (SELECT DISTINCT p.vendor_id FROM products p JOIN categories pc ON pc.id=p.category_id WHERE pc.tenant_id=? AND pc.vertical=? AND pc.d_in=0 AND pc.is_active=1 AND p.d_in=0 AND p.active_status=1 AND p.is_available=1)');
        restaurantParams.push(req.tenant.id, vertical);
    }
    const restaurants = await db.query(restaurantSelect(restaurantClauses.length ? restaurantClauses.join(' AND ') : '1=1', 'v.vendor_rating DESC,v.id DESC LIMIT 20'), restaurantParams);
    const headerBanners = banners.filter(b => (b.placement || 'home_promo') === 'home_header').map(bannerDto(req));
    const promoBanners = banners.filter(b => (b.placement || 'home_promo') !== 'home_header').map(bannerDto(req));
    return response(res, { revision: content ? content.revision : 0, headerBanners: headerBanners.length ? headerBanners : (published.headerBanners || []).map(publishedBannerDto(req)), banners: promoBanners.length ? promoBanners : (published.banners || []).map(publishedBannerDto(req)), categories: categories.map(c => ({ id: String(c.id), name: c.category_name || '', category_name: c.category_name || '', vertical: c.vertical || '', imageUrl: media(req, c.category_image), childCount: Number(c.child_count) })), restaurants: restaurants.map(r => ({ id: String(r.id), name: r.vendor_name, imageUrl: media(req, r.shop_image), rating: Number(r.average_rating || 0), ratingCount: Number(r.rating_count || 0), isVeg: Number(r.has_veg) === 1 && Number(r.has_non_veg) === 0, hasVegItems: Number(r.has_veg) === 1, hasNonVegItems: Number(r.has_non_veg) === 1, isBestSeller: Number(r.is_best_seller) === 1, area: r.area || r.city || '', online: Number(r.is_online) === 1, busy: Number(r.is_busy) === 1 })), tabs: Array.isArray(published.tabs) ? published.tabs.map(tab => ({ ...tab, imageUrl: media(req, tab.imageUrl) })) : [], filters: published.filters || [] });
});
function bannerDto(req) { return b => ({ id: String(b.id), placement: b.placement || 'home_promo', imageUrl: media(req, b.banner_image), aspectRatio: Number(b.aspect_ratio) || undefined, altText: b.alt_text || '', target: b.link_type === 'vendor' ? { type: 'restaurant', restaurantId: b.vendor_id && String(b.vendor_id) } : b.link_type === 'product' ? { type: 'product', productId: b.product_id && String(b.product_id), restaurantId: b.product_vendor_id && String(b.product_vendor_id) } : b.link_type === 'external' ? { type: 'external', url: b.external_url } : b.category_id ? { type: b.subcategory_id ? 'subcategory' : 'category', categoryId: String(b.category_id), ...(b.subcategory_id ? { subcategoryId: String(b.subcategory_id) } : {}) } : null }); }
function publishedBannerDto(req) { return b => ({ id: String(b.id || ''), placement: b.placement || 'home_promo', imageUrl: media(req, b.imageUrl || b.mediaUrl), aspectRatio: Number(b.aspectRatio) || undefined, altText: b.altText || b.title || '', target: b.target || null }); }

exports.categories = handle(async (req, res) => {
    const vertical = text(req.query.vertical, 60);
    const sql = 'SELECT c.id,c.category_name,c.category_image,c.vertical,c.category_order,COUNT(ch.id) AS child_count FROM categories c LEFT JOIN categories ch ON ch.parent_id=c.id AND ch.tenant_id=c.tenant_id AND ch.d_in=0 AND ch.is_active=1 WHERE c.tenant_id=? AND c.parent_id IS NULL AND c.d_in=0 AND c.is_active=1' + (vertical ? ' AND c.vertical=?' : '') + ' GROUP BY c.id ORDER BY c.vertical,c.category_order,c.id';
    const rows = await db.query(sql, vertical ? [req.tenant.id, vertical] : [req.tenant.id]);
    return response(res, rows.map(c => ({ id: String(c.id), name: c.category_name, imageUrl: media(req, c.category_image), vertical: c.vertical, childCount: Number(c.child_count), hasChildren: Number(c.child_count) > 0 })));
});
exports.subcategories = handle(async (req, res) => {
    const parentId = id(req.params.categoryId); const parent = await db.one('SELECT id FROM categories WHERE id=? AND tenant_id=? AND parent_id IS NULL AND d_in=0 AND is_active=1', [parentId, req.tenant.id]);
    if (!parent) fail(404, 'CATEGORY_NOT_FOUND', 'Category not found.');
    const rows = await db.query('SELECT id,category_name,category_image,vertical,category_order FROM categories WHERE parent_id=? AND tenant_id=? AND d_in=0 AND is_active=1 ORDER BY category_order,id', [parentId, req.tenant.id]);
    return response(res, rows.map(c => ({ id: String(c.id), parentId: String(parentId), name: c.category_name, imageUrl: media(req, c.category_image), vertical: c.vertical })));
});

function restaurantSelect(where, order = 'v.vendor_name') { return `SELECT DISTINCT v.id,v.vendor_name,v.shop_image,v.vendor_address,v.latitude,v.longitude,COALESCE(rs.average_rating,v.vendor_rating,0) AS average_rating,COALESCE(rs.rating_count,0) AS rating_count,COALESCE(ps.has_veg,0) AS has_veg,COALESCE(ps.has_non_veg,0) AS has_non_veg,COALESCE(ps.is_best_seller,0) AS is_best_seller,v.is_online,v.is_busy,v.opening_time,v.closing_time,l.area,l.city FROM vendors v LEFT JOIN locations l ON l.id=v.location_id LEFT JOIN (SELECT vendor_id,AVG(rating) AS average_rating,COUNT(*) AS rating_count FROM reviews WHERE d_in=0 AND vendor_id IS NOT NULL GROUP BY vendor_id) rs ON rs.vendor_id=v.id LEFT JOIN (SELECT vendor_id,MAX(CASE WHEN is_veg=1 THEN 1 ELSE 0 END) AS has_veg,MAX(CASE WHEN is_veg=0 THEN 1 ELSE 0 END) AS has_non_veg,MAX(is_featured) AS is_best_seller FROM products WHERE d_in=0 AND active_status=1 AND is_available=1 GROUP BY vendor_id) ps ON ps.vendor_id=v.id WHERE v.tenant_id=? AND v.d_in=0 AND v.active_status=1 AND ${where} ORDER BY ${order}`; }
exports.restaurants = handle(async (req, res) => {
    const params = [req.tenant.id]; let where = '1=1';
    if (req.query.locationId) { const locationId = id(req.query.locationId); const location = await db.one('SELECT id FROM locations WHERE id=? AND tenant_id=? AND active_status=1 AND d_in=0', [locationId, req.tenant.id]); if (!location) fail(400, 'LOCATION_INVALID', 'Choose an active delivery area.'); where += ' AND v.location_id=?'; params.push(locationId); }
    if (req.query.categoryId) { const categoryId = id(req.query.categoryId); const sub = req.query.subcategoryId ? id(req.query.subcategoryId) : null; if (sub) { const valid = await db.one('SELECT id FROM categories WHERE id=? AND parent_id=? AND tenant_id=? AND d_in=0 AND is_active=1', [sub, categoryId, req.tenant.id]); if (!valid) fail(400, 'INVALID_CATEGORY_PATH', 'Subcategory does not belong to category.'); where += ' AND EXISTS (SELECT 1 FROM products p WHERE p.vendor_id=v.id AND p.category_id=? AND p.d_in=0 AND p.active_status=1 AND p.is_available=1)'; params.push(sub); } else { where += ' AND EXISTS (SELECT 1 FROM products p JOIN categories pc ON pc.id=p.category_id WHERE p.vendor_id=v.id AND (p.category_id=? OR pc.parent_id=?) AND p.d_in=0 AND p.active_status=1 AND p.is_available=1)'; params.push(categoryId, categoryId); } }
    if (req.query.q) { where += ' AND v.vendor_name LIKE ?'; params.push('%' + text(req.query.q, 80) + '%'); }
    const rows = await db.query(restaurantSelect(where), params);
    return response(res, rows.map(r => ({ id: String(r.id), name: r.vendor_name, imageUrl: media(req, r.shop_image), address: r.vendor_address, area: r.area, city: r.city, rating: Number(r.average_rating || 0), ratingCount: Number(r.rating_count || 0), isVeg: Number(r.has_veg) === 1 && Number(r.has_non_veg) === 0, hasVegItems: Number(r.has_veg) === 1, hasNonVegItems: Number(r.has_non_veg) === 1, isBestSeller: Number(r.is_best_seller) === 1, online: Number(r.is_online) === 1, busy: Number(r.is_busy) === 1, latitude: r.latitude === null ? null : Number(r.latitude), longitude: r.longitude === null ? null : Number(r.longitude) })));
});
exports.restaurant = handle(async (req, res) => {
    const restaurantId = id(req.params.restaurantId);
    const row = await db.one(restaurantSelect('v.id=?', 'v.vendor_name'), [req.tenant.id, restaurantId]);
    if (!row) fail(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.');
    return response(res, { id: String(row.id), name: row.vendor_name, imageUrl: media(req, row.shop_image), address: row.vendor_address, area: row.area, city: row.city, rating: Number(row.average_rating || 0), ratingCount: Number(row.rating_count || 0), isVeg: Number(row.has_veg) === 1 && Number(row.has_non_veg) === 0, hasVegItems: Number(row.has_veg) === 1, hasNonVegItems: Number(row.has_non_veg) === 1, isBestSeller: Number(row.is_best_seller) === 1, online: Number(row.is_online) === 1, busy: Number(row.is_busy) === 1, latitude: row.latitude === null ? null : Number(row.latitude), longitude: row.longitude === null ? null : Number(row.longitude), hours: { opening: row.opening_time, closing: row.closing_time } });
});
exports.menu = handle(async (req, res) => {
    const restaurantId = id(req.params.restaurantId);
    const restaurant = await db.one('SELECT id FROM vendors WHERE id=? AND tenant_id=? AND d_in=0 AND active_status=1', [restaurantId, req.tenant.id]);
    if (!restaurant) fail(404, 'RESTAURANT_NOT_FOUND', 'Restaurant not found.');
    const rows = await db.query('SELECT p.id,p.product_name,p.description,p.base_price,p.discount_price,p.stock_quantity,p.is_veg,p.is_available,p.is_featured,p.category_id,c.category_name,pi.image_path FROM products p LEFT JOIN categories c ON c.id=p.category_id LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.d_in=0 AND pi.is_primary=1 WHERE p.vendor_id=? AND p.d_in=0 AND p.active_status=1 AND p.is_available=1 ORDER BY c.category_order,c.id,p.i_ts DESC', [restaurantId]);
    const variants = rows.length ? await db.query('SELECT id,product_id,variant_name,quantity_value,price,discount_price,stock_quantity,is_default FROM product_variants WHERE product_id IN (?) AND d_in=0 AND is_active=1 ORDER BY is_default DESC,id', [rows.map(r => r.id)]) : [];
    const ratings = rows.length ? await db.query('SELECT product_id,AVG(rating) AS average_rating,COUNT(*) AS rating_count FROM reviews WHERE product_id IN (?) AND d_in=0 GROUP BY product_id', [rows.map(r => r.id)]) : [];
    const ratingsByProduct = new Map(ratings.map(r => [String(r.product_id), { rating: Number(r.average_rating || 0), ratingCount: Number(r.rating_count || 0) }]));
    const byProduct = new Map();
    for (const variant of variants) {
        const list = byProduct.get(String(variant.product_id)) || [];
        list.push({ id: String(variant.id), name: variant.variant_name || '', quantity: variant.quantity_value === null ? null : Number(variant.quantity_value), pricePaise: Math.round(Number(variant.discount_price ?? variant.price ?? 0) * 100), originalPricePaise: Math.round(Number(variant.price || 0) * 100), stockQuantity: Number(variant.stock_quantity || 0), isDefault: Number(variant.is_default) === 1 });
        byProduct.set(String(variant.product_id), list);
    }
    const sections = [];
    for (const r of rows) {
        let section = sections.find(s => s.id === String(r.category_id));
        if (!section) { section = { id: String(r.category_id), title: r.category_name || 'Menu', items: [] }; sections.push(section); }
        const productRating = ratingsByProduct.get(String(r.id)) || { rating: 0, ratingCount: 0 };
        section.items.push({ id: String(r.id), name: r.product_name, description: r.description || '', pricePaise: Math.round(Number(r.discount_price ?? r.base_price ?? 0) * 100), originalPricePaise: Math.round(Number(r.base_price || 0) * 100), isVeg: Number(r.is_veg) === 1, isBestSeller: Number(r.is_featured) === 1, rating: productRating.rating, ratingCount: productRating.ratingCount, imageUrl: media(req, r.image_path), available: Number(r.stock_quantity) > 0, variants: byProduct.get(String(r.id)) || [] });
    }
    return response(res, { restaurantId: String(restaurantId), sections });
});

exports.checkoutConfig = handle(async (req, res) => {
    const [charges, content] = await Promise.all([
        db.one('SELECT handling_charge,packing_charge,donation_charge,rain_surge_charge,rain_surge_active,cod_enabled FROM tenant_charge_settings WHERE tenant_id=? AND d_in=0 LIMIT 1', [req.tenant.id]),
        contentRow(req.tenant.id, 'checkout'),
    ]);
    let published = {};
    try { published = content?.published_json ? JSON.parse(content.published_json) : {}; } catch (_) { published = {}; }
    const paymentMethods = charges && Number(charges.cod_enabled) !== 1 ? [] : [{ id: 'cod', label: 'Cash on Delivery', badge: 'COD' }];
    return response(res, {
        revision: content ? Number(content.revision || 0) : 0,
        paymentMethods,
        deliveryInstructions: Array.isArray(published.deliveryInstructions) ? published.deliveryInstructions.filter(item => item && item.id && item.label).map(item => ({ id: String(item.id), label: String(item.label) })) : [],
        tipOptions: Array.isArray(published.tipOptions) ? published.tipOptions.filter(item => item && item.id && Number.isFinite(Number(item.amount)) && Number(item.amount) > 0 && Number(item.amount) <= 1000).map(item => ({ id: String(item.id), amount: Number(item.amount), emoji: String(item.emoji || '') })) : [],
        scheduling: { enabled: published.scheduling?.enabled === true, advanceDays: Math.max(1, Math.min(14, Number(published.scheduling?.advanceDays) || 7)) },
        charges: {
            handlingCharge: Number(charges?.handling_charge || 0),
            packingCharge: Number(charges?.packing_charge || 0),
            donationCharge: Number(charges?.donation_charge || 0),
            rainSurgeCharge: Number(charges?.rain_surge_active) === 1 ? Number(charges?.rain_surge_charge || 0) : 0,
        },
    });
});
exports.me = handle(async (req, res) => { if (!req.customer) return response(res, null); return response(res, { id: String(req.customer.id), name: req.customer.customer_name || '', phoneNumber: req.customer.mobile_number, email: req.customer.email || '', gender: req.customer.gender || '' }); });
exports.updateMe = handle(async (req, res) => { const name = text(req.body.name, 255); const email = text(req.body.email, 255); const gender = text(req.body.gender, 20); await db.query('UPDATE customers SET customer_name=COALESCE(NULLIF(?,\'\'),customer_name),email=COALESCE(NULLIF(?,\'\'),email),gender=COALESCE(NULLIF(?,\'\'),gender) WHERE id=? AND tenant_id=? AND d_in=0', [name, email, gender, req.customer.id, req.tenant.id]); const customer = await customerRow(req.tenant.id, req.customer.mobile_number); return response(res, { id: String(customer.id), name: customer.customer_name || '', phoneNumber: customer.mobile_number, email: customer.email || '', gender: customer.gender || '' }); });
exports.logout = handle(async (req, res) => res.json({ data: { loggedOut: true } }));
exports.deleteAccount = handle(async (req, res) => { await db.query('UPDATE customers SET d_in=1,active_status=0 WHERE id=? AND tenant_id=?', [req.customer.id, req.tenant.id]); return response(res, { deleted: true }); });
exports.notifications = handle(async (req, res) => {
    const rows = await db.query("SELECT n.id,n.title,n.message,n.notification_type,n.sent_at,CASE WHEN r.notification_id IS NULL THEN 0 ELSE 1 END AS is_read FROM notifications n LEFT JOIN public_notification_receipts r ON r.notification_id=n.id AND r.customer_id=? WHERE n.tenant_id=? AND n.d_in=0 AND (n.target_type='all' OR (n.target_type='customer' AND (n.target_id=? OR n.target_id IS NULL))) ORDER BY COALESCE(n.sent_at,n.i_ts) DESC,n.id DESC LIMIT 100", [req.customer.id, req.tenant.id, req.customer.id]);
    return response(res, rows.map(n => ({ id: String(n.id), title: n.title || '', message: n.message || '', type: n.notification_type || 'system', createdAt: n.sent_at, read: Number(n.is_read) === 1 })));
});

exports.appUpdates = handle(async (req, res) => {
    const content = await contentRow(req.tenant.id, 'app_updates');
    let published = {};
    try { published = content?.published_json ? JSON.parse(content.published_json) : {}; } catch (_) {}
    return response(res, {
        revision: Number(content?.revision || 0),
        latestVersion: String(published.latestVersion || ''),
        releaseNotes: Array.isArray(published.releaseNotes) ? published.releaseNotes.filter(note => typeof note === 'string').slice(0, 30) : [],
        androidUrl: /^https?:\/\//i.test(String(published.androidUrl || '')) ? String(published.androidUrl) : null,
        iosUrl: /^https?:\/\//i.test(String(published.iosUrl || '')) ? String(published.iosUrl) : null,
    });
});
exports.deliverySlots = handle(async (req, res) => {
    const date = calendarDate(req.query.date);
    if (!date) fail(400, 'INVALID_DELIVERY_DATE', 'Choose a valid delivery date.');
    const configRow = await contentRow(req.tenant.id, 'checkout');
    let published = {};
    try { published = configRow?.published_json ? JSON.parse(configRow.published_json) : {}; } catch (_) {}
    if (published.scheduling?.enabled !== true) fail(409, 'SCHEDULING_DISABLED', 'Scheduled delivery is not available for this store.');
    const slotWindow = Math.max(1, Math.min(14, Number(published.scheduling?.advanceDays) || 7));
    const slotToday = new Date(); slotToday.setUTCHours(0, 0, 0, 0);
    const slotDate = new Date(`${date}T00:00:00.000Z`);
    const slotDayOffset = Math.round((slotDate.getTime() - slotToday.getTime()) / 86400000);
    if (slotDayOffset < 0 || slotDayOffset >= slotWindow) fail(400, 'DELIVERY_DATE_UNAVAILABLE', 'Choose a date within the available scheduling window.');
    const cart = await db.one('SELECT c.id,c.vendor_id FROM carts c JOIN vendors v ON v.id=c.vendor_id AND v.tenant_id=? AND v.d_in=0 WHERE c.customer_id=? AND c.status=0 AND c.d_in=0 ORDER BY c.id DESC LIMIT 1', [req.tenant.id, req.customer.id]);
    if (!cart) fail(400, 'CART_EMPTY', 'Add an item before choosing a delivery slot.');
    const rows = await db.query('SELECT s.id,s.slot_label,s.start_time,s.end_time,s.max_orders,COUNT(o.id) AS booked_orders FROM delivery_slots s LEFT JOIN orders o ON o.delivery_slot_id=s.id AND DATE(o.scheduled_for)=? AND o.order_status NOT IN (5,6) AND o.d_in=0 WHERE s.vendor_id=? AND s.slot_type=\'delivery\' AND s.is_active=1 AND s.d_in=0 AND ? >= CURDATE() AND (? > CURDATE() OR s.start_time > CURTIME()) GROUP BY s.id,s.slot_label,s.start_time,s.end_time,s.max_orders ORDER BY s.start_time,s.id', [date, cart.vendor_id, date, date]);
    const slots = rows.filter(slot => slot.max_orders === null || Number(slot.booked_orders) < Number(slot.max_orders)).map(slot => ({ id: String(slot.id), label: slot.slot_label || '', startTime: slot.start_time, endTime: slot.end_time, remainingOrders: slot.max_orders === null ? null : Math.max(0, Number(slot.max_orders) - Number(slot.booked_orders)) }));
    return response(res, { date, slots });
});
exports.markNotificationsRead = handle(async (req, res) => {
    const result = await db.query("INSERT INTO public_notification_receipts (customer_id,notification_id,read_at) SELECT ?,n.id,NOW() FROM notifications n WHERE n.tenant_id=? AND n.d_in=0 AND (n.target_type='all' OR (n.target_type='customer' AND (n.target_id=? OR n.target_id IS NULL))) ON DUPLICATE KEY UPDATE read_at=VALUES(read_at)", [req.customer.id, req.tenant.id, req.customer.id]);
    return response(res, { updated: Number(result.affectedRows || 0) });
});
exports.addresses = handle(async (req, res) => { const rows = await db.query('SELECT id,address_label,full_address,landmark,latitude,longitude,pincode,location_id,is_default,recipient_name,recipient_phone FROM customer_addresses WHERE customer_id=? AND d_in=0 ORDER BY is_default DESC,id DESC', [req.customer.id]); return response(res, rows.map(a => ({ id: String(a.id), addressLabel: a.address_label, fullAddress: a.full_address, landmark: a.landmark, latitude: a.latitude === null ? null : Number(a.latitude), longitude: a.longitude === null ? null : Number(a.longitude), pincode: a.pincode, locationId: a.location_id ? String(a.location_id) : null, isDefault: Number(a.is_default) === 1, recipientName: a.recipient_name || '', recipientPhone: a.recipient_phone || '' }))); });
exports.createAddress = handle(async (req, res) => {
    const body = req.body || {};
    if (!text(body.fullAddress || body.full_address, 1000)) fail(400, 'ADDRESS_REQUIRED', 'Full address is required.');
    const locationId = body.locationId ? id(body.locationId) : null;
    if (locationId && !await db.one('SELECT id FROM locations WHERE id=? AND tenant_id=? AND active_status=1 AND d_in=0', [locationId, req.tenant.id])) fail(400, 'LOCATION_INVALID', 'Choose an active delivery area.');
    const result = await db.transaction(async q => {
        if (body.isDefault) await q('UPDATE customer_addresses SET is_default=0 WHERE customer_id=? AND d_in=0', [req.customer.id]);
        return q('INSERT INTO customer_addresses (customer_id,address_label,full_address,landmark,latitude,longitude,pincode,location_id,is_default,recipient_name,recipient_phone) VALUES (?,?,?,?,?,?,?,?,?,?,?)', [req.customer.id, text(body.addressLabel || body.address_label || 'home', 50), text(body.fullAddress || body.full_address, 1000), text(body.landmark, 255) || null, body.latitude ?? null, body.longitude ?? null, text(body.pincode, 15) || null, locationId, body.isDefault ? 1 : 0, text(body.recipientName, 150) || null, text(body.recipientPhone, 20) || null]);
    });
    return response(res, { id: String(result.insertId) });
});
exports.updateAddress = handle(async (req, res) => {
    const addressId = id(req.params.addressId); const body = req.body || {};
    const locationId = body.locationId ? id(body.locationId) : null;
    if (locationId && !await db.one('SELECT id FROM locations WHERE id=? AND tenant_id=? AND active_status=1 AND d_in=0', [locationId, req.tenant.id])) fail(400, 'LOCATION_INVALID', 'Choose an active delivery area.');
    const result = await db.query('UPDATE customer_addresses SET address_label=COALESCE(?,address_label),full_address=COALESCE(?,full_address),landmark=COALESCE(?,landmark),latitude=COALESCE(?,latitude),longitude=COALESCE(?,longitude),pincode=COALESCE(?,pincode),location_id=COALESCE(?,location_id),recipient_name=COALESCE(?,recipient_name),recipient_phone=COALESCE(?,recipient_phone) WHERE id=? AND customer_id=? AND d_in=0', [body.addressLabel || body.address_label || null, body.fullAddress || body.full_address || null, body.landmark || null, body.latitude ?? null, body.longitude ?? null, body.pincode || null, locationId, body.recipientName || null, body.recipientPhone || null, addressId, req.customer.id]);
    if (!result.affectedRows) fail(404, 'ADDRESS_NOT_FOUND', 'Address not found.');
    return response(res, { id: String(addressId) });
});
exports.deleteAddress = handle(async (req, res) => { const result = await db.query('UPDATE customer_addresses SET d_in=1,is_default=0 WHERE id=? AND customer_id=? AND d_in=0', [id(req.params.addressId), req.customer.id]); if (!result.affectedRows) fail(404, 'ADDRESS_NOT_FOUND', 'Address not found.'); return response(res, { deleted: true }); });
exports.defaultAddress = handle(async (req, res) => { const addressId = id(req.params.addressId); await db.transaction(async q => { const found = await q('SELECT id FROM customer_addresses WHERE id=? AND customer_id=? AND d_in=0', [addressId, req.customer.id]); if (!found.length) fail(404, 'ADDRESS_NOT_FOUND', 'Address not found.'); await q('UPDATE customer_addresses SET is_default=0 WHERE customer_id=? AND d_in=0', [req.customer.id]); await q('UPDATE customer_addresses SET is_default=1 WHERE id=? AND customer_id=?', [addressId, req.customer.id]); }); return response(res, { id: String(addressId), isDefault: true }); });

async function cartPayload(req, cart) {
    if (!cart) return { id: null, restaurantId: null, items: [], itemCount: 0 };
    const rows = await db.query('SELECT ci.id,ci.product_variant_id,ci.quantity,ci.price_at_add,pv.variant_name,pv.product_id,p.product_name,p.vendor_id,v.vendor_name,pi.image_path FROM cart_items ci JOIN product_variants pv ON pv.id=ci.product_variant_id JOIN products p ON p.id=pv.product_id JOIN vendors v ON v.id=p.vendor_id LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=1 AND pi.d_in=0 WHERE ci.cart_id=? AND ci.d_in=0 ORDER BY ci.id', [cart.id]);
    return { id: String(cart.id), restaurantId: String(cart.vendor_id), restaurantName: rows[0] ? rows[0].vendor_name : '', items: rows.map(item => ({ id: String(item.id), productId: String(item.product_id), productVariantId: String(item.product_variant_id), name: item.product_name, variantName: item.variant_name || '', quantity: Number(item.quantity), unitPricePaise: Math.round(Number(item.price_at_add || 0) * 100), imageUrl: media(req, item.image_path) })), itemCount: rows.reduce((sum, item) => sum + Number(item.quantity), 0) };
}

exports.cart = handle(async (req, res) => {
    const cart = await db.one('SELECT id,vendor_id FROM carts WHERE customer_id=? AND status=0 AND d_in=0 ORDER BY id DESC LIMIT 1', [req.customer.id]);
    return response(res, await cartPayload(req, cart));
});
exports.addCartItem = handle(async (req, res) => {
    const restaurantId = id(req.body.restaurantId); const requestedVariantId = req.body.productVariantId ? id(req.body.productVariantId) : null; const requestedProductId = req.body.productId ? id(req.body.productId) : null; const quantity = req.body.quantity === undefined ? 1 : Number(req.body.quantity);
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) fail(400, 'INVALID_QUANTITY', 'Choose a quantity between 1 and 99.');
    if (!requestedVariantId && !requestedProductId) fail(400, 'PRODUCT_REQUIRED', 'Select a menu item first.');
    const variant = await db.one(`SELECT pv.id,pv.product_id,pv.price,pv.discount_price,pv.stock_quantity,p.vendor_id FROM product_variants pv JOIN products p ON p.id=pv.product_id JOIN vendors v ON v.id=p.vendor_id WHERE ${requestedVariantId ? 'pv.id=?' : 'pv.product_id=? AND pv.is_default=1'} AND pv.d_in=0 AND pv.is_active=1 AND p.vendor_id=? AND p.d_in=0 AND p.active_status=1 AND p.is_available=1 AND v.tenant_id=? AND v.d_in=0 AND v.active_status=1`, [requestedVariantId || requestedProductId, restaurantId, req.tenant.id]);
    if (!variant) fail(404, 'PRODUCT_VARIANT_NOT_FOUND', 'The selected menu item is no longer available.');
    const price = Number(variant.discount_price ?? variant.price);
    if (variant.price == null || !Number.isFinite(Number(variant.price)) || Number(variant.price) < 0 || !Number.isFinite(price) || price < 0 || price > Number(variant.price)) fail(409, 'INVALID_PRICE', 'This menu item does not have a valid price.');
    const cart = await db.one('SELECT id,vendor_id FROM carts WHERE customer_id=? AND status=0 AND d_in=0 ORDER BY id DESC LIMIT 1', [req.customer.id]);
    if (cart && Number(cart.vendor_id) !== restaurantId) fail(409, 'CART_RESTAURANT_MISMATCH', 'Your cart contains items from another restaurant.');
    const activeCart = cart || await db.transaction(async q => { const result = await q('INSERT INTO carts (customer_id,vendor_id,status,d_in) VALUES (?,?,0,0)', [req.customer.id, restaurantId]); return { id: result.insertId, vendor_id: restaurantId }; });
    const existing = await db.one('SELECT id,quantity FROM cart_items WHERE cart_id=? AND product_variant_id=? AND d_in=0 LIMIT 1', [activeCart.id, variant.id]);
    const nextQuantity = Number(existing?.quantity || 0) + quantity;
    if (nextQuantity > Number(variant.stock_quantity)) fail(409, 'INSUFFICIENT_STOCK', 'The selected quantity is not available.');
    if (existing) await db.query('UPDATE cart_items SET quantity=?,price_at_add=? WHERE id=?', [nextQuantity, price, existing.id]);
    else await db.query('INSERT INTO cart_items (cart_id,product_variant_id,quantity,price_at_add,d_in) VALUES (?,?,?,?,0)', [activeCart.id, variant.id, quantity, price]);
    return response(res, await cartPayload(req, activeCart));
});
exports.updateCartItem = handle(async (req, res) => { const itemId = id(req.params.itemId); const quantity = Number(req.body.quantity); const item = await db.one('SELECT ci.id,ci.cart_id,ci.product_variant_id,pv.stock_quantity FROM cart_items ci JOIN product_variants pv ON pv.id=ci.product_variant_id JOIN carts c ON c.id=ci.cart_id WHERE ci.id=? AND c.customer_id=? AND c.status=0 AND ci.d_in=0', [itemId, req.customer.id]); if (!item) fail(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found.'); if (!Number.isInteger(quantity) || quantity < 1 || quantity > Number(item.stock_quantity)) fail(400, 'INVALID_QUANTITY', 'Choose an available quantity.'); await db.query('UPDATE cart_items SET quantity=? WHERE id=?', [quantity, itemId]); return response(res, await cartPayload(req, await db.one('SELECT id,vendor_id FROM carts WHERE id=?', [item.cart_id]))); });
exports.deleteCartItem = handle(async (req, res) => { const itemId = id(req.params.itemId); const item = await db.one('SELECT ci.id,ci.cart_id FROM cart_items ci JOIN carts c ON c.id=ci.cart_id WHERE ci.id=? AND c.customer_id=? AND c.status=0 AND ci.d_in=0', [itemId, req.customer.id]); if (!item) fail(404, 'CART_ITEM_NOT_FOUND', 'Cart item not found.'); await db.query('UPDATE cart_items SET d_in=1 WHERE id=?', [itemId]); return response(res, await cartPayload(req, await db.one('SELECT id,vendor_id FROM carts WHERE id=?', [item.cart_id]))); });
exports.clearCart = handle(async (req, res) => { await db.query('UPDATE carts SET status=2 WHERE customer_id=? AND status=0 AND d_in=0', [req.customer.id]); return response(res, { id: null, restaurantId: null, items: [], itemCount: 0 }); });

exports.search = handle(async (req, res) => {
    const q = text(req.query.q, 100);
    if (q.length < 2) return response(res, { restaurants: [], products: [], categories: [] });
    const like = '%' + q + '%';
    const locationId = req.query.locationId ? id(req.query.locationId) : null;
    if (locationId && !await db.one('SELECT id FROM locations WHERE id=? AND tenant_id=? AND active_status=1 AND d_in=0', [locationId, req.tenant.id])) fail(400, 'LOCATION_INVALID', 'Choose an active delivery area.');
    const [restaurants, products, categories] = await Promise.all([
        db.query('SELECT id,vendor_name,shop_image,vendor_rating FROM vendors WHERE tenant_id=? AND d_in=0 AND active_status=1 AND (? IS NULL OR location_id=?) AND vendor_name LIKE ? ORDER BY vendor_rating DESC,id DESC LIMIT 20', [req.tenant.id, locationId, locationId, like]),
        db.query('SELECT p.id,p.vendor_id,p.product_name,p.base_price,p.discount_price,pi.image_path FROM products p JOIN vendors v ON v.id=p.vendor_id LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=1 AND pi.d_in=0 WHERE v.tenant_id=? AND (? IS NULL OR v.location_id=?) AND p.d_in=0 AND p.active_status=1 AND p.is_available=1 AND p.product_name LIKE ? ORDER BY p.is_featured DESC,p.id DESC LIMIT 30', [req.tenant.id, locationId, locationId, like]),
        db.query('SELECT id,category_name,category_image,parent_id FROM categories WHERE tenant_id=? AND d_in=0 AND is_active=1 AND category_name LIKE ? ORDER BY category_order,id LIMIT 20', [req.tenant.id, like]),
    ]);
    return response(res, { restaurants: restaurants.map(r => ({ id: String(r.id), name: r.vendor_name, imageUrl: media(req, r.shop_image), rating: Number(r.vendor_rating || 0) })), products: products.map(p => ({ id: String(p.id), restaurantId: String(p.vendor_id), name: p.product_name, pricePaise: Math.round(Number(p.discount_price ?? p.base_price ?? 0) * 100), imageUrl: media(req, p.image_path) })), categories: categories.map(c => ({ id: String(c.id), name: c.category_name, parentId: c.parent_id ? String(c.parent_id) : null, imageUrl: media(req, c.category_image) })) });
});

exports.coupons = handle(async (req, res) => {
    const rows = await db.query('SELECT id,coupon_code,description,discount_type,discount_value,max_discount_amount,min_order_value,valid_upto FROM coupons WHERE tenant_id=? AND d_in=0 AND is_active=1 AND (valid_from IS NULL OR valid_from<=NOW()) AND (valid_upto IS NULL OR valid_upto>=NOW()) ORDER BY id DESC', [req.tenant.id]);
    return response(res, rows.map(c => ({ id: String(c.id), code: c.coupon_code, description: c.description || '', discountType: c.discount_type, discountValue: Number(c.discount_value || 0), maxDiscount: c.max_discount_amount === null ? null : Number(c.max_discount_amount), minimumOrder: Number(c.min_order_value || 0), validUntil: c.valid_upto }))); 
});
exports.validateCoupon = handle(async (req, res) => {
    const code = text(req.body.code, 50).toUpperCase(); const subtotal = Number(req.body.subtotal || 0);
    const coupon = await db.one('SELECT * FROM coupons WHERE tenant_id=? AND coupon_code=? AND d_in=0 AND is_active=1 AND (valid_from IS NULL OR valid_from<=NOW()) AND (valid_upto IS NULL OR valid_upto>=NOW())', [req.tenant.id, code]);
    if (!coupon) fail(400, 'COUPON_INVALID', 'This coupon is not available.');
    if (subtotal < Number(coupon.min_order_value || 0)) fail(400, 'COUPON_MINIMUM_NOT_MET', `Add more items to use ${code}.`);
    const discount = coupon.discount_type === 'percentage' ? Math.min(subtotal * Number(coupon.discount_value || 0) / 100, coupon.max_discount_amount === null ? subtotal : Number(coupon.max_discount_amount)) : Math.min(subtotal, Number(coupon.discount_value || 0));
    return response(res, { valid: true, code, discount: Number(discount.toFixed(2)), description: coupon.description || '' });
});

function orderStatusLabel(status) { return ({ 0: 'Placed', 1: 'Accepted', 2: 'Preparing', 3: 'Out for delivery', 4: 'Delivered', 5: 'Cancelled', 6: 'Rejected', 7: 'Ready' })[Number(status)] || 'Placed'; }
exports.orders = handle(async (req, res) => {
    const rows = await db.query('SELECT o.id,o.order_number,o.vendor_id,o.grand_total,o.item_count,o.order_status,o.order_date_time,o.scheduled_for,o.payment_type,o.address_snapshot,ds.slot_label AS delivery_slot_label,v.vendor_name,v.shop_image FROM orders o LEFT JOIN vendors v ON v.id=o.vendor_id LEFT JOIN delivery_slots ds ON ds.id=o.delivery_slot_id AND ds.vendor_id=o.vendor_id WHERE o.customer_id=? AND o.d_in=0 ORDER BY o.id DESC LIMIT 100', [req.customer.id]);
    const items = rows.length ? await db.query(`SELECT order_id,product_name_snapshot,quantity FROM order_items WHERE order_id IN (${rows.map(() => '?').join(',')}) AND d_in=0 ORDER BY id`, rows.map(o => o.id)) : [];
    const itemsByOrder = new Map();
    for (const item of items) {
        const orderItems = itemsByOrder.get(String(item.order_id)) || [];
        orderItems.push({ name: item.product_name_snapshot || '', quantity: Number(item.quantity || 0) });
        itemsByOrder.set(String(item.order_id), orderItems);
    }
    return response(res, rows.map(o => {
        let address = null;
        try { address = o.address_snapshot ? JSON.parse(o.address_snapshot) : null; } catch (_) {}
        return {
            id: String(o.id), orderNumber: o.order_number, restaurantId: String(o.vendor_id), restaurantName: o.vendor_name || '',
            restaurantImageUrl: media(req, o.shop_image), totalPaise: Math.round(Number(o.grand_total || 0) * 100), itemCount: Number(o.item_count || 0),
            items: itemsByOrder.get(String(o.id)) || [],
            addressLabel: address?.label || '', addressLine: address?.line || '',
            status: orderStatusLabel(o.order_status), statusCode: Number(o.order_status), paymentType: o.payment_type,
            placedAt: o.order_date_time, scheduledFor: o.scheduled_for || null, deliverySlotLabel: o.delivery_slot_label || null,
        };
    }));
});
exports.order = handle(async (req, res) => { const orderId = id(req.params.orderId); const row = await db.one('SELECT o.*,ds.slot_label AS delivery_slot_label,v.vendor_name,v.shop_image,v.vendor_mobile_number AS restaurant_phone,ca.address_label,ca.full_address,ca.landmark,ca.pincode,ca.location_id,ca.recipient_name,ca.recipient_phone,dp.name AS delivery_partner_name,dp.mobile_number AS delivery_partner_phone,dp.vehicle_type AS delivery_partner_vehicle FROM orders o LEFT JOIN delivery_slots ds ON ds.id=o.delivery_slot_id AND ds.vendor_id=o.vendor_id LEFT JOIN vendors v ON v.id=o.vendor_id LEFT JOIN customer_addresses ca ON ca.id=o.customer_address_id LEFT JOIN (SELECT order_id,MAX(id) AS assignment_id FROM delivery_assignments WHERE d_in=0 GROUP BY order_id) last_assignment ON last_assignment.order_id=o.id LEFT JOIN delivery_assignments da ON da.id=last_assignment.assignment_id LEFT JOIN delivery_partners dp ON dp.id=da.delivery_partner_id AND dp.d_in=0 WHERE o.id=? AND o.customer_id=? AND o.d_in=0', [orderId, req.customer.id]); if (!row) fail(404, 'ORDER_NOT_FOUND', 'Order not found.'); const items = await db.query('SELECT oi.id,oi.product_variant_id,oi.product_name_snapshot,oi.quantity,oi.unit_price,oi.total_price,pv.product_id,pi.image_path,COALESCE(pr.average_rating,0) AS average_rating,COALESCE(pr.rating_count,0) AS rating_count FROM order_items oi LEFT JOIN product_variants pv ON pv.id=oi.product_variant_id LEFT JOIN product_images pi ON pi.product_id=pv.product_id AND pi.is_primary=1 AND pi.d_in=0 LEFT JOIN (SELECT product_id,AVG(rating) AS average_rating,COUNT(*) AS rating_count FROM reviews WHERE d_in=0 AND product_id IS NOT NULL GROUP BY product_id) pr ON pr.product_id=pv.product_id WHERE oi.order_id=? AND oi.d_in=0 ORDER BY oi.id', [orderId]); const review = await db.one('SELECT rating,review_text FROM reviews WHERE order_id=? AND customer_id=? AND d_in=0 LIMIT 1', [orderId, req.customer.id]); let billBreakdown = null; let addressSnapshot = null; try { billBreakdown = row.bill_snapshot ? JSON.parse(row.bill_snapshot) : null; addressSnapshot = row.address_snapshot ? JSON.parse(row.address_snapshot) : null; } catch (_) {} return response(res, { id: String(row.id), orderNumber: row.order_number, restaurantId: String(row.vendor_id), restaurantName: row.vendor_name || '', restaurantPhone: row.restaurant_phone || '', restaurantImageUrl: media(req, row.shop_image), status: orderStatusLabel(row.order_status), statusCode: Number(row.order_status), paymentType: row.payment_type, placedAt: row.order_date_time, scheduledFor: row.scheduled_for || null, deliverySlotLabel: row.delivery_slot_label || null, addressId: row.customer_address_id ? String(row.customer_address_id) : null, address: addressSnapshot || { label: row.address_label || "", line: row.full_address || "", landmark: row.landmark || "", pincode: row.pincode || "", locationId: row.location_id ? String(row.location_id) : null, name: row.recipient_name || "", phone: row.recipient_phone || "" }, deliveryPartner: row.delivery_partner_name ? { name: row.delivery_partner_name, phone: row.delivery_partner_phone || "", vehicleType: row.delivery_partner_vehicle || "" } : null, packingPaise: Math.round(Number(row.packing_charges || 0) * 100), subtotalPaise: Math.round(Number(row.sub_total || 0) * 100), discountPaise: Math.round(Number(row.discount_amount || 0) * 100), taxPaise: Math.round(Number(row.tax_amount || 0) * 100), deliveryPaise: Math.round(Number(row.delivery_charges || 0) * 100), tipPaise: Math.round(Number(row.tip_amount || 0) * 100), totalPaise: Math.round(Number(row.grand_total || 0) * 100), instructions: row.order_instructions || '', review: review ? { rating: Number(review.rating), comment: review.review_text || '' } : null, billBreakdown, items: items.map(i => ({ id: String(i.id), productVariantId: String(i.product_variant_id), name: i.product_name_snapshot, quantity: Number(i.quantity), unitPricePaise: Math.round(Number(i.unit_price || 0) * 100), totalPaise: Math.round(Number(i.total_price || 0) * 100), imageUrl: media(req, i.image_path), rating: Number(i.average_rating || 0), ratingCount: Number(i.rating_count || 0) })) }); });
exports.orderReview = handle(async (req, res) => {
    const orderId = id(req.params.orderId);
    const rating = Number(req.body.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) fail(400, 'INVALID_RATING', 'Choose a rating from 1 to 5.');
    const reviewText = text(req.body.comment, 1000);
    const order = await db.one('SELECT o.id,o.vendor_id,o.order_status FROM orders o JOIN vendors v ON v.id=o.vendor_id AND v.tenant_id=? WHERE o.id=? AND o.customer_id=? AND o.d_in=0', [req.tenant.id, orderId, req.customer.id]);
    if (!order) fail(404, 'ORDER_NOT_FOUND', 'Order not found.');
    if (Number(order.order_status) !== 4) fail(409, 'ORDER_NOT_DELIVERED', 'You can review an order after it has been delivered.');
    await db.transaction(async q => {
        const rows = await q('SELECT id FROM reviews WHERE order_id=? AND customer_id=? AND d_in=0 LIMIT 1', [orderId, req.customer.id]);
        if (rows.length) await q('UPDATE reviews SET rating=?,review_text=? WHERE id=? AND customer_id=? AND d_in=0', [rating, reviewText || null, rows[0].id, req.customer.id]);
        else await q('INSERT INTO reviews (order_id,customer_id,vendor_id,rating,review_text,d_in) VALUES (?,?,?,?,?,0)', [orderId, req.customer.id, order.vendor_id, rating, reviewText || null]);
    });
    return response(res, { orderId: String(orderId), rating, comment: reviewText });
});
exports.orderTracking = handle(async (req, res) => { const orderId = id(req.params.orderId); const row = await db.one('SELECT o.id,o.order_number,o.order_status,o.order_date_time,o.accepted_at,o.ready_at,o.picked_up_at,o.delivered_at,o.cancelled_at,o.prep_minutes,da.id AS assignment_id,da.assignment_status,da.delivery_partner_id,dp.name AS delivery_partner_name,dp.mobile_number AS delivery_partner_phone,dp.vehicle_type AS delivery_partner_vehicle FROM orders o LEFT JOIN delivery_assignments da ON da.order_id=o.id AND da.d_in=0 LEFT JOIN delivery_partners dp ON dp.id=da.delivery_partner_id AND dp.d_in=0 WHERE o.id=? AND o.customer_id=? AND o.d_in=0 ORDER BY da.id DESC LIMIT 1', [orderId, req.customer.id]); if (!row) fail(404, 'ORDER_NOT_FOUND', 'Order not found.'); const latest = row.assignment_id ? await db.one('SELECT latitude,longitude,status_note,recorded_at FROM delivery_tracking WHERE delivery_assignment_id=? AND d_in=0 ORDER BY recorded_at DESC,id DESC LIMIT 1', [row.assignment_id]) : null; return response(res, { orderId: String(row.id), orderNumber: row.order_number, status: orderStatusLabel(row.order_status), statusCode: Number(row.order_status), deliveryPartner: row.delivery_partner_id && row.delivery_partner_name ? { id: String(row.delivery_partner_id), name: row.delivery_partner_name, phone: row.delivery_partner_phone || "", vehicleType: row.delivery_partner_vehicle || "" } : null, estimatedPrepMinutes: row.prep_minutes === null ? null : Number(row.prep_minutes), milestones: [{ key: 'placed', at: row.order_date_time }, { key: 'accepted', at: row.accepted_at }, { key: 'ready', at: row.ready_at }, { key: 'picked_up', at: row.picked_up_at }, { key: 'delivered', at: row.delivered_at }], courierLocation: latest ? { latitude: latest.latitude === null ? null : Number(latest.latitude), longitude: latest.longitude === null ? null : Number(latest.longitude), note: latest.status_note || '', recordedAt: latest.recorded_at } : null }); });
exports.createOrder = handle(async (req, res) => {
    const addressId = id(req.body.addressId); const paymentType = req.body.paymentType === 'online' ? 'online' : 'cod';
    if (paymentType === 'online') fail(409, 'ONLINE_PAYMENT_NOT_CONFIGURED', 'Online payment is not configured yet. Choose Cash on Delivery.');
    let deliverySchedule = null;
    if (req.body.deliverySlotId || req.body.scheduledDate) {
        if (!req.body.deliverySlotId || !req.body.scheduledDate) fail(400, 'INVALID_DELIVERY_SCHEDULE', 'Choose both a delivery date and time slot.');
        const scheduledDate = calendarDate(req.body.scheduledDate);
        if (!scheduledDate) fail(400, 'INVALID_DELIVERY_DATE', 'Choose a valid delivery date.');
        const content = await contentRow(req.tenant.id, 'checkout');
        let published = {};
        try { published = content?.published_json ? JSON.parse(content.published_json) : {}; } catch (_) {}
        const scheduleConfig = published.scheduling || {};
        if (scheduleConfig.enabled !== true) fail(409, 'SCHEDULING_DISABLED', 'Scheduled delivery is not available for this store.');
        const advanceDays = Math.max(1, Math.min(14, Number(scheduleConfig.advanceDays) || 7));
        const today = new Date(); today.setUTCHours(0, 0, 0, 0);
        const requested = new Date(`${scheduledDate}T00:00:00.000Z`);
        const dayOffset = Math.round((requested.getTime() - today.getTime()) / 86400000);
        if (dayOffset < 0 || dayOffset >= advanceDays) fail(400, 'DELIVERY_DATE_UNAVAILABLE', 'Choose a date within the available scheduling window.');
        deliverySchedule = { slotId: id(req.body.deliverySlotId), date: scheduledDate };
    }
    const paymentModes = await db.one('SELECT cod_enabled FROM tenant_charge_settings WHERE tenant_id=? AND d_in=0 LIMIT 1', [req.tenant.id]);
    if (paymentType === 'cod' && paymentModes && Number(paymentModes.cod_enabled) !== 1) fail(409, 'COD_DISABLED', 'Cash on Delivery is not available for this store.');
    const address = await db.one('SELECT id,location_id,address_label,full_address,landmark,pincode,recipient_name,recipient_phone FROM customer_addresses WHERE id=? AND customer_id=? AND d_in=0', [addressId, req.customer.id]);
    if (!address) fail(400, 'ADDRESS_NOT_FOUND', 'Choose a saved delivery address.');
    if (address.location_id && !await db.one('SELECT id FROM locations WHERE id=? AND tenant_id=? AND active_status=1 AND d_in=0', [address.location_id, req.tenant.id])) fail(409, 'ADDRESS_NOT_SERVICEABLE', 'The saved delivery area is no longer available. Choose another address.');
    const cart = await db.one('SELECT id,vendor_id FROM carts WHERE customer_id=? AND status=0 AND d_in=0 ORDER BY id DESC LIMIT 1', [req.customer.id]);
    if (!cart) fail(400, 'CART_EMPTY', 'Add an item before placing the order.');
    const vendor = await db.one('SELECT location_id FROM vendors WHERE id=? AND tenant_id=? AND active_status=1 AND d_in=0', [cart.vendor_id, req.tenant.id]);
    if (!vendor) fail(409, 'RESTAURANT_UNAVAILABLE', 'This restaurant is no longer available.');
    if (address.location_id && vendor.location_id && Number(address.location_id) !== Number(vendor.location_id)) fail(409, 'RESTAURANT_NOT_SERVICEABLE', 'This restaurant does not deliver to the selected address.');
    if (deliverySchedule) {
        const slot = await db.one('SELECT id,start_time,max_orders FROM delivery_slots WHERE id=? AND vendor_id=? AND slot_type=\'delivery\' AND is_active=1 AND d_in=0 AND (? > CURDATE() OR start_time > CURTIME())', [deliverySchedule.slotId, cart.vendor_id, deliverySchedule.date]);
        if (!slot) fail(409, 'DELIVERY_SLOT_UNAVAILABLE', 'That delivery slot is no longer available.');
        if (slot.max_orders !== null) {
            const capacity = await db.one('SELECT COUNT(*) AS booked_orders FROM orders WHERE delivery_slot_id=? AND DATE(scheduled_for)=? AND order_status NOT IN (5,6) AND d_in=0', [deliverySchedule.slotId, deliverySchedule.date]);
            if (Number(capacity?.booked_orders || 0) >= Number(slot.max_orders)) fail(409, 'DELIVERY_SLOT_FULL', 'That delivery slot is full. Choose another time.');
        }
        deliverySchedule.scheduledFor = `${deliverySchedule.date} ${String(slot.start_time).slice(0, 8)}`;
    }
    const lines = await db.query('SELECT ci.product_variant_id,ci.quantity,pv.variant_name,pv.price,pv.discount_price,pv.stock_quantity,pv.is_active AS variant_active,pv.d_in AS variant_deleted,p.product_name,p.vendor_id,p.active_status AS product_active,p.is_available,p.d_in AS product_deleted FROM cart_items ci LEFT JOIN product_variants pv ON pv.id=ci.product_variant_id LEFT JOIN products p ON p.id=pv.product_id WHERE ci.cart_id=? AND ci.d_in=0', [cart.id]);
    if (!lines.length) fail(400, 'CART_EMPTY', 'Add an item before placing the order.');
    for (const line of lines) {
        if (Number(line.vendor_id) !== Number(cart.vendor_id) || Number(line.variant_active) !== 1 || Number(line.variant_deleted) !== 0 || Number(line.product_active) !== 1 || Number(line.product_deleted) !== 0 || Number(line.is_available) !== 1) fail(409, 'PRODUCT_UNAVAILABLE', 'A menu item in your cart is no longer available.');
        const price = Number(line.discount_price ?? line.price);
        if (line.price == null || !Number.isFinite(Number(line.price)) || Number(line.price) < 0 || !Number.isFinite(price) || price < 0 || price > Number(line.price)) fail(409, 'INVALID_PRICE', 'A menu item in your cart does not have a valid price.');
        if (!Number.isInteger(Number(line.quantity)) || Number(line.quantity) < 1 || Number(line.quantity) > Number(line.stock_quantity)) fail(409, 'INSUFFICIENT_STOCK', 'A menu item in your cart no longer has the requested quantity.');
    }
    const subtotal = lines.reduce((sum, line) => sum + Number(line.discount_price ?? line.price ?? 0) * Number(line.quantity), 0);
    const tip = Number(req.body.tipAmount || 0);
    if (!Number.isFinite(tip) || tip < 0 || tip > 1000) fail(400, 'INVALID_TIP', 'Choose a valid tip amount.');
    let discount = 0;
    const couponCode = text(req.body.couponCode, 50).toUpperCase();
    if (couponCode) {
        const coupon = await db.one('SELECT discount_type,discount_value,max_discount_amount,min_order_value FROM coupons WHERE tenant_id=? AND coupon_code=? AND d_in=0 AND is_active=1 AND (valid_from IS NULL OR valid_from<=NOW()) AND (valid_upto IS NULL OR valid_upto>=NOW())', [req.tenant.id, couponCode]);
        if (!coupon) fail(400, 'COUPON_INVALID', 'This coupon is no longer available.');
        if (subtotal < Number(coupon.min_order_value || 0)) fail(400, 'COUPON_MINIMUM_NOT_MET', 'The order total no longer meets this coupon minimum.');
        discount = coupon.discount_type === 'percentage'
            ? Math.min(subtotal * Number(coupon.discount_value || 0) / 100, coupon.max_discount_amount === null ? subtotal : Number(coupon.max_discount_amount))
            : Math.min(subtotal, Number(coupon.discount_value || 0));
    }
    const charges = await db.one('SELECT handling_charge,packing_charge,donation_charge,rain_surge_charge,rain_surge_active FROM tenant_charge_settings WHERE tenant_id=? AND d_in=0 LIMIT 1', [req.tenant.id]);
    const feeTotal = charges ? Number(charges.handling_charge || 0) + Number(charges.packing_charge || 0) + Number(charges.donation_charge || 0) + (Number(charges.rain_surge_active) === 1 ? Number(charges.rain_surge_charge || 0) : 0) : 0;
    const total = Math.max(0, subtotal - discount + tip + feeTotal);
    const order = await db.transaction(async q => {
        if (deliverySchedule) {
            const lockedSlots = await q('SELECT id,start_time,max_orders FROM delivery_slots WHERE id=? AND vendor_id=? AND slot_type=\'delivery\' AND is_active=1 AND d_in=0 AND (? > CURDATE() OR start_time > CURTIME()) FOR UPDATE', [deliverySchedule.slotId, cart.vendor_id, deliverySchedule.date]);
            const lockedSlot = lockedSlots[0];
            if (!lockedSlot) fail(409, 'DELIVERY_SLOT_UNAVAILABLE', 'That delivery slot is no longer available.');
            if (lockedSlot.max_orders !== null) {
                const bookedRows = await q('SELECT COUNT(*) AS booked_orders FROM orders WHERE delivery_slot_id=? AND DATE(scheduled_for)=? AND order_status NOT IN (5,6) AND d_in=0', [deliverySchedule.slotId, deliverySchedule.date]);
                if (Number(bookedRows[0]?.booked_orders || 0) >= Number(lockedSlot.max_orders)) fail(409, 'DELIVERY_SLOT_FULL', 'That delivery slot is full. Choose another time.');
            }
            deliverySchedule.scheduledFor = `${deliverySchedule.date} ${String(lockedSlot.start_time).slice(0, 8)}`;
        }
        const orderNumber = 'GWT-' + Date.now().toString(36).toUpperCase();
        const result = await q('INSERT INTO orders (order_number,customer_id,vendor_id,delivery_slot_id,scheduled_for,customer_address_id,item_count,sub_total,discount_amount,tax_amount,packing_charges,delivery_charges,tip_amount,grand_total,payment_type,order_status,order_instructions,address_snapshot,bill_snapshot,d_in) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,0)', [orderNumber, req.customer.id, cart.vendor_id, deliverySchedule?.slotId || null, deliverySchedule?.scheduledFor || null, addressId, lines.reduce((sum, line) => sum + Number(line.quantity), 0), subtotal, discount, 0, feeTotal, 0, tip, total, paymentType, 0, text(req.body.instructions, 500) || null, JSON.stringify({ label: address.address_label || "", line: address.full_address || "", landmark: address.landmark || "", pincode: address.pincode || "", locationId: address.location_id ? String(address.location_id) : null, name: address.recipient_name || "", phone: address.recipient_phone || "" }), JSON.stringify({ subtotal, discount, handlingCharge: Number(charges?.handling_charge || 0), packingCharge: Number(charges?.packing_charge || 0), donationCharge: Number(charges?.donation_charge || 0), rainSurgeCharge: Number(charges?.rain_surge_active) === 1 ? Number(charges?.rain_surge_charge || 0) : 0, tip, total })]);
        for (const line of lines) { const price = Number(line.discount_price ?? line.price ?? 0); await q('INSERT INTO order_items (order_id,product_variant_id,product_name_snapshot,quantity,unit_price,total_price,d_in) VALUES (?,?,?,?,?,?,0)', [result.insertId, line.product_variant_id, line.product_name, line.quantity, price, price * Number(line.quantity)]); }
        await q('UPDATE carts SET status=1 WHERE id=?', [cart.id]);
        return { id: result.insertId, orderNumber, total };
    });
    return response(res, { id: String(order.id), orderNumber: order.orderNumber, totalPaise: Math.round(order.total * 100), paymentType, status: 'Placed', scheduledFor: deliverySchedule?.scheduledFor || null });
});
exports.favourites = handle(async (req, res) => {
    const type = req.query.type === 'restaurant' ? 'restaurant' : 'product';
    if (type === 'restaurant') {
        const rows = await db.query('SELECT f.vendor_id AS target_id,v.vendor_name,v.shop_image,v.vendor_address,v.is_online,v.is_busy,COALESCE(rs.average_rating,v.vendor_rating,0) AS average_rating,COALESCE(rs.rating_count,0) AS rating_count,COALESCE(ps.has_veg,0) AS has_veg,COALESCE(ps.has_non_veg,0) AS has_non_veg,COALESCE(ps.is_best_seller,0) AS is_best_seller FROM customer_favorites f JOIN vendors v ON v.id=f.vendor_id AND v.tenant_id=? AND v.d_in=0 LEFT JOIN (SELECT vendor_id,AVG(rating) AS average_rating,COUNT(*) AS rating_count FROM reviews WHERE d_in=0 AND vendor_id IS NOT NULL GROUP BY vendor_id) rs ON rs.vendor_id=v.id LEFT JOIN (SELECT vendor_id,MAX(CASE WHEN is_veg=1 THEN 1 ELSE 0 END) AS has_veg,MAX(CASE WHEN is_veg=0 THEN 1 ELSE 0 END) AS has_non_veg,MAX(is_featured) AS is_best_seller FROM products WHERE d_in=0 AND active_status=1 AND is_available=1 GROUP BY vendor_id) ps ON ps.vendor_id=v.id WHERE f.customer_id=? AND f.vendor_id IS NOT NULL AND f.d_in=0 ORDER BY f.id DESC', [req.tenant.id, req.customer.id]);
        return response(res, rows.map(x => ({ id: String(x.target_id), type, name: x.vendor_name, imageUrl: media(req, x.shop_image), rating: Number(x.average_rating || 0), ratingCount: Number(x.rating_count || 0), isVeg: Number(x.has_veg) === 1 && Number(x.has_non_veg) === 0, hasVegItems: Number(x.has_veg) === 1, hasNonVegItems: Number(x.has_non_veg) === 1, isBestSeller: Number(x.is_best_seller) === 1, online: Number(x.is_online) === 1, busy: Number(x.is_busy) === 1, address: x.vendor_address || '' })));
    }
    const rows = await db.query('SELECT f.product_id AS target_id,p.product_name,p.base_price,p.discount_price,pi.image_path,p.vendor_id,v.vendor_name FROM customer_favorites f JOIN products p ON p.id=f.product_id AND p.d_in=0 JOIN vendors v ON v.id=p.vendor_id AND v.tenant_id=? AND v.d_in=0 LEFT JOIN product_images pi ON pi.product_id=p.id AND pi.is_primary=1 AND pi.d_in=0 WHERE f.customer_id=? AND f.product_id IS NOT NULL AND f.d_in=0 ORDER BY f.id DESC', [req.tenant.id, req.customer.id]);
    return response(res, rows.map(x => ({ id: String(x.target_id), type, name: x.product_name, restaurantId: x.vendor_id ? String(x.vendor_id) : null, restaurantName: x.vendor_name || '', pricePaise: Math.round(Number(x.discount_price ?? x.base_price ?? 0) * 100), imageUrl: media(req, x.image_path) })));
});
exports.saveFavourite = handle(async (req, res) => { const type = req.params.type === 'restaurant' ? 'restaurant' : req.params.type === 'product' ? 'product' : null; if (!type) fail(400, 'INVALID_FAVOURITE_TYPE', 'Favourite type is invalid.'); const target = id(req.params.targetId); const column = type === 'restaurant' ? 'vendor_id' : 'product_id'; const found = type === 'restaurant' ? await db.one('SELECT id FROM vendors WHERE id=? AND tenant_id=? AND d_in=0', [target, req.tenant.id]) : await db.one('SELECT p.id FROM products p JOIN vendors v ON v.id=p.vendor_id WHERE p.id=? AND v.tenant_id=? AND p.d_in=0 AND v.d_in=0', [target, req.tenant.id]); if (!found) fail(404, 'TARGET_NOT_FOUND', 'Favourite target not found.'); await db.query(`INSERT INTO customer_favorites (customer_id,${column},i_ts,d_in) SELECT ?,?,NOW(),0 FROM DUAL WHERE NOT EXISTS (SELECT 1 FROM customer_favorites WHERE customer_id=? AND ${column}=? AND d_in=0)`, [req.customer.id, target, req.customer.id, target]); return response(res, { saved: true }); });
exports.deleteFavourite = handle(async (req, res) => { const type = req.params.type === 'restaurant' ? 'restaurant' : req.params.type === 'product' ? 'product' : null; if (!type) fail(400, 'INVALID_FAVOURITE_TYPE', 'Favourite type is invalid.'); const column = type === 'restaurant' ? 'vendor_id' : 'product_id'; await db.query(`UPDATE customer_favorites SET d_in=1 WHERE customer_id=? AND ${column}=?`, [req.customer.id, id(req.params.targetId)]); return response(res, { saved: false }); });

exports.locations = handle(async (req, res) => {
    const params = [req.tenant.id];
    let where = 'l.tenant_id=? AND l.active_status=1 AND l.d_in=0';
    if (req.query.q) { where += ' AND (l.city LIKE ? OR l.area LIKE ? OR l.pincode LIKE ?)'; const q = '%' + text(req.query.q, 80) + '%'; params.push(q, q, q); }
    const rows = await db.query(`SELECT l.id,l.city,l.area,l.pincode,l.state,l.country,l.latitude,l.longitude,l.max_delivery_service_km FROM locations l WHERE ${where} ORDER BY l.city,l.area,l.id`, params);
    return response(res, rows.map(l => ({ id: String(l.id), city: l.city, area: l.area, pincode: l.pincode, state: l.state, country: l.country, latitude: l.latitude === null ? null : Number(l.latitude), longitude: l.longitude === null ? null : Number(l.longitude), maxDeliveryServiceKm: Number(l.max_delivery_service_km || 0) })));
});

exports.banners = handle(async (req, res) => {
    const locationId = req.query.locationId ? id(req.query.locationId) : null;
    const placement = req.query.placement === 'home_header' ? 'home_header' : 'home_promo';
    let rows = [];
    try { rows = await db.query(`SELECT b.id,b.banner_image,b.link_type,b.vendor_id,b.product_id,b.external_url,b.banner_order,b.placement,b.category_id,b.subcategory_id,b.aspect_ratio,b.alt_text,bpv.id AS product_vendor_id FROM banners b LEFT JOIN products bp ON bp.id=b.product_id AND bp.d_in=0 LEFT JOIN vendors bpv ON bpv.id=bp.vendor_id AND bpv.tenant_id=b.tenant_id AND bpv.d_in=0 WHERE b.tenant_id=? AND b.d_in=0 AND b.is_active=1 AND b.placement=? AND (b.location_id IS NULL OR b.location_id=?) ORDER BY b.banner_order,b.id`, [req.tenant.id, placement, locationId]); } catch (_) { rows = []; }
    return response(res, rows.map(bannerDto(req)));
});

exports.serviceability = handle(async (req, res) => { const point = coordinates(req.query); const locations = await db.query("SELECT id,city,area,latitude,longitude,max_delivery_service_km FROM locations WHERE tenant_id=? AND active_status=1 AND d_in=0 AND latitude IS NOT NULL AND latitude<>'' AND longitude IS NOT NULL AND longitude<>''", [req.tenant.id]); const match = locations.map(l => ({ l, km: distance(point, l), latitude: Number(l.latitude), longitude: Number(l.longitude) })).filter(x => Number.isFinite(x.km) && Number.isFinite(x.latitude) && x.latitude >= -90 && x.latitude <= 90 && Number.isFinite(x.longitude) && x.longitude >= -180 && x.longitude <= 180 && x.km <= Number(x.l.max_delivery_service_km || 10)).sort((a,b) => a.km-b.km)[0]; return response(res, match ? { serviceable: true, locationId: String(match.l.id), distanceKm: Number(match.km.toFixed(2)) } : { serviceable: false, reason: 'Outside delivery area' }); });
module.exports = exports;
