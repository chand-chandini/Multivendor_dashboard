-- ============================================
-- SAFE UPDATE: Only inserts missing data
-- Run this if you already ran the old seed_admin.sql
-- Database: multivendor_saas_db
-- ============================================

-- Add tenant_charge_settings if not exists
INSERT IGNORE INTO `tenant_charge_settings` (`id`, `tenant_id`, `handling_charge`, `packing_charge`, `donation_charge`, `rain_surge_charge`, `rain_surge_active`)
VALUES (1, 1, 0.00, 0.00, 0.00, 0.00, 0);

-- Delete old modules and re-insert all 13 (clean slate for modules only)
DELETE FROM `admin_user_permissions` WHERE `admin_users_t_id` = 1;
DELETE FROM `admin_sub_module`;
DELETE FROM `admin_main_module`;

-- Insert all 13 modules
INSERT INTO `admin_main_module` (`id`, `module_name`, `module_icon`, `module_order`, `is_active`) VALUES
(1, 'Dashboard', 'ri-home-2-fill', 1, 1),
(2, 'Locations', 'ri-map-pin-2-fill', 2, 1),
(3, 'Categories', 'ri-apps-2-fill', 3, 1),
(4, 'Vendors', 'ri-store-2-fill', 4, 1),
(5, 'Products', 'ri-shopping-bag-fill', 5, 1),
(6, 'Orders', 'ri-shopping-cart-2-fill', 6, 1),
(7, 'Customers', 'ri-user-3-fill', 7, 1),
(8, 'Delivery', 'ri-truck-fill', 8, 1),
(9, 'Marketing', 'ri-megaphone-fill', 9, 1),
(10, 'Settlements', 'ri-money-dollar-circle-fill', 10, 1),
(11, 'Settings', 'ri-settings-3-fill', 11, 1),
(12, 'Dev Support', 'ri-customer-service-2-fill', 12, 1),
(13, 'Permissions', 'ri-shield-keyhole-fill', 13, 1);

-- Insert sub modules
INSERT INTO `admin_sub_module` (`id`, `admin_main_module_id`, `sub_module_name`, `route_path`, `sub_module_order`, `is_active`) VALUES
(1, 8, 'Delivery Partners', '/masters/deliverypartners', 1, 1),
(2, 8, 'Delivery Slots', '/masters/deliveryslots', 2, 1),
(3, 9, 'Banners', '/masters/banners', 1, 1),
(4, 9, 'Coupons', '/masters/coupons', 2, 1),
(5, 9, 'Notifications', '/masters/notifications', 3, 1);

-- Full permissions for admin user (id=1)
INSERT INTO `admin_user_permissions` (`admin_users_t_id`, `admin_main_module_id`, `admin_sub_module_id`, `can_view`, `can_add`, `can_edit`, `can_delete`) VALUES
(1, 1, NULL, 1, 1, 1, 1),
(1, 2, NULL, 1, 1, 1, 1),
(1, 3, NULL, 1, 1, 1, 1),
(1, 4, NULL, 1, 1, 1, 1),
(1, 5, NULL, 1, 1, 1, 1),
(1, 6, NULL, 1, 1, 1, 1),
(1, 7, NULL, 1, 1, 1, 1),
(1, 10, NULL, 1, 1, 1, 1),
(1, 11, NULL, 1, 1, 1, 1),
(1, 12, NULL, 1, 1, 1, 1),
(1, 13, NULL, 1, 1, 1, 1),
(1, 8, 1, 1, 1, 1, 1),
(1, 8, 2, 1, 1, 1, 1),
(1, 9, 3, 1, 1, 1, 1),
(1, 9, 4, 1, 1, 1, 1),
(1, 9, 5, 1, 1, 1, 1);
