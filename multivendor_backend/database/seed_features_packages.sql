-- ============================================================================
-- Feature catalogue + packages — SEED. SAFE, RE-RUNNABLE.
-- Run after migration_feature_master.sql.
--
-- Every ADMIN and PARTNER_APP feature below maps to code that exists today, so
-- `requireFeature('KEY')` on the matching route is meaningful immediately.
-- Features marked is_implemented = 0 are declared for the roadmap: their UI or
-- their backend is missing, so they are documented but never sold as working.
--
-- Keys are the developer contract. Adding a feature is a two-step job:
--   1. add a row here with a new feature_key
--   2. put requireFeature('THAT_KEY') on the routes it guards
-- Nothing else needs to change — packages reference it by key from then on.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Feature catalogue
--
-- is_paid = 0 marks the handful of things every tenant keeps regardless of
-- package: without them a tenant could not sign in, get help, or be configured.
-- ---------------------------------------------------------------------------
INSERT INTO `features`
  (`feature_key`, `feature_name`, `application`, `module`, `short_description`, `description`, `is_paid`, `is_implemented`, `limit_unit`, `sort_order`, `is_active`, `d_in`)
VALUES
-- Admin Dashboard — always on
('DASHBOARD', 'Dashboard', 'ADMIN', 'Dashboard', 'Business overview', 'Tenant-scoped counts for locations, categories, vendors and support tickets.', 0, 1, NULL, 10, 1, 0),
('DEV_SUPPORT', 'Dev Support', 'ADMIN', 'Dev Support', 'Raise tickets to the platform team', 'Raise and track support tickets with the platform/development team.', 0, 1, NULL, 20, 1, 0),
('TENANT_BRANDING', 'Branding & Theme', 'ADMIN', 'Settings', 'Logos, colours and theme', 'Tenant logos, favicon, login background, colours and font for the dashboard and apps.', 0, 1, NULL, 30, 1, 0),
('ADMIN_USERS_RBAC', 'Admin Users & Permissions', 'ADMIN', 'Permissions', 'Staff logins and module permissions', 'Create dashboard logins for staff and grant per-module view/add/edit/delete rights.', 0, 1, 'admin users', 40, 1, 0),

-- Admin Dashboard — catalogue and operations
('LOCATIONS', 'Locations', 'ADMIN', 'Locations', 'Serviceable cities and areas', 'Delivery areas the tenant serves, with radius per location.', 1, 1, 'locations', 100, 1, 0),
('CATEGORIES', 'Categories', 'ADMIN', 'Categories', 'Category and sub-category tree', 'Product category and sub-category taxonomy, per vertical.', 1, 1, 'categories', 110, 1, 0),
('PRODUCTS', 'Products', 'ADMIN', 'Products', 'Product catalogue', 'Tenant-level product master with images, variants and availability.', 1, 1, 'products', 120, 1, 0),
('ORDERS', 'Orders', 'ADMIN', 'Orders', 'Order listing and status', 'Order list, detail view and status transitions.', 1, 1, 'orders per month', 130, 1, 0),
('CUSTOMERS', 'Customers', 'ADMIN', 'Customers', 'Customer directory', 'End-customer directory with activation control.', 1, 1, 'customers', 140, 1, 0),
('VENDORS', 'Vendors / Stores', 'ADMIN', 'Vendors', 'Multi-vendor store management', 'Vendor and store records, commission, active and login status.', 1, 1, 'vendors', 150, 1, 0),
('DELIVERY_SLOTS', 'Delivery Slots', 'ADMIN', 'Delivery', 'Delivery time slots', 'Configurable delivery time-slot windows.', 1, 1, 'slots', 160, 1, 0),
('DELIVERY_PARTNERS', 'Delivery Partners', 'ADMIN', 'Delivery', 'Courier roster', 'Delivery agent roster with active and login status.', 1, 1, 'delivery partners', 170, 1, 0),
('CHARGES', 'Charges', 'ADMIN', 'Settings', 'Handling and packing charges', 'Handling, packing, donation and rain-surge charge configuration.', 1, 1, NULL, 180, 1, 0),
('PAYMENT_GATEWAY', 'Online Payments', 'ADMIN', 'Settings', 'Accept card, UPI and netbanking', 'Payment gateway credentials that unlock online payment for the storefront. Cash on delivery needs no feature.', 1, 1, NULL, 190, 1, 0),

-- Admin Dashboard — marketing and money
('BANNERS', 'Banners', 'ADMIN', 'Marketing', 'In-app promotional banners', 'Promotional banners shown in the customer app.', 1, 1, 'banners', 200, 1, 0),
('COUPONS', 'Coupons', 'ADMIN', 'Marketing', 'Discount coupons', 'Discount coupon creation and management.', 1, 1, 'active coupons', 210, 1, 0),
('NOTIFICATIONS', 'Notifications', 'ADMIN', 'Marketing', 'Push and announcements', 'Push notifications and announcements to customers.', 1, 1, NULL, 220, 1, 0),
('VENDOR_SETTLEMENTS', 'Vendor Settlements', 'ADMIN', 'Settlements', 'Vendor payouts', 'Settlement runs and payout submission for vendors.', 1, 1, NULL, 230, 1, 0),

-- Partner App (vendor + delivery courier mobile app)
('VENDOR_WORKSPACE', 'Vendor App Workspace', 'PARTNER_APP', 'Vendor', 'Store status and hours', 'Vendor mobile workspace: online/busy state, weekly holiday and store hours.', 1, 1, NULL, 300, 1, 0),
('VENDOR_ORDER_FULFILMENT', 'Vendor Order Fulfilment', 'PARTNER_APP', 'Vendor Orders', 'Accept, prep and hand over orders', 'Accept/reject, extend prep time, mark ready and confirm handover.', 1, 1, NULL, 310, 1, 0),
('VENDOR_MENU_MANAGEMENT', 'Vendor Menu Management', 'PARTNER_APP', 'Vendor Menu', 'Edit items from the app', 'Vendors edit product availability and details from the mobile app.', 1, 1, NULL, 320, 1, 0),
('VENDOR_COUPONS', 'Vendor Coupons', 'PARTNER_APP', 'Vendor Coupons', 'Vendor-run offers', 'Vendors create and toggle their own coupons.', 1, 1, NULL, 330, 1, 0),
('VENDOR_EARNINGS', 'Vendor Earnings', 'PARTNER_APP', 'Earnings', 'Payout reporting in-app', 'Vendor earnings and settlement statements in the mobile app.', 1, 1, NULL, 340, 1, 0),
('DELIVERY_WORKSPACE', 'Delivery App Workspace', 'PARTNER_APP', 'Delivery', 'Courier online state and zones', 'Courier mobile workspace: online state, zones and shift preferences.', 1, 1, NULL, 350, 1, 0),
('DELIVERY_TRIP_FULFILMENT', 'Delivery Trip Fulfilment', 'PARTNER_APP', 'Trips', 'Pickup to delivery flow', 'Accept requests, reach store, confirm pickup, deliver or fail with OTP.', 1, 1, NULL, 360, 1, 0),
('DELIVERY_EARNINGS', 'Delivery Earnings', 'PARTNER_APP', 'Earnings', 'Courier earnings in-app', 'Weekly courier earnings and settlement statements.', 1, 1, NULL, 370, 1, 0),
('PARTNER_NOTIFICATIONS', 'Partner Notifications', 'PARTNER_APP', 'Notifications', 'In-app notification feed', 'In-app notification feed for vendors and couriers.', 1, 1, NULL, 380, 1, 0),
('PARTNER_BRANDING', 'Partner App Branding', 'PARTNER_APP', 'Branding', 'Tenant theme in the app', 'Tenant logos and colours applied to the vendor/courier app.', 1, 1, NULL, 390, 1, 0),
('PARTNER_PUSH', 'Partner Push Notifications', 'PARTNER_APP', 'Notifications', 'FCM push to partner devices', 'Device registration and FCM push for vendors and couriers.', 1, 1, NULL, 400, 1, 0),

-- Declared only: UI exists but the backend route does not (see plan §4)
('SHOP_ITEMS', 'Shop Items', 'ADMIN', 'Products', 'Per-vendor item catalogue', 'Per-vendor item catalogue, distinct from the tenant product master. Backend not built.', 1, 0, 'items per shop', 500, 1, 0),
('PRODUCT_ASSIGNMENT', 'Product Assignment', 'ADMIN', 'Products', 'Assign items to vendors', 'Assign shop items to vendors and categories. Backend not built.', 1, 0, NULL, 510, 1, 0),
('PAYMENTS_REPORT', 'Payments & History', 'ADMIN', 'Payments', 'Vendor payment reporting', 'Vendor payment totals and history. Backend not built.', 1, 0, NULL, 520, 1, 0),
('COD_SETTLEMENTS', 'COD Settlements', 'ADMIN', 'Payments', 'Courier cash reconciliation', 'Cash-on-delivery reconciliation for couriers. Backend not built.', 1, 0, NULL, 530, 1, 0),
('WEBSITE_CMS', 'Website CMS', 'ADMIN', 'Website Management', 'Banners, home page, testimonials, footer', 'Static-website content management. UI exists, backend not built.', 1, 0, NULL, 540, 1, 0),

-- Declared only: the Public App has no endpoints yet (see plan §5)
('PUBLIC_BROWSE', 'Storefront Browsing', 'PUBLIC_APP', 'Catalogue', 'Browse products and categories', 'Customer-facing product and category browsing. Public App not built.', 1, 0, NULL, 600, 1, 0),
('PUBLIC_CART_CHECKOUT', 'Cart & Checkout', 'PUBLIC_APP', 'Checkout', 'Cart, checkout and payment', 'Customer cart, checkout and payment. Public App not built.', 1, 0, NULL, 610, 1, 0),
('PUBLIC_OFFERS', 'Storefront Offers', 'PUBLIC_APP', 'Promotions', 'Show coupons and offers', 'Surfacing coupons and offers to customers. Public App not built.', 1, 0, NULL, 620, 1, 0),
('PUBLIC_WALLET', 'Customer Wallet', 'PUBLIC_APP', 'Wallet', 'Wallet and loyalty', 'Customer wallet, rewards and referrals. Public App not built.', 1, 0, NULL, 630, 1, 0),
('PUBLIC_REVIEWS', 'Ratings & Reviews', 'PUBLIC_APP', 'Reviews', 'Customer ratings', 'Customer ratings and reviews. Public App not built.', 1, 0, NULL, 640, 1, 0),
('PUBLIC_TRACKING', 'Order Tracking', 'PUBLIC_APP', 'Delivery', 'Live order tracking', 'Live order and delivery tracking for customers. Public App not built.', 1, 0, NULL, 650, 1, 0)
ON DUPLICATE KEY UPDATE
  `feature_name` = VALUES(`feature_name`), `application` = VALUES(`application`), `module` = VALUES(`module`),
  `short_description` = VALUES(`short_description`), `description` = VALUES(`description`),
  `is_paid` = VALUES(`is_paid`), `is_implemented` = VALUES(`is_implemented`),
  `limit_unit` = VALUES(`limit_unit`), `sort_order` = VALUES(`sort_order`),
  `is_active` = VALUES(`is_active`), `d_in` = VALUES(`d_in`);

-- ---------------------------------------------------------------------------
-- 2. Dependencies, resolved by key so ids never have to be hardcoded
-- ---------------------------------------------------------------------------
UPDATE `features` f
INNER JOIN `features` dep ON dep.feature_key = CASE f.feature_key
    WHEN 'PRODUCTS'                 THEN 'CATEGORIES'
    WHEN 'ORDERS'                   THEN 'PRODUCTS'
    WHEN 'VENDOR_SETTLEMENTS'       THEN 'VENDORS'
    WHEN 'VENDOR_WORKSPACE'         THEN 'VENDORS'
    WHEN 'VENDOR_ORDER_FULFILMENT'  THEN 'ORDERS'
    WHEN 'VENDOR_MENU_MANAGEMENT'   THEN 'PRODUCTS'
    WHEN 'VENDOR_COUPONS'           THEN 'COUPONS'
    WHEN 'VENDOR_EARNINGS'          THEN 'VENDOR_SETTLEMENTS'
    WHEN 'DELIVERY_WORKSPACE'       THEN 'DELIVERY_PARTNERS'
    WHEN 'DELIVERY_TRIP_FULFILMENT' THEN 'DELIVERY_WORKSPACE'
    WHEN 'DELIVERY_EARNINGS'        THEN 'DELIVERY_WORKSPACE'
    WHEN 'PUBLIC_CART_CHECKOUT'     THEN 'PUBLIC_BROWSE'
    WHEN 'PUBLIC_OFFERS'            THEN 'COUPONS'
    WHEN 'PUBLIC_TRACKING'          THEN 'DELIVERY_TRIP_FULFILMENT'
    WHEN 'SHOP_ITEMS'               THEN 'VENDORS'
    WHEN 'PRODUCT_ASSIGNMENT'       THEN 'SHOP_ITEMS'
    WHEN 'COD_SETTLEMENTS'          THEN 'DELIVERY_PARTNERS'
    ELSE NULL END
  AND IFNULL(dep.d_in,0) = 0
SET f.depends_on_feature_id = dep.id
WHERE IFNULL(f.d_in,0) = 0;

-- ---------------------------------------------------------------------------
-- 3. Packages
--
-- Limits are the numbers a tenant actually hits; `plans.max_vendors` and
-- `max_orders_per_month` stay populated as the legacy fallback the entitlement
-- service reads when a feature carries no explicit plan_features limit.
-- ---------------------------------------------------------------------------
INSERT INTO `plans`
  (`plan_code`, `plan_name`, `description`, `price_monthly`, `price_yearly`, `max_vendors`, `max_orders_per_month`, `trial_days`, `is_active`, `d_in`)
VALUES
('STARTER',    'Starter',    'Single store, core catalogue and orders. Cash on delivery only.',            999,   9990,    1,   500, 14, 1, 0),
('GROWTH',     'Growth',     'Multi-vendor, marketing tools, online payments and the vendor app.',        2999,  29990,   10,  5000, 14, 1, 0),
('BUSINESS',   'Business',   'Adds delivery fleet, settlements and the full partner app.',                5999,  59990,   50, 25000,  7, 1, 0),
('ENTERPRISE', 'Enterprise', 'Everything implemented, uncapped, with roadmap features pre-provisioned.', 11999, 119990, NULL,  NULL,  0, 1, 0)
ON DUPLICATE KEY UPDATE
  `plan_name` = VALUES(`plan_name`), `description` = VALUES(`description`),
  `price_monthly` = VALUES(`price_monthly`), `price_yearly` = VALUES(`price_yearly`),
  `max_vendors` = VALUES(`max_vendors`), `max_orders_per_month` = VALUES(`max_orders_per_month`),
  `trial_days` = VALUES(`trial_days`), `is_active` = VALUES(`is_active`), `d_in` = VALUES(`d_in`);

-- ---------------------------------------------------------------------------
-- 4. Package -> feature matrix
--
-- Rebuilt from scratch for these four plans only, so re-running is idempotent
-- and never touches a hand-edited package.
-- ---------------------------------------------------------------------------
DELETE pf FROM `plan_features` pf
INNER JOIN `plans` p ON p.id = pf.plan_id
WHERE p.plan_code IN ('STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE');

-- Free features belong to every package.
INSERT INTO `plan_features` (`plan_id`, `feature_id`, `feature_limit`, `i_ts`)
SELECT p.id, f.id, NULL, NOW()
FROM `plans` p
CROSS JOIN `features` f
WHERE p.plan_code IN ('STARTER', 'GROWTH', 'BUSINESS', 'ENTERPRISE')
  AND f.is_paid = 0 AND IFNULL(f.d_in,0) = 0;

-- Paid features per package, with the limit that applies at that tier.
INSERT INTO `plan_features` (`plan_id`, `feature_id`, `feature_limit`, `i_ts`)
SELECT p.id, f.id, m.feature_limit, NOW()
FROM (
  -- STARTER
  SELECT 'STARTER' AS plan_code, 'LOCATIONS' AS feature_key, '1' AS feature_limit UNION ALL
  SELECT 'STARTER', 'CATEGORIES', NULL UNION ALL
  SELECT 'STARTER', 'PRODUCTS', '200' UNION ALL
  SELECT 'STARTER', 'ORDERS', '500' UNION ALL
  SELECT 'STARTER', 'CUSTOMERS', '1000' UNION ALL
  SELECT 'STARTER', 'VENDORS', '1' UNION ALL
  SELECT 'STARTER', 'DELIVERY_SLOTS', NULL UNION ALL
  SELECT 'STARTER', 'CHARGES', NULL UNION ALL
  -- GROWTH
  SELECT 'GROWTH', 'LOCATIONS', '5' UNION ALL
  SELECT 'GROWTH', 'CATEGORIES', NULL UNION ALL
  SELECT 'GROWTH', 'PRODUCTS', '2000' UNION ALL
  SELECT 'GROWTH', 'ORDERS', '5000' UNION ALL
  SELECT 'GROWTH', 'CUSTOMERS', '10000' UNION ALL
  SELECT 'GROWTH', 'VENDORS', '10' UNION ALL
  SELECT 'GROWTH', 'DELIVERY_SLOTS', NULL UNION ALL
  SELECT 'GROWTH', 'CHARGES', NULL UNION ALL
  SELECT 'GROWTH', 'PAYMENT_GATEWAY', NULL UNION ALL
  SELECT 'GROWTH', 'BANNERS', '10' UNION ALL
  SELECT 'GROWTH', 'COUPONS', '25' UNION ALL
  SELECT 'GROWTH', 'NOTIFICATIONS', NULL UNION ALL
  SELECT 'GROWTH', 'VENDOR_WORKSPACE', NULL UNION ALL
  SELECT 'GROWTH', 'VENDOR_ORDER_FULFILMENT', NULL UNION ALL
  SELECT 'GROWTH', 'VENDOR_MENU_MANAGEMENT', NULL UNION ALL
  SELECT 'GROWTH', 'PARTNER_NOTIFICATIONS', NULL UNION ALL
  SELECT 'GROWTH', 'PARTNER_BRANDING', NULL UNION ALL
  -- BUSINESS
  SELECT 'BUSINESS', 'LOCATIONS', '25' UNION ALL
  SELECT 'BUSINESS', 'CATEGORIES', NULL UNION ALL
  SELECT 'BUSINESS', 'PRODUCTS', '10000' UNION ALL
  SELECT 'BUSINESS', 'ORDERS', '25000' UNION ALL
  SELECT 'BUSINESS', 'CUSTOMERS', '50000' UNION ALL
  SELECT 'BUSINESS', 'VENDORS', '50' UNION ALL
  SELECT 'BUSINESS', 'DELIVERY_SLOTS', NULL UNION ALL
  SELECT 'BUSINESS', 'DELIVERY_PARTNERS', '50' UNION ALL
  SELECT 'BUSINESS', 'CHARGES', NULL UNION ALL
  SELECT 'BUSINESS', 'PAYMENT_GATEWAY', NULL UNION ALL
  SELECT 'BUSINESS', 'BANNERS', '50' UNION ALL
  SELECT 'BUSINESS', 'COUPONS', '100' UNION ALL
  SELECT 'BUSINESS', 'NOTIFICATIONS', NULL UNION ALL
  SELECT 'BUSINESS', 'VENDOR_SETTLEMENTS', NULL UNION ALL
  SELECT 'BUSINESS', 'VENDOR_WORKSPACE', NULL UNION ALL
  SELECT 'BUSINESS', 'VENDOR_ORDER_FULFILMENT', NULL UNION ALL
  SELECT 'BUSINESS', 'VENDOR_MENU_MANAGEMENT', NULL UNION ALL
  SELECT 'BUSINESS', 'VENDOR_COUPONS', NULL UNION ALL
  SELECT 'BUSINESS', 'VENDOR_EARNINGS', NULL UNION ALL
  SELECT 'BUSINESS', 'DELIVERY_WORKSPACE', NULL UNION ALL
  SELECT 'BUSINESS', 'DELIVERY_TRIP_FULFILMENT', NULL UNION ALL
  SELECT 'BUSINESS', 'DELIVERY_EARNINGS', NULL UNION ALL
  SELECT 'BUSINESS', 'PARTNER_NOTIFICATIONS', NULL UNION ALL
  SELECT 'BUSINESS', 'PARTNER_BRANDING', NULL UNION ALL
  SELECT 'BUSINESS', 'PARTNER_PUSH', NULL
) m
INNER JOIN `plans` p ON p.plan_code = m.plan_code AND IFNULL(p.d_in,0) = 0
INNER JOIN `features` f ON f.feature_key = m.feature_key AND IFNULL(f.d_in,0) = 0;

-- ENTERPRISE gets every active feature, uncapped.
INSERT INTO `plan_features` (`plan_id`, `feature_id`, `feature_limit`, `i_ts`)
SELECT p.id, f.id, NULL, NOW()
FROM `plans` p
CROSS JOIN `features` f
WHERE p.plan_code = 'ENTERPRISE'
  AND f.is_paid = 1 AND f.is_active = 1 AND IFNULL(f.d_in,0) = 0;

-- ---------------------------------------------------------------------------
-- 5. Grandfather existing tenants
--
-- Tenants predate entitlements, so nothing they use today may start returning
-- 403. Every implemented feature is granted explicitly as an override. New
-- tenants get their package's features only.
-- ---------------------------------------------------------------------------
INSERT INTO `tenant_features` (`tenant_id`, `feature_id`, `feature_key`, `is_enabled`, `source`, `note`, `i_ts`)
SELECT t.id, f.id, f.feature_key, 1, 'override', 'Grandfathered: predates entitlement enforcement', NOW()
FROM `tenants` t
CROSS JOIN `features` f
WHERE IFNULL(t.d_in,0) = 0
  AND f.is_implemented = 1 AND f.is_active = 1 AND IFNULL(f.d_in,0) = 0
ON DUPLICATE KEY UPDATE `is_enabled` = VALUES(`is_enabled`), `source` = VALUES(`source`), `note` = VALUES(`note`);

-- Retire the placeholder features the catalogue replaces.
UPDATE `features` SET `d_in` = 1 WHERE `feature_key` LIKE 'ZZTEST%';
UPDATE `plan_features` SET `d_in` = 1
WHERE `feature_id` IN (SELECT `id` FROM `features` WHERE `d_in` = 1);
