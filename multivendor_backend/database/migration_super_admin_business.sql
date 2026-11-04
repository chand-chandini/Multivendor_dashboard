-- ============================================================================
-- Super Admin — business focus (enquiries, packages, reports). SAFE, RE-RUNNABLE.
-- Run after migration_super_admin_platform.sql.
--
-- 1. website_enquiries (NEW): leads posted from the marketing website via
--    POST /super_admin/submitenquiry (public route) — clients wanting the product and
--    businesses wanting to become white-label partners. No existing table
--    held this data.
-- 2. Super Admin menu: store-level modules (vendors / customers / orders)
--    belong to the tenant admin dashboard and are removed here; Enquiries and
--    Reports are added; Subscriptions is presented as Renewals.
-- ============================================================================

CREATE TABLE IF NOT EXISTS `website_enquiries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `enquiry_type` varchar(20) NOT NULL DEFAULT 'client' COMMENT 'client / partner',

  `contact_name` varchar(255) NOT NULL, 
  
  `business_name` varchar(255) DEFAULT NULL, 
  `mobile_number` varchar(20) NOT NULL,
  `email` varchar(255) DEFAULT NULL,
  `city` varchar(150) DEFAULT NULL,
  `business_type` varchar(100) DEFAULT NULL COMMENT 'food / grocery / meat / medicine / fruit / multi',
  `interested_plan_id` int(11) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `source` varchar(100) DEFAULT 'website' COMMENT 'website / referral / campaign / manual',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 new,1 contacted,2 follow-up,3 converted,4 not interested',
  `remarks` text DEFAULT NULL,
  `follow_up_date` date DEFAULT NULL,
  `converted_tenant_id` int(11) DEFAULT NULL,
  `converted_partner_id` int(11) DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `updated_by` int(11) DEFAULT NULL COMMENT 'super_admin_users.id',
  `updated_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_website_enquiries_type_status` (`enquiry_type`, `status`),
  KEY `idx_website_enquiries_mobile` (`mobile_number`),
  KEY `idx_website_enquiries_i_ts` (`i_ts`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- One feature row per plan
ALTER TABLE `plan_features`
  ADD INDEX IF NOT EXISTS `idx_plan_features_plan_feature` (`plan_id`, `feature_id`);

-- Tenants created from Super Admin before this fix had no branding row, which the
-- tenant admin Settings page needs (it only UPDATEs). Backfill one per tenant.
INSERT INTO `tenant_branding` (`tenant_id`, `brand_scope`)
SELECT t.id, 'admin_dashboard' FROM `tenants` t
WHERE NOT EXISTS (SELECT 1 FROM `tenant_branding` b WHERE b.tenant_id = t.id AND IFNULL(b.d_in,0) = 0);

-- ---------------------------------------------------------------------------
-- Menu
-- ---------------------------------------------------------------------------
INSERT INTO `sa_main_module` (`id`, `module_name`, `module_icon`, `module_path`, `module_order`, `is_active`, `d_in`) VALUES
(1,  'Dashboard',       'ri-home-2-fill',              '/dashboard',            1,  1, 0),
(11, 'Enquiries',       'ri-mail-star-fill',           '/masters/enquiries',    2,  1, 0),
(2,  'Tenants',         'ri-building-2-fill',          NULL,                    3,  1, 0),
(3,  'Partners',        'ri-team-fill',                NULL,                    4,  1, 0),
(4,  'Plans & Billing', 'ri-money-dollar-circle-fill', NULL,                    5,  1, 0),
(12, 'Reports',         'ri-bar-chart-box-fill',       '/masters/reports',      6,  1, 0),
(5,  'Dev Support',     'ri-customer-service-2-fill',  '/masters/devsupport',   7,  1, 0),
(10, 'Activity Log',    'ri-history-line',             '/masters/activitylog',  8,  1, 0),
(6,  'Permissions',     'ri-shield-keyhole-fill',      NULL,                    9,  1, 0),
-- Store-level modules belong to the tenant admin dashboard
(7,  'Vendors / Stores','ri-store-2-fill',             '/masters/vendors',      90, 0, 1),
(8,  'Customers',       'ri-user-3-fill',              '/masters/customers',    91, 0, 1),
(9,  'Orders',          'ri-shopping-cart-2-fill',     '/masters/orders',       92, 0, 1)
ON DUPLICATE KEY UPDATE
  `module_name` = VALUES(`module_name`), `module_icon` = VALUES(`module_icon`),
  `module_path` = VALUES(`module_path`), `module_order` = VALUES(`module_order`),
  `is_active` = VALUES(`is_active`), `d_in` = VALUES(`d_in`);

INSERT INTO `sa_sub_module` (`id`, `sa_main_module_id`, `sub_module_name`, `route_path`, `sub_module_order`, `is_active`, `d_in`) VALUES
(4, 4, 'Packages & Features', '/masters/plans',         1, 1, 0),
(5, 4, 'Renewals',            '/masters/subscriptions', 2, 1, 0),
(8, 4, 'Billing & Invoices',  '/masters/billing',       3, 1, 0)
ON DUPLICATE KEY UPDATE
  `sa_main_module_id` = VALUES(`sa_main_module_id`), `sub_module_name` = VALUES(`sub_module_name`),
  `route_path` = VALUES(`route_path`), `sub_module_order` = VALUES(`sub_module_order`),
  `is_active` = VALUES(`is_active`), `d_in` = VALUES(`d_in`);

UPDATE `sa_user_permissions` SET `d_in` = 1 WHERE `sa_main_module_id` IN (7, 8, 9);

INSERT INTO `sa_user_permissions` (`super_admin_user_id`, `sa_main_module_id`, `sa_sub_module_id`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT 1, x.main_id, NULL, 1, 1, 1, 1
FROM (SELECT 11 AS main_id UNION ALL SELECT 12) x
WHERE NOT EXISTS (
  SELECT 1 FROM `sa_user_permissions` p
  WHERE p.super_admin_user_id = 1 AND p.sa_main_module_id = x.main_id AND p.sa_sub_module_id IS NULL AND IFNULL(p.d_in, 0) = 0
);
