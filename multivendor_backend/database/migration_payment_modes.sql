-- ============================================================================
-- Tenant payment modes. SAFE, RE-RUNNABLE.
--
-- `orders.payment_type` documents the real modes (cod / online / wallet) but
-- nothing recorded which of them a tenant may actually offer. A new tenant is
-- provisioned COD-only; online is unlocked by saving gateway credentials.
--
-- Deliberately NOT a new table:
--   * COD is one boolean, added to the tenant's existing 1:1 commerce-settings
--     row (`tenant_charge_settings`), which is already created at tenant
--     creation and already surfaced by getcharges / updatecharges.
--   * "Online enabled" is NOT stored. It is derived from
--     `payment_gateway_settings` — a row that is_active with a non-empty key and
--     secret. Storing it as well would create a second source of truth that
--     could disagree with the credentials actually on file.
--
-- Also fixes a latent bug: `updatepaymentgateway` uses ON DUPLICATE KEY UPDATE,
-- but there was no unique key for it to conflict on, so every save INSERTed
-- another row instead of updating. The unique key below makes that upsert work.
-- ============================================================================

-- 1. COD switch. Default 1 so existing tenants keep taking cash on delivery.
ALTER TABLE `tenant_charge_settings`
  ADD COLUMN IF NOT EXISTS `cod_enabled` tinyint(1) NOT NULL DEFAULT 1
  COMMENT '1 = tenant may accept cash on delivery' AFTER `tenant_id`;

-- 2. Collapse any duplicate gateway rows before the unique key goes on, keeping
--    the newest row per (tenant, gateway) since that is the last one saved.
UPDATE `payment_gateway_settings` g
INNER JOIN (
  SELECT `tenant_id`, `gateway_name`, MAX(`id`) AS keep_id
  FROM `payment_gateway_settings`
  WHERE IFNULL(`d_in`, 0) = 0
  GROUP BY `tenant_id`, `gateway_name`
  HAVING COUNT(*) > 1
) d ON d.tenant_id = g.tenant_id AND d.gateway_name <=> g.gateway_name AND g.id <> d.keep_id
SET g.d_in = 1;

-- Hard-delete the superseded rows so they cannot collide with the unique key.
DELETE FROM `payment_gateway_settings`
WHERE `d_in` = 1
  AND `id` NOT IN (
    SELECT keep_id FROM (
      SELECT MAX(`id`) AS keep_id FROM `payment_gateway_settings` GROUP BY `tenant_id`, `gateway_name`
    ) keepers
  );

ALTER TABLE `payment_gateway_settings`
  ADD UNIQUE INDEX IF NOT EXISTS `uk_payment_gateway_tenant_name` (`tenant_id`, `gateway_name`);

-- 3. Any tenant missing its commerce-settings row would otherwise have no COD
--    flag to read. Backfill one, mirroring what addtenant now does.
INSERT INTO `tenant_charge_settings` (`tenant_id`, `cod_enabled`)
SELECT t.id, 1 FROM `tenants` t
WHERE IFNULL(t.d_in, 0) = 0
  AND NOT EXISTS (SELECT 1 FROM `tenant_charge_settings` c WHERE c.tenant_id = t.id AND IFNULL(c.d_in, 0) = 0);
