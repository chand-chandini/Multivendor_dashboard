-- ============================================
-- Seed data for dashboard_api (tenant admin)
-- Database: multivendor_saas_db
-- ============================================

-- Create a test tenant
INSERT INTO `tenants` (`id`, `tenant_name`, `tenant_unique_code`, `owner_name`, `owner_mobile_number`, `owner_email`, `active_status`)
VALUES (1, 'Demo Store', 'DEMO001', 'Demo Admin', '9999999999', 'admin@demostore.com', 1);

-- Tenant settings
INSERT INTO `tenant_settings` (`id`, `tenant_id`, `currency_code`, `currency_symbol`, `timezone`, `primary_color`, `secondary_color`)
VALUES (1, 1, 'INR', '₹', 'Asia/Kolkata', '#01003c', '#6c757d');

-- Tenant branding
INSERT INTO `tenant_branding` (`id`, `tenant_id`, `brand_scope`, `primary_color`, `sidebar_color`)
VALUES (1, 1, 'admin_dashboard', '#01003c', '#01003c');

-- Tenant charge settings
INSERT INTO `tenant_charge_settings` (`id`, `tenant_id`, `handling_charge`, `packing_charge`, `donation_charge`, `rain_surge_charge`, `rain_surge_active`)
VALUES (1, 1, 0.00, 0.00, 0.00, 0.00, 0);

-- Admin user for the test tenant
INSERT INTO `admin_users_t` (`id`, `tenant_id`, `name`, `mobile_number`, `email`, `pwd`, `designation`, `login_status`)
VALUES (1, 1, 'Demo Admin', '9999999999', 'admin@demostore.com', '123456', 'Admin', 0);

-- Admin modules (all 13 modules)
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

-- Admin sub modules
INSERT INTO `admin_sub_module` (`id`, `admin_main_module_id`, `sub_module_name`, `route_path`, `sub_module_order`, `is_active`) VALUES
-- Delivery
(1, 8, 'Delivery Partners', '/masters/deliverypartners', 1, 1),
(2, 8, 'Delivery Slots', '/masters/deliveryslots', 2, 1),
-- Marketing
(3, 9, 'Banners', '/masters/banners', 1, 1),
(4, 9, 'Coupons', '/masters/coupons', 2, 1),
(5, 9, 'Notifications', '/masters/notifications', 3, 1);

-- Full permissions for admin user (id=1) for all modules
-- Standalone modules (no sub_module_id)
INSERT INTO `admin_user_permissions` (`admin_users_t_id`, `admin_main_module_id`, `admin_sub_module_id`, `can_view`, `can_add`, `can_edit`, `can_delete`) VALUES
(1, 1, NULL, 1, 1, 1, 1),   -- Dashboard
(1, 2, NULL, 1, 1, 1, 1),   -- Locations
(1, 3, NULL, 1, 1, 1, 1),   -- Categories
(1, 4, NULL, 1, 1, 1, 1),   -- Vendors
(1, 5, NULL, 1, 1, 1, 1),   -- Products
(1, 6, NULL, 1, 1, 1, 1),   -- Orders
(1, 7, NULL, 1, 1, 1, 1),   -- Customers
(1, 10, NULL, 1, 1, 1, 1),  -- Settlements
(1, 11, NULL, 1, 1, 1, 1),  -- Settings
(1, 12, NULL, 1, 1, 1, 1),  -- Dev Support
(1, 13, NULL, 1, 1, 1, 1),  -- Permissions
-- Sub-module permissions
(1, 8, 1, 1, 1, 1, 1),   -- Delivery Partners
(1, 8, 2, 1, 1, 1, 1),   -- Delivery Slots
(1, 9, 3, 1, 1, 1, 1),   -- Banners
(1, 9, 4, 1, 1, 1, 1),   -- Coupons
(1, 9, 5, 1, 1, 1, 1);   -- Notifications
