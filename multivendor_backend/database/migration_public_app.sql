-- Customer app additions. Apply via: node public_app/scripts/migrate.js
-- Column additions are performed by the runner using information_schema checks.
CREATE TABLE IF NOT EXISTS public_otp_challenges (
 id varchar(48) PRIMARY KEY, tenant_id int NOT NULL, mobile varchar(20) NOT NULL,
 digest varchar(64) NOT NULL, attempts int NOT NULL DEFAULT 0, consumed_at datetime NULL,
 expires_at datetime NOT NULL, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
 KEY idx_otp_phone (tenant_id,mobile,created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS customer_sessions (
 id varchar(48) PRIMARY KEY, customer_id int NOT NULL, tenant_id int NOT NULL,
 refresh_hash varchar(64) NOT NULL, expires_at datetime NOT NULL, revoked_at datetime NULL,
 created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uk_refresh (refresh_hash)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS app_content (
 tenant_id int NOT NULL, collection varchar(30) NOT NULL, draft_json longtext NOT NULL,
 published_json longtext NULL, draft_revision int NOT NULL DEFAULT 1, revision int NOT NULL DEFAULT 0,
 updated_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY (tenant_id,collection)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS public_cart_context (
 cart_id int PRIMARY KEY, version int NOT NULL DEFAULT 1, context_json longtext NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS public_cart_options (
 cart_item_id int NOT NULL, addon_id int NOT NULL, quantity int NOT NULL DEFAULT 1,
 PRIMARY KEY (cart_item_id,addon_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS checkout_quotes (
 id varchar(48) PRIMARY KEY, tenant_id int NOT NULL, customer_id int NOT NULL, cart_id int NOT NULL,
 cart_version int NOT NULL, payload_json longtext NOT NULL, expires_at datetime NOT NULL,
 consumed_order_id int NULL, KEY idx_quote_owner (customer_id,expires_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS public_idempotency (
 tenant_id int NOT NULL, customer_id int NOT NULL, operation varchar(30) NOT NULL,
 request_key varchar(150) NOT NULL, body_hash varchar(64) NOT NULL, response_json longtext NULL,
 PRIMARY KEY (tenant_id,customer_id,operation,request_key)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS public_coupon_usage (
 coupon_id int NOT NULL, customer_id int NOT NULL, order_id int NOT NULL,
 released tinyint NOT NULL DEFAULT 0, PRIMARY KEY (coupon_id,order_id), KEY idx_usage_customer (coupon_id,customer_id,released)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS public_outbox (
 id int AUTO_INCREMENT PRIMARY KEY, order_id int NOT NULL, event_type varchar(50) NOT NULL,
 completed_at datetime NULL, attempts int NOT NULL DEFAULT 0, created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
 UNIQUE KEY uk_outbox (order_id,event_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS public_notification_receipts (
 customer_id int NOT NULL, notification_id int NOT NULL, read_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
 PRIMARY KEY (customer_id,notification_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
CREATE TABLE IF NOT EXISTS customer_account_requests (
 id int AUTO_INCREMENT PRIMARY KEY, customer_id int NOT NULL, tenant_id int NOT NULL,
 request_type varchar(30) NOT NULL, reason text NULL, status varchar(30) NOT NULL DEFAULT 'pending',
 created_at datetime NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
