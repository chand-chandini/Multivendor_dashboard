-- ---------------------------------------------------------------------------
-- Partner App - schema for the actions that had no storage behind them.
--
-- Additive and re-runnable (ADD COLUMN IF NOT EXISTS / CREATE TABLE IF NOT
-- EXISTS), so the admin dashboard and the existing partner_app routes keep
-- working. Apply after database/multivendor_db.sql.
--
--   mysql -u root multivendor_saas_db < database/migration_partner_app_gaps.sql
--
-- Covers:
--   1. Publish daily rates        vendors.rates_published_on
--   2. Allow substitution         vendors.allow_substitution
--   3. Daypart selection          vendor_dayparts
--   7. Report a problem           support_tickets.delivery_partner_id / ticket_reference
--   9. Delete account            }
--  10. Download my data          } partner_account_requests
--  10. Terms / privacy links      tenant_settings.terms_url / privacy_url
--
-- Product images (5) and the delivery proof photo (4) needed no schema change:
-- product_images and delivery_assignments.proof_photo already exist, and push
-- registration (6) already has partner_app_devices.
-- ---------------------------------------------------------------------------

-- --- 1, 2: store settings the vendor app writes -----------------------------

-- Rates are a daily decision, so the published state is a date, not a flag:
-- yesterday's publish must not leave today's sheet looking live.
ALTER TABLE `vendors` ADD COLUMN IF NOT EXISTS `rates_published_on` DATE NULL DEFAULT NULL;

-- Grocery/produce: may the picker swap a missing item for a close match?
ALTER TABLE `vendors` ADD COLUMN IF NOT EXISTS `allow_substitution` TINYINT(1) NOT NULL DEFAULT 1;

-- --- 3: named service windows ------------------------------------------------

-- The store's opening hours stay on `vendors`; a daypart is a named window
-- inside them ("Lunch 12:00-15:30"), and exactly one is current.
CREATE TABLE IF NOT EXISTS `vendor_dayparts` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` INT(11) NOT NULL,
  `daypart_key` VARCHAR(30) NOT NULL,
  `label` VARCHAR(60) NOT NULL,
  `start_time` TIME NOT NULL,
  `end_time` TIME NOT NULL,
  `is_active` TINYINT(1) NOT NULL DEFAULT 0,
  `daypart_order` INT(11) NOT NULL DEFAULT 0,
  `i_ts` DATETIME NOT NULL DEFAULT current_timestamp(),
  `d_in` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendor_daypart_key` (`vendor_id`, `daypart_key`),
  KEY `vendor_dayparts_vendor` (`vendor_id`, `d_in`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --- 7: support tickets raised from the partner app --------------------------

-- support_tickets already carries customer_id and vendor_id; a delivery partner
-- had nowhere to be recorded.
ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `delivery_partner_id` INT(11) NULL DEFAULT NULL;

-- The human-facing reference shown in the app and quoted back on a call.
ALTER TABLE `support_tickets` ADD COLUMN IF NOT EXISTS `ticket_reference` VARCHAR(30) NULL DEFAULT NULL;

ALTER TABLE `support_tickets` ADD INDEX IF NOT EXISTS `support_tickets_partner` (`delivery_partner_id`, `d_in`);
ALTER TABLE `support_tickets` ADD INDEX IF NOT EXISTS `support_tickets_reference` (`ticket_reference`);

-- --- 9, 10: account requests -------------------------------------------------

-- Account deletion and data export are both requests against an account that a
-- human or a job settles later, so they share one auditable table rather than
-- deleting rows the moment a button is tapped. Orders, payouts and tax records
-- have to outlive the account.
CREATE TABLE IF NOT EXISTS `partner_account_requests` (
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `ref_type` VARCHAR(20) NOT NULL,            -- 'vendor' | 'delivery'
  `ref_id` INT(11) NOT NULL,
  `tenant_id` INT(11) NOT NULL,
  `request_type` VARCHAR(30) NOT NULL,        -- 'delete_account' | 'data_export'
  `reference` VARCHAR(30) NULL DEFAULT NULL,
  `reason` TEXT NULL DEFAULT NULL,
  `status` INT(11) NOT NULL DEFAULT 0,        -- 0 pending, 1 completed, 2 rejected, 3 cancelled
  `handled_at` DATETIME NULL DEFAULT NULL,
  `handled_note` VARCHAR(255) NULL DEFAULT NULL,
  `i_ts` DATETIME NOT NULL DEFAULT current_timestamp(),
  `d_in` TINYINT(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `partner_account_requests_ref` (`ref_type`, `ref_id`, `d_in`),
  KEY `partner_account_requests_open` (`request_type`, `status`, `d_in`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --- 10: the policy documents the apps link out to ---------------------------

ALTER TABLE `tenant_settings` ADD COLUMN IF NOT EXISTS `terms_url` VARCHAR(255) NULL DEFAULT NULL;
ALTER TABLE `tenant_settings` ADD COLUMN IF NOT EXISTS `privacy_url` VARCHAR(255) NULL DEFAULT NULL;

-- --- 3 (data): give every vendor the two standard windows -------------------
--
-- The app previously carried these as constants (Lunch 12:00-15:30, Dinner
-- 18:00-23:00). Seeding them means a vendor always has something to choose
-- between; re-running changes nothing, because each insert checks first.

INSERT INTO `vendor_dayparts` (`vendor_id`, `daypart_key`, `label`, `start_time`, `end_time`, `is_active`, `daypart_order`)
SELECT v.`id`, 'lunch', 'Lunch', '12:00:00', '15:30:00', 0, 1
FROM `vendors` v
WHERE v.`d_in` = 0
  AND NOT EXISTS (SELECT 1 FROM `vendor_dayparts` d WHERE d.`vendor_id` = v.`id` AND d.`daypart_key` = 'lunch');

INSERT INTO `vendor_dayparts` (`vendor_id`, `daypart_key`, `label`, `start_time`, `end_time`, `is_active`, `daypart_order`)
SELECT v.`id`, 'dinner', 'Dinner', '18:00:00', '23:00:00', 1, 2
FROM `vendors` v
WHERE v.`d_in` = 0
  AND NOT EXISTS (SELECT 1 FROM `vendor_dayparts` d WHERE d.`vendor_id` = v.`id` AND d.`daypart_key` = 'dinner');
