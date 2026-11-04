-- =========================================================================
-- Multivendor SaaS Platform -- Full Database Schema (Merged / Final)
-- Generated for: 25 modules / 96 tables
-- Conventions follow the reference `varadhifood_db` dump:
--   * `id` is INT(11), added as PRIMARY KEY + AUTO_INCREMENT via ALTER TABLE
--   * `i_ts` DATETIME audit column (row created time)
--   * `d_in` TINYINT soft-delete flag (0 = active, 1 = deleted)
--   * No FK constraints are declared (enforced at application layer),
--     matching the source database's convention; FK-like columns are
--     documented in comments and indexed via ADD KEY.
-- =========================================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

/*!40101 SET NAMES utf8mb4 */;

CREATE DATABASE IF NOT EXISTS `multivendor_saas_db` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `multivendor_saas_db`;

-- --------------------------------------------------------------------------
-- MODULE 1. Tenant Core
-- --------------------------------------------------------------------------

-- Table: tenants
CREATE TABLE `tenants` (
  `id` int(11) NOT NULL,
  `tenant_name` varchar(255) NOT NULL,
  `tenant_unique_code` varchar(50) DEFAULT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `owner_mobile_number` varchar(20) DEFAULT NULL,
  `owner_email` varchar(255) DEFAULT NULL,
  `business_type` varchar(100) DEFAULT NULL COMMENT 'food / grocery / meat / medicine / fruit / multi',
  `business_address` longtext DEFAULT NULL,
  `logo_image` longtext DEFAULT NULL,
  `favicon_image` longtext DEFAULT NULL,
  `partner_id` int(11) DEFAULT NULL COMMENT 'NULL = direct client, otherwise links to partners.id',
  `plan_id` int(11) DEFAULT NULL,
  `onboarding_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 new,1 in-progress,2 live,3 suspended',
  `active_status` int(11) NOT NULL DEFAULT 1 COMMENT '1 active,0 inactive',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tenant_users
CREATE TABLE `tenant_users` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `role` varchar(50) DEFAULT 'owner' COMMENT 'owner / staff / manager',
  `profile_image` longtext DEFAULT NULL,
  `login_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `last_login_time` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tenant_settings
CREATE TABLE `tenant_settings` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `currency_code` varchar(10) NOT NULL DEFAULT 'INR',
  `currency_symbol` varchar(5) DEFAULT '₹',
  `timezone` varchar(100) NOT NULL DEFAULT 'Asia/Kolkata',
  `date_format` varchar(50) DEFAULT 'DD-MM-YYYY',
  `primary_color` varchar(20) DEFAULT NULL,
  `secondary_color` varchar(20) DEFAULT NULL,
  `default_language` varchar(20) DEFAULT 'en',
  `support_email` varchar(255) DEFAULT NULL,
  `support_phone` varchar(20) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tenant_domains
CREATE TABLE `tenant_domains` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `subdomain` varchar(255) DEFAULT NULL,
  `custom_domain` varchar(255) DEFAULT NULL,
  `ssl_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 active,2 failed',
  `is_primary` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tenant_provisioning
CREATE TABLE `tenant_provisioning` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `step_name` varchar(150) DEFAULT NULL COMMENT 'kyc / branding / catalog / payment_gateway / go_live',
  `step_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 completed,2 skipped',
  `completed_at` datetime DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tenant_features
CREATE TABLE `tenant_features` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `feature_key` varchar(100) DEFAULT NULL COMMENT 'subscriptions / wallet / referrals / delivery_partners ...',
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tenant_branding
CREATE TABLE `tenant_branding` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `brand_scope` varchar(30) DEFAULT 'public_app' COMMENT 'public_app / admin_dashboard / vendor_app / delivery_app',
  `logo_light` longtext DEFAULT NULL COMMENT 'light background logo',
  `logo_dark` longtext DEFAULT NULL COMMENT 'dark background logo',
  `logo_icon` longtext DEFAULT NULL COMMENT 'small/collapsed sidebar icon',
  `login_bg_image` longtext DEFAULT NULL COMMENT 'login page background',
  `favicon` longtext DEFAULT NULL,
  `primary_color` varchar(20) DEFAULT NULL,
  `secondary_color` varchar(20) DEFAULT NULL,
  `sidebar_color` varchar(20) DEFAULT NULL,
  `header_color` varchar(20) DEFAULT NULL,
  `button_color` varchar(20) DEFAULT NULL,
  `font_family` varchar(100) DEFAULT NULL,
  `custom_css` longtext DEFAULT NULL COMMENT 'tenant-specific CSS overrides',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 2. Platform Billing
-- --------------------------------------------------------------------------

-- Table: plans
CREATE TABLE `plans` (
  `id` int(11) NOT NULL,
  `plan_name` varchar(150) NOT NULL,
  `plan_code` varchar(50) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price_monthly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `price_yearly` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_vendors` int(11) DEFAULT NULL,
  `max_orders_per_month` int(11) DEFAULT NULL,
  `trial_days` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: features
CREATE TABLE `features` (
  `id` int(11) NOT NULL,
  `feature_name` varchar(150) NOT NULL,
  `feature_key` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: plan_features
CREATE TABLE `plan_features` (
  `id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `feature_id` int(11) NOT NULL,
  `feature_limit` varchar(100) DEFAULT NULL COMMENT 'e.g. 50, unlimited',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tenant_subscriptions
CREATE TABLE `tenant_subscriptions` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_cycle` varchar(20) NOT NULL DEFAULT 'monthly' COMMENT 'monthly / yearly',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT 1,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 trial,1 active,2 expired,3 cancelled',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: billing_transactions
CREATE TABLE `billing_transactions` (
  `id` int(11) NOT NULL,
  `tenant_subscription_id` int(11) NOT NULL,
  `transaction_reference` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_gateway` varchar(50) DEFAULT NULL,
  `payment_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 success,2 failed,3 refunded',
  `paid_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: invoices
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL,
  `billing_transaction_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pdf_path` longtext DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 3. Super Admin & Permissions
-- --------------------------------------------------------------------------

-- Table: super_admin_users
CREATE TABLE `super_admin_users` (
  `id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `profile_image` longtext DEFAULT NULL,
  `admin_type` int(11) DEFAULT 1 COMMENT '1 super-admin,2 support-staff',
  `active_status` int(11) DEFAULT 1,
  `login_status` int(11) DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `last_login_time` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: sa_main_module
CREATE TABLE `sa_main_module` (
  `id` int(11) NOT NULL,
  `module_name` varchar(150) NOT NULL,
  `module_icon` varchar(150) DEFAULT NULL,
  `module_path` varchar(255) DEFAULT NULL,
  `module_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: sa_sub_module
CREATE TABLE `sa_sub_module` (
  `id` int(11) NOT NULL,
  `sa_main_module_id` int(11) NOT NULL,
  `sub_module_name` varchar(150) NOT NULL,
  `route_path` varchar(255) DEFAULT NULL,
  `sub_module_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: sa_user_permissions
CREATE TABLE `sa_user_permissions` (
  `id` int(11) NOT NULL,
  `super_admin_user_id` int(11) NOT NULL,
  `sa_main_module_id` int(11) DEFAULT NULL,
  `sa_sub_module_id` int(11) DEFAULT NULL,
  `can_view` tinyint(1) DEFAULT 0,
  `can_add` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 4. Partners / White-Label
-- --------------------------------------------------------------------------

-- Table: partners
CREATE TABLE `partners` (
  `id` int(11) NOT NULL,
  `partner_name` varchar(255) NOT NULL,
  `partner_unique_code` varchar(50) DEFAULT NULL,
  `owner_name` varchar(255) DEFAULT NULL,
  `owner_mobile_number` varchar(20) DEFAULT NULL,
  `owner_email` varchar(255) DEFAULT NULL,
  `business_address` longtext DEFAULT NULL,
  `logo_image` longtext DEFAULT NULL,
  `favicon_image` longtext DEFAULT NULL,
  `commission_type` varchar(20) DEFAULT 'percentage' COMMENT 'percentage / fixed',
  `commission_value` decimal(10,2) DEFAULT 0.00,
  `agreement_copy` longtext DEFAULT NULL,
  `active_status` int(11) DEFAULT 1 COMMENT '1 active,0 inactive',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: partner_users
CREATE TABLE `partner_users` (
  `id` int(11) NOT NULL,
  `partner_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `profile_image` longtext DEFAULT NULL,
  `role` varchar(50) DEFAULT 'owner' COMMENT 'owner / staff / manager',
  `login_status` int(11) DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `last_login_time` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: partner_main_module
CREATE TABLE `partner_main_module` (
  `id` int(11) NOT NULL,
  `module_name` varchar(150) NOT NULL,
  `module_icon` varchar(150) DEFAULT NULL,
  `module_path` varchar(255) DEFAULT NULL,
  `module_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: partner_sub_module
CREATE TABLE `partner_sub_module` (
  `id` int(11) NOT NULL,
  `partner_main_module_id` int(11) NOT NULL,
  `sub_module_name` varchar(150) NOT NULL,
  `route_path` varchar(255) DEFAULT NULL,
  `sub_module_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: partner_user_permissions
CREATE TABLE `partner_user_permissions` (
  `id` int(11) NOT NULL,
  `partner_user_id` int(11) NOT NULL,
  `partner_main_module_id` int(11) DEFAULT NULL,
  `partner_sub_module_id` int(11) DEFAULT NULL,
  `can_view` tinyint(1) DEFAULT 0,
  `can_add` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 5. Tenant Admin & Permissions
-- --------------------------------------------------------------------------

-- Table: admin_main_module
CREATE TABLE `admin_main_module` (
  `id` int(11) NOT NULL,
  `module_name` varchar(150) NOT NULL,
  `module_icon` varchar(150) DEFAULT NULL,
  `module_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: admin_sub_module
CREATE TABLE `admin_sub_module` (
  `id` int(11) NOT NULL,
  `admin_main_module_id` int(11) NOT NULL,
  `sub_module_name` varchar(150) NOT NULL,
  `route_path` varchar(255) DEFAULT NULL,
  `sub_module_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: admin_users_t
CREATE TABLE `admin_users_t` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `profile_image` longtext DEFAULT NULL,
  `login_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: admin_user_permissions
CREATE TABLE `admin_user_permissions` (
  `id` int(11) NOT NULL,
  `admin_users_t_id` int(11) NOT NULL,
  `admin_main_module_id` int(11) DEFAULT NULL,
  `admin_sub_module_id` int(11) DEFAULT NULL,
  `can_view` tinyint(1) NOT NULL DEFAULT 0,
  `can_add` tinyint(1) NOT NULL DEFAULT 0,
  `can_edit` tinyint(1) NOT NULL DEFAULT 0,
  `can_delete` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 6. Platform / App Ops
-- --------------------------------------------------------------------------

-- Table: app_versions
CREATE TABLE `app_versions` (
  `id` int(11) NOT NULL,
  `app_type` varchar(20) NOT NULL COMMENT 'public / vendor / delivery / admin',
  `platform` varchar(20) NOT NULL DEFAULT 'android' COMMENT 'android / ios',
  `app_link` varchar(255) DEFAULT NULL,
  `current_version` varchar(50) DEFAULT NULL,
  `force_update_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 no,1 yes',
  `maintenance_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 live,1 under maintenance'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: dev_support_tickets
CREATE TABLE `dev_support_tickets` (
  `id` int(11) NOT NULL,
  `raised_by` varchar(150) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'medium' COMMENT 'low / medium / high / critical',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 open,1 in-progress,2 resolved,3 closed',
  `resolved_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: otp_verifications
CREATE TABLE `otp_verifications` (
  `id` int(11) NOT NULL,
  `ref_type` varchar(20) NOT NULL COMMENT 'customer / vendor / delivery_partner / admin',
  `ref_id` int(11) NOT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `otp_code` varchar(10) DEFAULT NULL,
  `purpose` varchar(50) DEFAULT 'login' COMMENT 'login / checkout / payout / password_reset',
  `verify_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 verified,2 expired',
  `expires_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: sms_logs
CREATE TABLE `sms_logs` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `message_text` text DEFAULT NULL,
  `sms_provider` varchar(50) DEFAULT NULL,
  `delivery_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 queued,1 sent,2 failed',
  `credits_used` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: search_logs
CREATE TABLE `search_logs` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `search_term` varchar(255) DEFAULT NULL,
  `result_count` int(11) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 7. Location Master
-- --------------------------------------------------------------------------

-- Table: locations
CREATE TABLE `locations` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `city` varchar(150) DEFAULT NULL,
  `area` varchar(150) DEFAULT NULL,
  `pincode` varchar(15) DEFAULT NULL,
  `state` varchar(150) DEFAULT NULL,
  `country` varchar(100) DEFAULT 'India',
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `location_image` longtext DEFAULT NULL,
  `max_delivery_service_km` decimal(6,2) DEFAULT 10.00,
  `active_status` int(11) NOT NULL DEFAULT 1 COMMENT '1 active,0 inactive',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 8. Categories & Catalog Taxonomy
-- --------------------------------------------------------------------------

-- Table: categories
CREATE TABLE `categories` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL COMMENT 'self-reference to categories.id',
  `category_name` varchar(225) DEFAULT NULL,
  `category_image` longtext DEFAULT NULL,
  `vertical` varchar(50) DEFAULT 'food' COMMENT 'food / grocery / meat / medicine / fruit',
  `category_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: category_attributes
CREATE TABLE `category_attributes` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `attribute_name` varchar(150) DEFAULT NULL,
  `attribute_type` varchar(30) DEFAULT 'text' COMMENT 'text / number / dropdown / boolean',
  `attribute_values` text DEFAULT NULL COMMENT 'comma separated / JSON options',
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: catalog_filters
CREATE TABLE `catalog_filters` (
  `id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `filter_name` varchar(150) DEFAULT NULL,
  `filter_type` varchar(30) DEFAULT 'checkbox' COMMENT 'checkbox / range / radio',
  `filter_values` text DEFAULT NULL,
  `filter_order` int(11) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: measurement_units
CREATE TABLE `measurement_units` (
  `id` int(11) NOT NULL,
  `unit_name` varchar(50) NOT NULL COMMENT 'kg / litre / piece / gram / ml',
  `unit_symbol` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 9. Vendors
-- --------------------------------------------------------------------------

-- Table: vendors
CREATE TABLE `vendors` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `vendor_unique_code` varchar(50) DEFAULT NULL,
  `vendor_mobile_number` varchar(20) DEFAULT NULL,
  `vendor_mobile_number2` varchar(20) DEFAULT NULL,
  `vendor_email` varchar(255) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `vendor_address` longtext DEFAULT NULL,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `fssai_license_number` varchar(50) DEFAULT NULL,
  `gst_number` varchar(25) DEFAULT NULL,
  `trade_license_number` varchar(50) DEFAULT NULL,
  `drug_license_number` varchar(50) DEFAULT NULL,
  `pan_number` varchar(15) DEFAULT NULL,
  `shop_image` longtext DEFAULT NULL,
  `shop_interior_image1` longtext DEFAULT NULL,
  `shop_interior_image2` longtext DEFAULT NULL,
  `agreement_copy` longtext DEFAULT NULL,
  `bank_account_holder` varchar(255) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_ifsc_code` varchar(20) DEFAULT NULL,
  `bank_name` varchar(150) DEFAULT NULL,
  `upi_id` varchar(100) DEFAULT NULL,
  `opening_time` time DEFAULT NULL,
  `closing_time` time DEFAULT NULL,
  `weekly_holiday` varchar(20) DEFAULT NULL,
  `commission_percentage` decimal(5,2) DEFAULT 0.00,
  `vendor_rating` decimal(3,2) DEFAULT 4.00,
  `kyc_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 verified,2 rejected',
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `login_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `active_status` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 10. Products
-- --------------------------------------------------------------------------

-- Table: products
CREATE TABLE `products` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `product_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `is_veg` tinyint(1) DEFAULT NULL,
  `is_returnable` tinyint(1) NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `active_status` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: product_images
CREATE TABLE `product_images` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `image_path` longtext DEFAULT NULL,
  `image_order` int(11) NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: product_variants
CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `measurement_unit_id` int(11) NOT NULL,
  `variant_name` varchar(150) DEFAULT NULL COMMENT 'e.g. 500g, Large',
  `quantity_value` decimal(10,2) DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `sku` varchar(100) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: product_addons
CREATE TABLE `product_addons` (
  `id` int(11) NOT NULL,
  `product_id` int(11) NOT NULL,
  `addon_name` varchar(150) DEFAULT NULL COMMENT 'e.g. Extra cheese, Toppings',
  `addon_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_quantity` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 11. Customers
-- --------------------------------------------------------------------------

-- Table: customers
CREATE TABLE `customers` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `customer_name` varchar(255) DEFAULT NULL,
  `profile_image` longtext DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `date_of_birth` date DEFAULT NULL,
  `gender` varchar(20) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `referral_code_used` varchar(50) DEFAULT NULL,
  `login_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `active_status` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: customer_addresses
CREATE TABLE `customer_addresses` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `address_label` varchar(50) DEFAULT 'home' COMMENT 'home / work / other',
  `full_address` longtext DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `pincode` varchar(15) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: customer_preferences
CREATE TABLE `customer_preferences` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `preferred_language` varchar(20) DEFAULT 'en',
  `dietary_preference` varchar(50) DEFAULT NULL COMMENT 'veg / non-veg / vegan',
  `marketing_opt_in` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: customer_favorites
CREATE TABLE `customer_favorites` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: customer_devices
CREATE TABLE `customer_devices` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `device_token` varchar(255) DEFAULT NULL,
  `device_type` varchar(20) DEFAULT 'android' COMMENT 'android / ios / web',
  `app_version` varchar(50) DEFAULT NULL,
  `last_active_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 12. Cart & Orders
-- --------------------------------------------------------------------------

-- Table: carts
CREATE TABLE `carts` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 active,1 converted,2 abandoned',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: cart_items
CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `product_variant_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price_at_add` decimal(10,2) NOT NULL DEFAULT 0.00,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: orders
CREATE TABLE `orders` (
  `id` int(11) NOT NULL,
  `order_number` varchar(50) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `delivery_slot_id` int(11) DEFAULT NULL,
  `customer_address_id` int(11) DEFAULT NULL,
  `item_count` int(11) NOT NULL DEFAULT 0,
  `sub_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `delivery_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `grand_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_type` varchar(30) DEFAULT NULL COMMENT 'cod / online / wallet',
  `order_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 placed,1 accepted,2 preparing,3 out_for_delivery,4 delivered,5 cancelled,6 rejected',
  `order_instructions` text DEFAULT NULL,
  `order_date_time` datetime DEFAULT current_timestamp(),
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: order_items
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `product_variant_id` int(11) NOT NULL,
  `product_name_snapshot` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: order_item_options
CREATE TABLE `order_item_options` (
  `id` int(11) NOT NULL,
  `order_item_id` int(11) NOT NULL,
  `product_addon_id` int(11) NOT NULL,
  `addon_name_snapshot` varchar(150) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `addon_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: order_status_history
CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `old_status` int(11) DEFAULT NULL,
  `new_status` int(11) DEFAULT NULL,
  `changed_by_type` varchar(30) DEFAULT NULL COMMENT 'customer / vendor / delivery_partner / admin / system',
  `changed_by_id` int(11) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 13. Delivery Scheduling
-- --------------------------------------------------------------------------

-- Table: delivery_slots
CREATE TABLE `delivery_slots` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `slot_label` varchar(100) DEFAULT NULL COMMENT 'e.g. 9AM-11AM',
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `slot_type` varchar(20) DEFAULT 'delivery' COMMENT 'delivery / pickup',
  `max_orders` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 14. Payments
-- --------------------------------------------------------------------------

-- Table: payments
CREATE TABLE `payments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `payment_gateway` varchar(50) DEFAULT NULL COMMENT 'razorpay / stripe / cod / wallet',
  `gateway_payment_id` varchar(150) DEFAULT NULL,
  `gateway_order_id` varchar(150) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `payment_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 success,2 failed,3 refunded',
  `paid_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: refunds
CREATE TABLE `refunds` (
  `id` int(11) NOT NULL,
  `payment_id` int(11) NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `refund_reason` varchar(255) DEFAULT NULL,
  `gateway_refund_id` varchar(150) DEFAULT NULL,
  `refund_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 initiated,1 processed,2 failed',
  `processed_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 15. Recurring Orders / Subscriptions
-- --------------------------------------------------------------------------

-- Table: subscription_frequency_types
CREATE TABLE `subscription_frequency_types` (
  `id` int(11) NOT NULL,
  `frequency_name` varchar(50) NOT NULL COMMENT 'daily / alternate-day / weekly',
  `interval_days` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: recurring_order_subscriptions
CREATE TABLE `recurring_order_subscriptions` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_variant_id` int(11) NOT NULL,
  `subscription_frequency_type_id` int(11) NOT NULL,
  `customer_address_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 active,1 paused,2 cancelled,3 completed',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: recurring_order_items
CREATE TABLE `recurring_order_items` (
  `id` int(11) NOT NULL,
  `recurring_order_subscription_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price_per_cycle` decimal(10,2) NOT NULL DEFAULT 0.00,
  `effective_from` date DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: recurring_order_deliveries
CREATE TABLE `recurring_order_deliveries` (
  `id` int(11) NOT NULL,
  `recurring_order_subscription_id` int(11) NOT NULL,
  `scheduled_date` date DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL COMMENT 'linked once fulfilled',
  `delivery_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 scheduled,1 fulfilled,2 skipped,3 failed',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 16. Reviews & Ratings
-- --------------------------------------------------------------------------

-- Table: reviews
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `rating` tinyint(1) NOT NULL DEFAULT 5,
  `review_text` text DEFAULT NULL,
  `review_images` longtext DEFAULT NULL,
  `vendor_reply` text DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: app_ratings
CREATE TABLE `app_ratings` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `rating` tinyint(1) NOT NULL DEFAULT 5,
  `comment` varchar(255) DEFAULT NULL,
  `app_version` varchar(50) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 17. Delivery Partners
-- --------------------------------------------------------------------------

-- Table: delivery_partners
CREATE TABLE `delivery_partners` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `address` longtext DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `aadhar_number` varchar(20) DEFAULT NULL,
  `aadhar_image` longtext DEFAULT NULL,
  `driving_license_number` varchar(50) DEFAULT NULL,
  `driving_license_image` longtext DEFAULT NULL,
  `pan_number` varchar(15) DEFAULT NULL,
  `vehicle_type` varchar(50) DEFAULT NULL COMMENT 'bike / bicycle / van',
  `vehicle_number` varchar(20) DEFAULT NULL,
  `bank_account_number` varchar(50) DEFAULT NULL,
  `bank_ifsc_code` varchar(20) DEFAULT NULL,
  `profile_image` longtext DEFAULT NULL,
  `rating` decimal(3,2) DEFAULT 4.00,
  `is_online` tinyint(1) NOT NULL DEFAULT 0,
  `login_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `kyc_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 verified,2 rejected',
  `active_status` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: delivery_assignments
CREATE TABLE `delivery_assignments` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `delivery_partner_id` int(11) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  `accepted_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `assignment_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 assigned,1 accepted,2 picked_up,3 delivered,4 rejected,5 cancelled',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: delivery_tracking
CREATE TABLE `delivery_tracking` (
  `id` int(11) NOT NULL,
  `delivery_assignment_id` int(11) NOT NULL,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `status_note` varchar(150) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: delivery_partner_settlements
CREATE TABLE `delivery_partner_settlements` (
  `id` int(11) NOT NULL,
  `delivery_partner_id` int(11) NOT NULL,
  `delivery_assignment_id` int(11) DEFAULT NULL,
  `settlement_period_start` date DEFAULT NULL,
  `settlement_period_end` date DEFAULT NULL,
  `total_orders` int(11) NOT NULL DEFAULT 0,
  `cod_amount_collected` decimal(10,2) NOT NULL DEFAULT 0.00,
  `delivery_earnings` decimal(10,2) NOT NULL DEFAULT 0.00,
  `advance_deducted` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_payable` decimal(10,2) NOT NULL DEFAULT 0.00,
  `settlement_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 paid',
  `paid_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 18. Vendor Settlements
-- --------------------------------------------------------------------------

-- Table: vendor_settlements
CREATE TABLE `vendor_settlements` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `settlement_number` varchar(100) DEFAULT NULL,
  `period_start` date DEFAULT NULL,
  `period_end` date DEFAULT NULL,
  `total_orders` int(11) NOT NULL DEFAULT 0,
  `gross_sales` decimal(10,2) NOT NULL DEFAULT 0.00,
  `commission_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `net_payable` decimal(10,2) NOT NULL DEFAULT 0.00,
  `settlement_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 processed,2 paid',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: vendor_payouts
CREATE TABLE `vendor_payouts` (
  `id` int(11) NOT NULL,
  `vendor_settlement_id` int(11) NOT NULL,
  `payout_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payout_method` varchar(50) DEFAULT NULL COMMENT 'bank_transfer / upi',
  `transaction_reference` varchar(150) DEFAULT NULL,
  `payout_proof` longtext DEFAULT NULL,
  `payout_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 completed,2 failed',
  `paid_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: vendor_adjustments
CREATE TABLE `vendor_adjustments` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `adjustment_type` varchar(20) DEFAULT 'credit' COMMENT 'credit / debit',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reason` varchar(255) DEFAULT NULL,
  `adjusted_by` int(11) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 19. Coupons, Offers & Marketing
-- --------------------------------------------------------------------------

-- Table: coupons
CREATE TABLE `coupons` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `category_id` int(11) DEFAULT NULL,
  `coupon_code` varchar(50) NOT NULL,
  `description` varchar(255) DEFAULT NULL,
  `discount_type` varchar(20) DEFAULT 'percentage' COMMENT 'percentage / flat',
  `discount_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_discount_amount` decimal(10,2) DEFAULT NULL,
  `min_order_value` decimal(10,2) NOT NULL DEFAULT 0.00,
  `usage_limit_per_user` int(11) NOT NULL DEFAULT 1,
  `total_usage_limit` int(11) DEFAULT NULL,
  `valid_from` datetime DEFAULT NULL,
  `valid_upto` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: offers
CREATE TABLE `offers` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `offer_image` longtext DEFAULT NULL,
  `valid_from` datetime DEFAULT NULL,
  `valid_upto` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: banners
CREATE TABLE `banners` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `banner_image` longtext DEFAULT NULL,
  `link_type` varchar(20) DEFAULT NULL COMMENT 'product / vendor / category / external',
  `product_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `external_url` varchar(255) DEFAULT NULL,
  `banner_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 20. Customer Membership & Wallet
-- --------------------------------------------------------------------------

-- Table: customer_membership_plans
CREATE TABLE `customer_membership_plans` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `plan_name` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `duration_days` int(11) NOT NULL DEFAULT 30,
  `benefits` text DEFAULT NULL COMMENT 'free delivery, priority support etc',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: customer_memberships
CREATE TABLE `customer_memberships` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `customer_membership_plan_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 active,1 expired,2 cancelled',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: membership_transactions
CREATE TABLE `membership_transactions` (
  `id` int(11) NOT NULL,
  `customer_membership_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_reference` varchar(150) DEFAULT NULL,
  `payment_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 success,2 failed',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: customer_wallets
CREATE TABLE `customer_wallets` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `transaction_type` varchar(20) DEFAULT 'credit' COMMENT 'credit / debit',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `balance_after` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reference_type` varchar(50) DEFAULT NULL COMMENT 'order / refund / referral / manual',
  `reference_id` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 21. Referral & Rewards
-- --------------------------------------------------------------------------

-- Table: referral_codes
CREATE TABLE `referral_codes` (
  `id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `referral_code` varchar(50) DEFAULT NULL,
  `total_referrals` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: referrals
CREATE TABLE `referrals` (
  `id` int(11) NOT NULL,
  `referral_code_id` int(11) NOT NULL,
  `referred_customer_id` int(11) NOT NULL,
  `referral_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 qualified,2 rewarded',
  `qualified_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: reward_transactions
CREATE TABLE `reward_transactions` (
  `id` int(11) NOT NULL,
  `customer_wallet_id` int(11) NOT NULL,
  `referral_id` int(11) DEFAULT NULL,
  `reward_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reward_type` varchar(50) DEFAULT 'referral' COMMENT 'referral / promo / cashback',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 22. Notifications
-- --------------------------------------------------------------------------

-- Table: notifications
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `target_type` varchar(20) DEFAULT 'customer' COMMENT 'customer / vendor / delivery_partner / all',
  `target_id` int(11) DEFAULT NULL COMMENT 'NULL when broadcast to all',
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `notification_type` varchar(50) DEFAULT NULL COMMENT 'order / promo / system',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `sent_at` datetime DEFAULT current_timestamp(),
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: notification_templates
CREATE TABLE `notification_templates` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `template_key` varchar(100) DEFAULT NULL COMMENT 'order_placed / order_delivered / otp ...',
  `title_template` varchar(255) DEFAULT NULL,
  `body_template` text DEFAULT NULL,
  `channel` varchar(20) DEFAULT 'push' COMMENT 'push / sms / email',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: notification_preferences
CREATE TABLE `notification_preferences` (
  `id` int(11) NOT NULL,
  `ref_type` varchar(20) NOT NULL COMMENT 'customer / vendor',
  `ref_id` int(11) NOT NULL,
  `push_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sms_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `email_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 23. Support & Disputes
-- --------------------------------------------------------------------------

-- Table: support_tickets
CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `raised_by_type` varchar(20) DEFAULT 'customer' COMMENT 'customer / vendor',
  `customer_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'medium' COMMENT 'low / medium / high',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 open,1 in-progress,2 resolved,3 closed',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: support_messages
CREATE TABLE `support_messages` (
  `id` int(11) NOT NULL,
  `support_ticket_id` int(11) NOT NULL,
  `sender_type` varchar(20) DEFAULT NULL COMMENT 'customer / vendor / admin',
  `sender_id` int(11) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `attachment_path` longtext DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: disputes
CREATE TABLE `disputes` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `raised_by_type` varchar(20) DEFAULT NULL COMMENT 'customer / vendor',
  `raised_by_id` int(11) DEFAULT NULL,
  `dispute_reason` varchar(255) DEFAULT NULL,
  `dispute_amount` decimal(10,2) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 open,1 under_review,2 resolved,3 rejected',
  `resolution_notes` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: dispute_evidence
CREATE TABLE `dispute_evidence` (
  `id` int(11) NOT NULL,
  `dispute_id` int(11) NOT NULL,
  `evidence_type` varchar(20) DEFAULT 'image' COMMENT 'image / document / video',
  `file_path` longtext DEFAULT NULL,
  `uploaded_by_type` varchar(20) DEFAULT NULL,
  `uploaded_by_id` int(11) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 24. Tax & Invoicing
-- --------------------------------------------------------------------------

-- Table: tax_categories
CREATE TABLE `tax_categories` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `tax_category_name` varchar(150) DEFAULT NULL,
  `hsn_sac_code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tax_rates
CREATE TABLE `tax_rates` (
  `id` int(11) NOT NULL,
  `tax_category_id` int(11) NOT NULL,
  `region` varchar(150) DEFAULT NULL COMMENT 'state / country the rate applies to',
  `tax_name` varchar(50) DEFAULT 'GST',
  `tax_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: order_taxes
CREATE TABLE `order_taxes` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `tax_rate_id` int(11) NOT NULL,
  `taxable_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: vendor_invoices
CREATE TABLE `vendor_invoices` (
  `id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_type` varchar(20) DEFAULT 'commission' COMMENT 'commission / settlement',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `invoice_date` date DEFAULT NULL,
  `pdf_path` longtext DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: customer_invoices
CREATE TABLE `customer_invoices` (
  `id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pdf_path` longtext DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: tenant_charge_settings
CREATE TABLE `tenant_charge_settings` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `handling_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `packing_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `donation_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rain_surge_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rain_surge_active` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- MODULE 25. Platform Configuration
-- --------------------------------------------------------------------------

-- Table: platform_settings
CREATE TABLE `platform_settings` (
  `id` int(11) NOT NULL,
  `setting_key` varchar(100) DEFAULT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: payment_gateway_settings
CREATE TABLE `payment_gateway_settings` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `gateway_name` varchar(50) DEFAULT NULL COMMENT 'razorpay / stripe / paytm',
  `api_key` varchar(255) DEFAULT NULL,
  `api_secret` varchar(255) DEFAULT NULL,
  `webhook_secret` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: notification_settings
CREATE TABLE `notification_settings` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `push_provider` varchar(50) DEFAULT NULL,
  `push_api_key` varchar(255) DEFAULT NULL,
  `sms_provider` varchar(50) DEFAULT NULL,
  `sms_api_key` varchar(255) DEFAULT NULL,
  `email_provider` varchar(50) DEFAULT NULL,
  `email_api_key` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: integration_settings
CREATE TABLE `integration_settings` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `integration_name` varchar(100) DEFAULT NULL COMMENT 'google_maps / firebase / whatsapp',
  `config_json` longtext DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Table: audit_logs
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL,
  `tenant_id` int(11) DEFAULT NULL,
  `actor_type` varchar(20) DEFAULT NULL COMMENT 'admin / tenant_user / vendor / system',
  `actor_id` int(11) DEFAULT NULL,
  `action` varchar(150) DEFAULT NULL,
  `entity_type` varchar(100) DEFAULT NULL,
  `entity_id` int(11) DEFAULT NULL,
  `old_value` longtext DEFAULT NULL,
  `new_value` longtext DEFAULT NULL,
  `ip_address` varchar(50) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- --------------------------------------------------------------------------
-- PRIMARY KEYS & INDEXES
-- --------------------------------------------------------------------------

ALTER TABLE `tenants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenants_plan_id` (`plan_id`),
  ADD KEY `idx_tenants_partner_id` (`partner_id`);
ALTER TABLE `tenant_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_users_tenant_id` (`tenant_id`);
ALTER TABLE `tenant_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_settings_tenant_id` (`tenant_id`);
ALTER TABLE `tenant_domains`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_domains_tenant_id` (`tenant_id`);
ALTER TABLE `tenant_provisioning`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_provisioning_tenant_id` (`tenant_id`);
ALTER TABLE `tenant_features`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_features_tenant_id` (`tenant_id`);
ALTER TABLE `tenant_branding`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_branding_tenant_id` (`tenant_id`);
ALTER TABLE `plans`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `features`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `plan_features`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_plan_features_plan_id` (`plan_id`),
  ADD KEY `idx_plan_features_feature_id` (`feature_id`);
ALTER TABLE `tenant_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_subscriptions_tenant_id` (`tenant_id`),
  ADD KEY `idx_tenant_subscriptions_plan_id` (`plan_id`);
ALTER TABLE `billing_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_billing_transactions_tenant_subscription_id` (`tenant_subscription_id`);
ALTER TABLE `invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_invoices_billing_transaction_id` (`billing_transaction_id`),
  ADD KEY `idx_invoices_tenant_id` (`tenant_id`);
ALTER TABLE `super_admin_users`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `sa_main_module`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `sa_sub_module`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sa_sub_module_sa_main_module_id` (`sa_main_module_id`);
ALTER TABLE `sa_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sa_user_permissions_super_admin_user_id` (`super_admin_user_id`),
  ADD KEY `idx_sa_user_permissions_sa_main_module_id` (`sa_main_module_id`),
  ADD KEY `idx_sa_user_permissions_sa_sub_module_id` (`sa_sub_module_id`);
ALTER TABLE `partners`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `partner_users`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_partner_users_partner_id` (`partner_id`);
ALTER TABLE `partner_main_module`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `partner_sub_module`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_partner_sub_module_partner_main_module_id` (`partner_main_module_id`);
ALTER TABLE `partner_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_partner_user_permissions_partner_user_id` (`partner_user_id`),
  ADD KEY `idx_partner_user_permissions_partner_main_module_id` (`partner_main_module_id`),
  ADD KEY `idx_partner_user_permissions_partner_sub_module_id` (`partner_sub_module_id`);
ALTER TABLE `admin_main_module`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `admin_sub_module`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_sub_module_admin_main_module_id` (`admin_main_module_id`);
ALTER TABLE `admin_users_t`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_users_t_tenant_id` (`tenant_id`);
ALTER TABLE `admin_user_permissions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_admin_user_permissions_admin_users_t_id` (`admin_users_t_id`),
  ADD KEY `idx_admin_user_permissions_admin_main_module_id` (`admin_main_module_id`),
  ADD KEY `idx_admin_user_permissions_admin_sub_module_id` (`admin_sub_module_id`);
ALTER TABLE `app_versions`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `dev_support_tickets`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `otp_verifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_otp_verifications_ref_type` (`ref_type`),
  ADD KEY `idx_otp_verifications_ref_id` (`ref_id`);
ALTER TABLE `sms_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_sms_logs_tenant_id` (`tenant_id`);
ALTER TABLE `search_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_search_logs_tenant_id` (`tenant_id`),
  ADD KEY `idx_search_logs_customer_id` (`customer_id`);
ALTER TABLE `locations`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_locations_tenant_id` (`tenant_id`);
ALTER TABLE `categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_categories_tenant_id` (`tenant_id`),
  ADD KEY `idx_categories_parent_id` (`parent_id`);
ALTER TABLE `category_attributes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_category_attributes_category_id` (`category_id`);
ALTER TABLE `catalog_filters`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_catalog_filters_category_id` (`category_id`);
ALTER TABLE `measurement_units`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `vendors`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vendors_tenant_id` (`tenant_id`),
  ADD KEY `idx_vendors_location_id` (`location_id`);
ALTER TABLE `products`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_products_vendor_id` (`vendor_id`),
  ADD KEY `idx_products_category_id` (`category_id`);
ALTER TABLE `product_images`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_images_product_id` (`product_id`);
ALTER TABLE `product_variants`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_variants_product_id` (`product_id`),
  ADD KEY `idx_product_variants_measurement_unit_id` (`measurement_unit_id`);
ALTER TABLE `product_addons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_product_addons_product_id` (`product_id`);
ALTER TABLE `customers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customers_tenant_id` (`tenant_id`);
ALTER TABLE `customer_addresses`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_addresses_customer_id` (`customer_id`);
ALTER TABLE `customer_preferences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_preferences_customer_id` (`customer_id`);
ALTER TABLE `customer_favorites`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_favorites_customer_id` (`customer_id`),
  ADD KEY `idx_customer_favorites_product_id` (`product_id`),
  ADD KEY `idx_customer_favorites_vendor_id` (`vendor_id`);
ALTER TABLE `customer_devices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_devices_customer_id` (`customer_id`);
ALTER TABLE `carts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_carts_customer_id` (`customer_id`),
  ADD KEY `idx_carts_vendor_id` (`vendor_id`);
ALTER TABLE `cart_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_cart_items_cart_id` (`cart_id`),
  ADD KEY `idx_cart_items_product_variant_id` (`product_variant_id`);
ALTER TABLE `orders`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_orders_customer_id` (`customer_id`),
  ADD KEY `idx_orders_vendor_id` (`vendor_id`),
  ADD KEY `idx_orders_delivery_slot_id` (`delivery_slot_id`);
ALTER TABLE `order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_items_order_id` (`order_id`),
  ADD KEY `idx_order_items_product_variant_id` (`product_variant_id`);
ALTER TABLE `order_item_options`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_item_options_order_item_id` (`order_item_id`),
  ADD KEY `idx_order_item_options_product_addon_id` (`product_addon_id`);
ALTER TABLE `order_status_history`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_status_history_order_id` (`order_id`);
ALTER TABLE `delivery_slots`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_delivery_slots_vendor_id` (`vendor_id`);
ALTER TABLE `payments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payments_order_id` (`order_id`);
ALTER TABLE `refunds`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_refunds_payment_id` (`payment_id`);
ALTER TABLE `subscription_frequency_types`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `recurring_order_subscriptions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recurring_order_subscriptions_customer_id` (`customer_id`),
  ADD KEY `idx_recurring_order_subscriptions_product_variant_id` (`product_variant_id`),
  ADD KEY `idx_recurring_order_subscriptions_subscription_frequency_type_id` (`subscription_frequency_type_id`);
ALTER TABLE `recurring_order_items`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recurring_order_items_recurring_order_subscription_id` (`recurring_order_subscription_id`);
ALTER TABLE `recurring_order_deliveries`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_recurring_order_deliveries_recurring_order_subscription_id` (`recurring_order_subscription_id`),
  ADD KEY `idx_recurring_order_deliveries_order_id` (`order_id`);
ALTER TABLE `reviews`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reviews_order_id` (`order_id`),
  ADD KEY `idx_reviews_customer_id` (`customer_id`),
  ADD KEY `idx_reviews_product_id` (`product_id`),
  ADD KEY `idx_reviews_vendor_id` (`vendor_id`);
ALTER TABLE `app_ratings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_app_ratings_customer_id` (`customer_id`);
ALTER TABLE `delivery_partners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_delivery_partners_tenant_id` (`tenant_id`),
  ADD KEY `idx_delivery_partners_location_id` (`location_id`);
ALTER TABLE `delivery_assignments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_delivery_assignments_order_id` (`order_id`),
  ADD KEY `idx_delivery_assignments_delivery_partner_id` (`delivery_partner_id`);
ALTER TABLE `delivery_tracking`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_delivery_tracking_delivery_assignment_id` (`delivery_assignment_id`);
ALTER TABLE `delivery_partner_settlements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_delivery_partner_settlements_delivery_partner_id` (`delivery_partner_id`),
  ADD KEY `idx_delivery_partner_settlements_delivery_assignment_id` (`delivery_assignment_id`);
ALTER TABLE `vendor_settlements`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vendor_settlements_vendor_id` (`vendor_id`);
ALTER TABLE `vendor_payouts`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vendor_payouts_vendor_settlement_id` (`vendor_settlement_id`);
ALTER TABLE `vendor_adjustments`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vendor_adjustments_vendor_id` (`vendor_id`);
ALTER TABLE `coupons`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_coupons_tenant_id` (`tenant_id`),
  ADD KEY `idx_coupons_vendor_id` (`vendor_id`),
  ADD KEY `idx_coupons_category_id` (`category_id`);
ALTER TABLE `offers`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_offers_tenant_id` (`tenant_id`);
ALTER TABLE `banners`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_banners_tenant_id` (`tenant_id`),
  ADD KEY `idx_banners_product_id` (`product_id`),
  ADD KEY `idx_banners_vendor_id` (`vendor_id`);
ALTER TABLE `customer_membership_plans`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_membership_plans_tenant_id` (`tenant_id`);
ALTER TABLE `customer_memberships`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_memberships_customer_id` (`customer_id`),
  ADD KEY `idx_customer_memberships_customer_membership_plan_id` (`customer_membership_plan_id`);
ALTER TABLE `membership_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_membership_transactions_customer_membership_id` (`customer_membership_id`);
ALTER TABLE `customer_wallets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_wallets_customer_id` (`customer_id`);
ALTER TABLE `referral_codes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_referral_codes_customer_id` (`customer_id`);
ALTER TABLE `referrals`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_referrals_referral_code_id` (`referral_code_id`),
  ADD KEY `idx_referrals_referred_customer_id` (`referred_customer_id`);
ALTER TABLE `reward_transactions`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_reward_transactions_customer_wallet_id` (`customer_wallet_id`),
  ADD KEY `idx_reward_transactions_referral_id` (`referral_id`);
ALTER TABLE `notifications`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notifications_tenant_id` (`tenant_id`),
  ADD KEY `idx_notifications_target_type` (`target_type`),
  ADD KEY `idx_notifications_target_id` (`target_id`);
ALTER TABLE `notification_templates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_templates_tenant_id` (`tenant_id`);
ALTER TABLE `notification_preferences`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_preferences_ref_type` (`ref_type`),
  ADD KEY `idx_notification_preferences_ref_id` (`ref_id`);
ALTER TABLE `support_tickets`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_support_tickets_tenant_id` (`tenant_id`),
  ADD KEY `idx_support_tickets_customer_id` (`customer_id`),
  ADD KEY `idx_support_tickets_vendor_id` (`vendor_id`);
ALTER TABLE `support_messages`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_support_messages_support_ticket_id` (`support_ticket_id`);
ALTER TABLE `disputes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_disputes_order_id` (`order_id`);
ALTER TABLE `dispute_evidence`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_dispute_evidence_dispute_id` (`dispute_id`);
ALTER TABLE `tax_categories`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tax_categories_tenant_id` (`tenant_id`);
ALTER TABLE `tax_rates`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tax_rates_tax_category_id` (`tax_category_id`);
ALTER TABLE `order_taxes`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_order_taxes_order_id` (`order_id`),
  ADD KEY `idx_order_taxes_tax_rate_id` (`tax_rate_id`);
ALTER TABLE `vendor_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_vendor_invoices_vendor_id` (`vendor_id`);
ALTER TABLE `customer_invoices`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_customer_invoices_order_id` (`order_id`);
ALTER TABLE `tenant_charge_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_tenant_charge_settings_tenant_id` (`tenant_id`);
ALTER TABLE `platform_settings`
  ADD PRIMARY KEY (`id`);
ALTER TABLE `payment_gateway_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_payment_gateway_settings_tenant_id` (`tenant_id`);
ALTER TABLE `notification_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_notification_settings_tenant_id` (`tenant_id`);
ALTER TABLE `integration_settings`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_integration_settings_tenant_id` (`tenant_id`);
ALTER TABLE `audit_logs`
  ADD PRIMARY KEY (`id`),
  ADD KEY `idx_audit_logs_tenant_id` (`tenant_id`),
  ADD KEY `idx_audit_logs_actor_type` (`actor_type`),
  ADD KEY `idx_audit_logs_actor_id` (`actor_id`);

-- --------------------------------------------------------------------------
-- AUTO_INCREMENT
-- --------------------------------------------------------------------------

ALTER TABLE `tenants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tenant_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tenant_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tenant_domains`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tenant_provisioning`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tenant_features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tenant_branding`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `plan_features`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tenant_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `billing_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `super_admin_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `sa_main_module`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `sa_sub_module`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `sa_user_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `partners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `partner_users`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `partner_main_module`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `partner_sub_module`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `partner_user_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `admin_main_module`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `admin_sub_module`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `admin_users_t`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `admin_user_permissions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `app_versions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `dev_support_tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `otp_verifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `sms_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `search_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `locations`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `category_attributes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `catalog_filters`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `measurement_units`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `vendors`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `products`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `product_images`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `product_variants`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `product_addons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customer_addresses`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customer_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customer_favorites`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customer_devices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `carts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `cart_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `orders`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `order_item_options`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `order_status_history`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `delivery_slots`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `payments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `refunds`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `subscription_frequency_types`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `recurring_order_subscriptions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `recurring_order_items`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `recurring_order_deliveries`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `reviews`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `app_ratings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `delivery_partners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `delivery_assignments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `delivery_tracking`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `delivery_partner_settlements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `vendor_settlements`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `vendor_payouts`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `vendor_adjustments`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `coupons`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `offers`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `banners`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customer_membership_plans`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customer_memberships`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `membership_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customer_wallets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `referral_codes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `referrals`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `reward_transactions`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `notifications`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `notification_templates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `notification_preferences`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `support_tickets`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `support_messages`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `disputes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `dispute_evidence`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tax_categories`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tax_rates`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `order_taxes`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `vendor_invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `customer_invoices`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `tenant_charge_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `platform_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `payment_gateway_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `notification_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `integration_settings`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
ALTER TABLE `audit_logs`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

COMMIT;
