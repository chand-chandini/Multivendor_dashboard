-- Demo franchise for the partner app. Re-runnable. Sign in with mobile 9840700009,
-- password 123456, workspace "Franchise". Uses the demo ids (9000 range) and links
-- the demo vendors and delivery partners from seed_partner_app_demo.sql.

INSERT INTO `franchises`
  (id, tenant_id, franchise_name, franchise_code, owner_name, mobile_number, email, pwd, territory_name, city, area,
   commission_percentage, bank_account_holder, bank_account_number, bank_ifsc_code, bank_name, login_status, active_status, d_in)
VALUES
  (9001, 1, 'Anna Nagar Franchise', 'FR-9001', 'Meenakshi S.', '9840700009', 'meenakshi@example.com', '123456',
   'Zone 4', 'Chennai', 'Anna Nagar', 2.50, 'Meenakshi S.', '50100234567890', 'HDFC0001234', 'HDFC Bank', 0, 1, 0)
ON DUPLICATE KEY UPDATE franchise_name = VALUES(franchise_name), pwd = VALUES(pwd), commission_percentage = VALUES(commission_percentage), d_in = 0;

UPDATE `vendors` SET franchise_id = 9001 WHERE id IN (9001, 9002);
UPDATE `delivery_partners` SET franchise_id = 9001 WHERE id IN (9001, 9002);
