-- ============================================================================
-- Super Admin platform modules — SAFE, RE-RUNNABLE migration
-- Database: multivendor_saas_db (MariaDB 10.4+)
--
-- 1. dev_support_tickets: adds the columns that super_admin/ and dashboard_api/
--    controllers + both Angular Dev Support pages ALREADY read/write
--    (application, ticket_type, dev_status, admin_status, remarks, show_ind),
--    plus tenant_id / raised_by_type so the platform can tell which tenant
--    (or the super admin team) raised a ticket.
-- 2. Super Admin menu: registers the platform-wide modules in the existing
--    sa_main_module / sa_sub_module tables and grants them to super admin id 1.
-- No new tables are created; every other module reads existing tables.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. dev_support_tickets
-- ---------------------------------------------------------------------------
ALTER TABLE `dev_support_tickets`
  ADD COLUMN IF NOT EXISTS `tenant_id` int(11) DEFAULT NULL COMMENT 'optional; tenant is resolved from admin_users_t when NULL' AFTER `id`,
  ADD COLUMN IF NOT EXISTS `raised_by_type` varchar(20) DEFAULT NULL COMMENT 'super_admin when raised from Super Admin; NULL = tenant admin dashboard' AFTER `raised_by`,
  ADD COLUMN IF NOT EXISTS `application` int(11) DEFAULT NULL COMMENT '1 public app,2 dashboard,5 dynamic website' AFTER `priority`,
  ADD COLUMN IF NOT EXISTS `ticket_type` int(11) NOT NULL DEFAULT 1 COMMENT '1 bug,2 add-on' AFTER `application`,
  ADD COLUMN IF NOT EXISTS `dev_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 new,1 in-progress,2 on-hold,3 resolved,4 closed' AFTER `status`,
  ADD COLUMN IF NOT EXISTS `admin_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 new,1 reopened,2 closed' AFTER `dev_status`,
  ADD COLUMN IF NOT EXISTS `remarks` text DEFAULT NULL AFTER `admin_status`,
  ADD COLUMN IF NOT EXISTS `show_ind` int(11) NOT NULL DEFAULT 0 AFTER `remarks`,
  ADD INDEX IF NOT EXISTS `idx_dev_support_tickets_tenant_id` (`tenant_id`);

-- Audit log lookups are always newest-first
ALTER TABLE `audit_logs`
  ADD INDEX IF NOT EXISTS `idx_audit_logs_i_ts` (`i_ts`);

-- ---------------------------------------------------------------------------
-- 2. Super Admin menu
-- ---------------------------------------------------------------------------
INSERT INTO `sa_main_module` (`id`, `module_name`, `module_icon`, `module_path`, `module_order`, `is_active`, `d_in`) VALUES
(1,  'Dashboard',       'ri-home-2-fill',              '/dashboard',            1,  1, 0),
(2,  'Tenants',         'ri-building-2-fill',          NULL,                    2,  1, 0),
(3,  'Partners',        'ri-team-fill',                NULL,                    3,  1, 0),
(4,  'Plans & Billing', 'ri-money-dollar-circle-fill', NULL,                    4,  1, 0),
(7,  'Vendors / Stores','ri-store-2-fill',             '/masters/vendors',      5,  1, 0),
(8,  'Customers',       'ri-user-3-fill',              '/masters/customers',    6,  1, 0),
(9,  'Orders',          'ri-shopping-cart-2-fill',     '/masters/orders',       7,  1, 0),
(5,  'Dev Support',     'ri-customer-service-2-fill',  '/masters/devsupport',   8,  1, 0),
(10, 'Activity Log',    'ri-history-line',             '/masters/activitylog',  9,  1, 0),
(6,  'Permissions',     'ri-shield-keyhole-fill',      NULL,                    10, 1, 0)
ON DUPLICATE KEY UPDATE
  `module_name` = VALUES(`module_name`), `module_icon` = VALUES(`module_icon`),
  `module_path` = VALUES(`module_path`), `module_order` = VALUES(`module_order`),
  `is_active` = VALUES(`is_active`), `d_in` = VALUES(`d_in`);

INSERT INTO `sa_sub_module` (`id`, `sa_main_module_id`, `sub_module_name`, `route_path`, `sub_module_order`, `is_active`, `d_in`) VALUES
(1, 2, 'Manage Tenants',     '/masters/tenants',       1, 1, 0),
-- 'Tenant Settings' never had a page; settings/branding/provisioning are shown
-- inside the tenant detail view instead.
(2, 2, 'Tenant Settings',    '/masters/tenant-settings', 2, 1, 1),
(3, 3, 'Manage Partners',    '/masters/partners',      1, 1, 0),
(4, 4, 'Plans',              '/masters/plans',         1, 1, 0),
(5, 4, 'Subscriptions',      '/masters/subscriptions', 2, 1, 0),
(8, 4, 'Billing & Invoices', '/masters/billing',       3, 1, 0)
ON DUPLICATE KEY UPDATE
  `sa_main_module_id` = VALUES(`sa_main_module_id`), `sub_module_name` = VALUES(`sub_module_name`),
  `route_path` = VALUES(`route_path`), `sub_module_order` = VALUES(`sub_module_order`),
  `is_active` = VALUES(`is_active`), `d_in` = VALUES(`d_in`);

-- Grant the new modules to super admin user 1 (admin_type 1 also sees every
-- active module automatically; these rows keep the permissions screen accurate).
INSERT INTO `sa_user_permissions` (`super_admin_user_id`, `sa_main_module_id`, `sa_sub_module_id`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT 1, x.main_id, x.sub_id, 1, 1, 1, 1
FROM (
  SELECT 4 AS main_id, 8 AS sub_id UNION ALL
  SELECT 7, NULL UNION ALL
  SELECT 8, NULL UNION ALL
  SELECT 9, NULL UNION ALL
  SELECT 10, NULL
) x
WHERE NOT EXISTS (
  SELECT 1 FROM `sa_user_permissions` p
  WHERE p.super_admin_user_id = 1 AND p.sa_main_module_id = x.main_id
    AND p.sa_sub_module_id <=> x.sub_id AND IFNULL(p.d_in, 0) = 0
);
