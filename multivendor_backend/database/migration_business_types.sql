-- ============================================================================
-- Phase 1 — Business Type master + Tenant Code integrity. SAFE, RE-RUNNABLE.
-- Run after migration_super_admin_business.sql.
--
-- 1. business_types (NEW): the Super-Admin-managed master that replaces the
--    free-text `tenants.business_type` column. Seeded with the vocabulary the
--    schema already documents on `tenants.business_type`,
--    `website_enquiries.business_type` and `categories.vertical`, so all three
--    stay consistent.
-- 2. business_type_features (NEW): configurable "default features for this
--    business type" mapping. Populated and consumed in a later phase; created
--    here so the master and its mapping ship together.
-- 3. tenants.business_type_id: the authoritative link. `business_type` is kept
--    and dual-written with the code so existing readers keep working.
-- 4. tenants.tenant_unique_code gains a UNIQUE index. It had none, so the
--    application-level duplicate check could race. Duplicates are repaired
--    before the index is added.
-- 5. Menu: adds Business Types under Tenants and retires two sub-modules that
--    point at routes which do not exist (they 404 today).
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Business type master
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type_name` varchar(150) NOT NULL,
  `type_code` varchar(50) NOT NULL COMMENT 'stable key, also written to tenants.business_type',
  `description` varchar(255) DEFAULT NULL,
  `sort_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_types_code` (`type_code`),
  KEY `idx_business_types_active` (`is_active`, `sort_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Codes match the values documented on tenants.business_type / categories.vertical.
INSERT INTO `business_types` (`id`, `type_name`, `type_code`, `description`, `sort_order`, `is_active`, `d_in`) VALUES
(1, 'Food & Restaurant',   'FOOD',     'Restaurants, cloud kitchens and food outlets',        1, 1, 0),
(2, 'Grocery & Kirana',    'GROCERY',  'Grocery stores, kirana and daily essentials',         2, 1, 0),
(3, 'Meat & Seafood',      'MEAT',     'Meat, poultry and seafood sellers',                   3, 1, 0),
(4, 'Pharmacy & Medicine', 'MEDICINE', 'Pharmacies and medical supply stores',                4, 1, 0),
(5, 'Fruits & Vegetables', 'FRUIT',    'Fresh produce, fruits and vegetables',                5, 1, 0),
(6, 'Multi-category',      'MULTI',    'Marketplaces selling across more than one vertical',  6, 1, 0)
ON DUPLICATE KEY UPDATE
  `type_name` = VALUES(`type_name`), `description` = VALUES(`description`),
  `sort_order` = VALUES(`sort_order`), `is_active` = VALUES(`is_active`), `d_in` = VALUES(`d_in`);

-- ---------------------------------------------------------------------------
-- 2. Business type -> default features (configurable, not hardcoded)
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS `business_type_features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `business_type_id` int(11) NOT NULL,
  `feature_id` int(11) NOT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_business_type_feature` (`business_type_id`, `feature_id`),
  KEY `idx_business_type_features_type` (`business_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- ---------------------------------------------------------------------------
-- 3. tenants.business_type_id
-- ---------------------------------------------------------------------------
ALTER TABLE `tenants`
  ADD COLUMN IF NOT EXISTS `business_type_id` int(11) DEFAULT NULL COMMENT 'business_types.id; business_type keeps the code' AFTER `business_type`,
  ADD INDEX IF NOT EXISTS `idx_tenants_business_type_id` (`business_type_id`);

-- Backfill from whatever free text is already stored (case-insensitive on the code).
UPDATE `tenants` t
INNER JOIN `business_types` bt ON UPPER(TRIM(t.business_type)) = bt.type_code
SET t.business_type_id = bt.id
WHERE t.business_type_id IS NULL;

-- ---------------------------------------------------------------------------
-- 4. Tenant code uniqueness
-- ---------------------------------------------------------------------------
-- Repair any duplicate codes first, otherwise adding the index fails. Keeps the
-- lowest id untouched and suffixes the rest so nothing is lost.
UPDATE `tenants` t
INNER JOIN (
  SELECT t2.id, t2.tenant_unique_code
  FROM `tenants` t2
  INNER JOIN (
    SELECT `tenant_unique_code`, MIN(`id`) AS keep_id
    FROM `tenants`
    WHERE `tenant_unique_code` IS NOT NULL AND `tenant_unique_code` <> ''
    GROUP BY `tenant_unique_code`
    HAVING COUNT(*) > 1
  ) d ON d.tenant_unique_code = t2.tenant_unique_code AND t2.id <> d.keep_id
) dup ON dup.id = t.id
SET t.tenant_unique_code = CONCAT(LEFT(dup.tenant_unique_code, 40), '-', dup.id);

-- NULLs are allowed more than once by MySQL/MariaDB unique indexes, so tenants
-- without a code yet are unaffected.
ALTER TABLE `tenants`
  ADD UNIQUE INDEX IF NOT EXISTS `uk_tenants_code` (`tenant_unique_code`);

-- ---------------------------------------------------------------------------
-- 5. Menu
-- ---------------------------------------------------------------------------
INSERT INTO `sa_sub_module` (`id`, `sa_main_module_id`, `sub_module_name`, `route_path`, `sub_module_order`, `is_active`, `d_in`) VALUES
(9, 2, 'Business Types', '/masters/business-types', 2, 1, 0)
ON DUPLICATE KEY UPDATE
  `sa_main_module_id` = VALUES(`sa_main_module_id`), `sub_module_name` = VALUES(`sub_module_name`),
  `route_path` = VALUES(`route_path`), `sub_module_order` = VALUES(`sub_module_order`),
  `is_active` = VALUES(`is_active`), `d_in` = VALUES(`d_in`);

-- These two point at routes that do not exist in mvsuperadmin, so they 404.
-- 'Create Users' is redundant: /permission/permissions already creates users.
UPDATE `sa_sub_module` SET `is_active` = 0, `d_in` = 1
WHERE `route_path` IN ('/masters/tenant-settings', '/permission/createusers');

UPDATE `sa_user_permissions` SET `d_in` = 1
WHERE `sa_sub_module_id` IN (SELECT `id` FROM `sa_sub_module` WHERE `d_in` = 1);

-- Grant the new sub-module to super_admin_users.id = 1. admin_type = 1 already
-- bypasses the menu/permission checks, but non-super operators need the row.
INSERT INTO `sa_user_permissions` (`super_admin_user_id`, `sa_main_module_id`, `sa_sub_module_id`, `can_view`, `can_add`, `can_edit`, `can_delete`)
SELECT 1, 2, 9, 1, 1, 1, 1
WHERE NOT EXISTS (
  SELECT 1 FROM `sa_user_permissions` p
  WHERE p.super_admin_user_id = 1 AND p.sa_sub_module_id = 9 AND IFNULL(p.d_in, 0) = 0
);
