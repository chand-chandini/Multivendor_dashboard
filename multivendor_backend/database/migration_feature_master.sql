-- ============================================================================
-- Feature master + tenant entitlements — SCHEMA. SAFE, RE-RUNNABLE.
-- Seed data lives in seed_features_packages.sql, run that after this.
--
-- The `features` / `plan_features` / `tenant_features` tables already existed but
-- were a content-management concept only: nothing read them at runtime, so a
-- tenant's package had no effect on what it could do. This makes them the real
-- control surface.
--
-- What each column is for:
--   application        which surface the feature belongs to (ADMIN / PARTNER_APP /
--                      PUBLIC_APP). Lets a tenant's entitlements be filtered per
--                      app without hardcoding lists in code.
--   module             the menu/module it maps to, for grouping in the UI.
--   feature_key        the stable identifier developers code against. UNIQUE, so
--                      `requireFeature('ORDERS')` can never be ambiguous.
--   depends_on_feature_id  a feature that must also be granted. Validated when a
--                      package is saved, so an impossible package cannot be built.
--   is_implemented     0 = declared but not built yet. Kept visible so packages
--                      document the roadmap without pretending the feature works.
--   limit_unit         what a numeric limit counts, e.g. "vendors". NULL = the
--                      feature is on/off only and carries no limit.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Feature master
-- ---------------------------------------------------------------------------
ALTER TABLE `features`
  ADD COLUMN IF NOT EXISTS `application` varchar(30) NOT NULL DEFAULT 'ADMIN'
    COMMENT 'ADMIN / PARTNER_APP / PUBLIC_APP' AFTER `feature_key`,
  ADD COLUMN IF NOT EXISTS `module` varchar(100) DEFAULT NULL
    COMMENT 'menu module this feature belongs to' AFTER `application`,
  ADD COLUMN IF NOT EXISTS `short_description` varchar(255) DEFAULT NULL AFTER `module`,
  ADD COLUMN IF NOT EXISTS `depends_on_feature_id` int(11) DEFAULT NULL
    COMMENT 'features.id that must also be granted' AFTER `description`,
  ADD COLUMN IF NOT EXISTS `is_paid` tinyint(1) NOT NULL DEFAULT 1
    COMMENT '0 = always available, not sold in a package' AFTER `depends_on_feature_id`,
  ADD COLUMN IF NOT EXISTS `is_implemented` tinyint(1) NOT NULL DEFAULT 1
    COMMENT '0 = declared only, backend not built yet' AFTER `is_paid`,
  ADD COLUMN IF NOT EXISTS `limit_unit` varchar(30) DEFAULT NULL
    COMMENT 'what a numeric limit counts; NULL = on/off only' AFTER `is_implemented`,
  ADD COLUMN IF NOT EXISTS `sort_order` int(11) NOT NULL DEFAULT 0 AFTER `limit_unit`;

-- Blank keys would collide under the unique index below; derive them from the name.
UPDATE `features`
SET `feature_key` = UPPER(REPLACE(REPLACE(TRIM(`feature_name`), ' ', '_'), '-', '_'))
WHERE IFNULL(`feature_key`, '') = '';

-- Codes are what developers write in `requireFeature('...')`, so they must be
-- unambiguous. Uniqueness was only ever checked in application code.
ALTER TABLE `features`
  ADD UNIQUE INDEX IF NOT EXISTS `uk_features_key` (`feature_key`),
  ADD INDEX IF NOT EXISTS `idx_features_application` (`application`, `sort_order`);

-- ---------------------------------------------------------------------------
-- 2. Per-tenant entitlement overrides
--
-- The table existed with only (tenant_id, feature_key, is_enabled) and was never
-- written to by any code path. It is repurposed here as the override layer:
--   is_enabled = 1  grant a feature the package does not include
--   is_enabled = 0  revoke a feature the package does include
-- `feature_key` is retained and dual-written so the old read still works.
-- ---------------------------------------------------------------------------
ALTER TABLE `tenant_features`
  ADD COLUMN IF NOT EXISTS `feature_id` int(11) DEFAULT NULL AFTER `tenant_id`,
  ADD COLUMN IF NOT EXISTS `limit_value` varchar(100) DEFAULT NULL
    COMMENT 'overrides plan_features.feature_limit' AFTER `is_enabled`,
  ADD COLUMN IF NOT EXISTS `source` varchar(20) NOT NULL DEFAULT 'override'
    COMMENT 'override / plan / business_type' AFTER `limit_value`,
  ADD COLUMN IF NOT EXISTS `note` varchar(255) DEFAULT NULL
    COMMENT 'why this was granted or revoked' AFTER `source`;

-- Backfill feature_id for any row that predates it, then make the pair unique so
-- a tenant cannot hold two conflicting overrides for one feature.
UPDATE `tenant_features` tf
INNER JOIN `features` f ON f.feature_key = tf.feature_key AND IFNULL(f.d_in,0) = 0
SET tf.feature_id = f.id
WHERE tf.feature_id IS NULL;

DELETE FROM `tenant_features` WHERE `feature_id` IS NULL AND IFNULL(`feature_key`,'') = '';

ALTER TABLE `tenant_features`
  ADD UNIQUE INDEX IF NOT EXISTS `uk_tenant_features_tenant_feature` (`tenant_id`, `feature_id`),
  ADD INDEX IF NOT EXISTS `idx_tenant_features_feature_id` (`feature_id`);

-- ---------------------------------------------------------------------------
-- 3. Plans
-- ---------------------------------------------------------------------------
-- plan_code is used as a stable lookup by the seed and by any integration.
UPDATE `plans` SET `plan_code` = CONCAT('PLAN', LPAD(`id`, 4, '0')) WHERE IFNULL(`plan_code`, '') = '';

ALTER TABLE `plans`
  ADD UNIQUE INDEX IF NOT EXISTS `uk_plans_code` (`plan_code`);

-- ---------------------------------------------------------------------------
-- 4. Enforcement kill switch
--
-- `requireFeature` reads this on every call, so enforcement can be turned off
-- without a redeploy if a mis-seeded package starts locking tenants out.
-- ---------------------------------------------------------------------------
INSERT INTO `platform_settings` (`setting_key`, `setting_value`, `description`)
SELECT 'entitlements_enforced', '1', 'When 0, requireFeature() allows everything and only logs. Emergency switch.'
WHERE NOT EXISTS (SELECT 1 FROM `platform_settings` WHERE `setting_key` = 'entitlements_enforced');
