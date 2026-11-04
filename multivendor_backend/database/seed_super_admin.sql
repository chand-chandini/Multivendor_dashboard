-- Seed super admin user
INSERT INTO `super_admin_users` (`id`, `name`, `mobile_number`, `email`, `pwd`, `admin_type`, `active_status`, `login_status`)
VALUES (1, 'Super Admin', '7661967145', 'admin@godavariwave.com', '123456', 1, 1, 0);

-- Seed main modules
INSERT INTO `sa_main_module` (`id`, `module_name`, `module_icon`, `module_path`, `module_order`, `is_active`) VALUES
(1, 'Dashboard', 'ri-home-2-fill', '/dashboard', 1, 1),
(2, 'Tenants', 'ri-building-2-fill', NULL, 2, 1),
(3, 'Partners', 'ri-team-fill', NULL, 3, 1),
(4, 'Plans & Billing', 'ri-money-dollar-circle-fill', NULL, 4, 1),
(5, 'Dev Support', 'ri-customer-service-2-fill', '/masters/devsupport', 5, 1),
(6, 'Permissions', 'ri-shield-keyhole-fill', '/permission/permissions', 6, 1);

-- Seed sub modules
INSERT INTO `sa_sub_module` (`id`, `sa_main_module_id`, `sub_module_name`, `route_path`, `sub_module_order`, `is_active`) VALUES
-- Tenants
(1, 2, 'Manage Tenants', '/masters/tenants', 1, 1),
(2, 2, 'Tenant Settings', '/masters/tenant-settings', 2, 1),
-- Partners
(3, 3, 'Manage Partners', '/masters/partners', 1, 1),
-- Plans & Billing
(4, 4, 'Plans', '/masters/plans', 1, 1),
(5, 4, 'Subscriptions', '/masters/subscriptions', 2, 1);

-- Give full permissions to the super admin user (id=1) for all modules
INSERT INTO `sa_user_permissions` (`super_admin_user_id`, `sa_main_module_id`, `sa_sub_module_id`, `can_view`, `can_add`, `can_edit`, `can_delete`) VALUES
-- Dashboard (standalone, no sub)
(1, 1, NULL, 1, 1, 1, 1),
-- Tenants
(1, 2, 1, 1, 1, 1, 1),
(1, 2, 2, 1, 1, 1, 1),
-- Partners
(1, 3, 3, 1, 1, 1, 1),
-- Plans & Billing
(1, 4, 4, 1, 1, 1, 1),
(1, 4, 5, 1, 1, 1, 1),
-- Dev Support (standalone, no sub)
(1, 5, NULL, 1, 1, 1, 1),
-- Permissions (standalone, no sub)
(1, 6, NULL, 1, 1, 1, 1);
