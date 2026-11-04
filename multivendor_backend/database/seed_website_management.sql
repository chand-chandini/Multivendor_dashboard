-- ============================================================================
-- Website Management content tables
--
-- Adds the tenant-scoped storage behind the Website Management admin pages:
-- Home Page, Promotional Sections, Testimonials and Footer Settings.
--
-- These follow the existing tenant_website_banners / tenant_website_brand_settings
-- family: tenant_id scoping, display_order + status where the public site orders
-- and toggles content, d_in soft delete, i_ts stamp.
--
-- Footer settings deliberately live here rather than as extra columns on
-- tenant_branding: updatetenantsettings rewrites every tenant_branding column it
-- knows about, so website content kept there could be blanked by a partial save.
-- A singleton-per-tenant table (UNIQUE tenant_id, like tenant_website_brand_settings)
-- keeps footer content clear of the theme row.
--
-- Safe to re-run: every statement is CREATE TABLE IF NOT EXISTS.
-- Database: multivendor_saas_db
-- ============================================================================

-- Table: tenant_website_home_sections
CREATE TABLE IF NOT EXISTS `tenant_website_home_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `section_key` varchar(100) NOT NULL COMMENT 'hero, about, features, cta ...',
  `heading` varchar(255) DEFAULT NULL,
  `subheading` text DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `display_order` int(11) DEFAULT 1,
  `status` tinyint(4) DEFAULT 1,
  `i_ts` datetime DEFAULT current_timestamp(),
  `d_in` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: tenant_website_promo_sections
CREATE TABLE IF NOT EXISTS `tenant_website_promo_sections` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `subtitle` text DEFAULT NULL,
  `image` longtext DEFAULT NULL,
  `link_url` varchar(500) DEFAULT NULL,
  `display_order` int(11) DEFAULT 1,
  `status` tinyint(4) DEFAULT 1,
  `i_ts` datetime DEFAULT current_timestamp(),
  `d_in` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: tenant_website_testimonials
CREATE TABLE IF NOT EXISTS `tenant_website_testimonials` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `customer_name` varchar(255) NOT NULL,
  `designation` varchar(255) DEFAULT NULL,
  `photo` longtext DEFAULT NULL,
  `rating` decimal(2,1) DEFAULT 5.0,
  `message` text DEFAULT NULL,
  `display_order` int(11) DEFAULT 1,
  `status` tinyint(4) DEFAULT 1,
  `i_ts` datetime DEFAULT current_timestamp(),
  `d_in` tinyint(4) DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_id` (`tenant_id`),
  KEY `idx_display_order` (`display_order`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

-- Table: tenant_website_footer_settings (one row per tenant)
CREATE TABLE IF NOT EXISTS `tenant_website_footer_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `about_text` text DEFAULT NULL,
  `contact_email` varchar(255) DEFAULT NULL,
  `contact_phone` varchar(50) DEFAULT NULL,
  `contact_address` text DEFAULT NULL,
  `facebook_url` varchar(500) DEFAULT NULL,
  `instagram_url` varchar(500) DEFAULT NULL,
  `twitter_url` varchar(500) DEFAULT NULL,
  `youtube_url` varchar(500) DEFAULT NULL,
  `linkedin_url` varchar(500) DEFAULT NULL,
  `playstore_url` varchar(500) DEFAULT NULL,
  `appstore_url` varchar(500) DEFAULT NULL,
  `copyright_text` varchar(500) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `unique_tenant_website_footer` (`tenant_id`),
  KEY `idx_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
