-- 01 / 03  Franchise (area franchisee) - schema.
-- Run this first, once per database. Safe to run again: every step checks before it changes anything.
-- Works on MySQL 5.7+/8 and MariaDB 10.x (no "IF NOT EXISTS" on ALTER, which MySQL does not support).
--
-- Adds:
--   * table  franchises                      (new)
--   * column vendors.franchise_id            (nullable)
--   * column delivery_partners.franchise_id  (nullable)
--   * column support_tickets.franchise_id    (nullable, only if support_tickets exists)
-- Nothing existing is changed or removed.
--
-- Select the right database first (the one the backend uses), e.g.:  USE your_database_name;

CREATE TABLE IF NOT EXISTS `franchises` (
  `id` int NOT NULL AUTO_INCREMENT,
  `tenant_id` int NOT NULL,
  `franchise_name` varchar(255) DEFAULT NULL,
  `franchise_code` varchar(50) DEFAULT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `territory_name` varchar(150) DEFAULT NULL COMMENT 'e.g. Zone 4',
  `city` varchar(150) DEFAULT NULL,
  `area` varchar(150) DEFAULT NULL,
  `commission_percentage` decimal(5,2) NOT NULL DEFAULT 0.00 COMMENT 'share of delivered order sub_total paid to the franchise',
  `bank_account_holder` varchar(255) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_ifsc_code` varchar(20) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `login_status` int NOT NULL DEFAULT 0 COMMENT '0 allowed, 1 blocked',
  `active_status` int NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_franchises_mobile` (`mobile_number`),
  KEY `idx_franchises_tenant` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- vendors.franchise_id
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendors` ADD COLUMN `franchise_id` int DEFAULT NULL', 'SELECT 1')
  FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors' AND COLUMN_NAME = 'franchise_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- delivery_partners.franchise_id
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `delivery_partners` ADD COLUMN `franchise_id` int DEFAULT NULL', 'SELECT 1')
  FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'delivery_partners' AND COLUMN_NAME = 'franchise_id');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- indexes
SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `vendors` ADD INDEX `idx_vendors_franchise` (`franchise_id`)', 'SELECT 1')
  FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'vendors' AND INDEX_NAME = 'idx_vendors_franchise');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(COUNT(*) = 0, 'ALTER TABLE `delivery_partners` ADD INDEX `idx_partners_franchise` (`franchise_id`)', 'SELECT 1')
  FROM information_schema.STATISTICS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'delivery_partners' AND INDEX_NAME = 'idx_partners_franchise');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- support_tickets.franchise_id (tickets raised from the franchise workspace). Skipped if the table is absent.
SET @sql = (SELECT IF(
    (SELECT COUNT(*) FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets') = 1
    AND (SELECT COUNT(*) FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'support_tickets' AND COLUMN_NAME = 'franchise_id') = 0,
    'ALTER TABLE `support_tickets` ADD COLUMN `franchise_id` int DEFAULT NULL', 'SELECT 1'));
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Check: should list franchises plus the three franchise_id columns.
SELECT TABLE_NAME, COLUMN_NAME FROM information_schema.COLUMNS
 WHERE TABLE_SCHEMA = DATABASE() AND (TABLE_NAME = 'franchises' AND COLUMN_NAME = 'id' OR COLUMN_NAME = 'franchise_id');
