-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: 127.0.0.1    Database: multivendor_db
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Current Database: `multivendor_db`
--

CREATE DATABASE /*!32312 IF NOT EXISTS*/ `multivendor_db` /*!40100 DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci */;

USE `multivendor_db`;

--
-- Table structure for table `admin_main_module`
--

DROP TABLE IF EXISTS `admin_main_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_main_module` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_name` varchar(150) NOT NULL,
  `module_icon` varchar(150) DEFAULT NULL,
  `module_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_main_module`
--

LOCK TABLES `admin_main_module` WRITE;
/*!40000 ALTER TABLE `admin_main_module` DISABLE KEYS */;
INSERT INTO `admin_main_module` VALUES (1,'Dashboard','ri-home-2-fill',1,1,'2026-09-14 19:10:37',0),(2,'Locations','ri-map-pin-2-fill',2,1,'2026-09-14 19:10:37',0),(3,'Categories','ri-apps-2-fill',3,1,'2026-09-14 19:10:37',0),(4,'Vendors','ri-store-2-fill',4,1,'2026-09-14 19:10:37',0),(5,'Products','ri-shopping-bag-fill',5,1,'2026-09-14 19:10:37',0),(6,'Orders','ri-shopping-cart-2-fill',6,1,'2026-09-14 19:10:37',0),(7,'Customers','ri-user-3-fill',7,1,'2026-09-14 19:10:37',0),(8,'Delivery','ri-truck-fill',8,1,'2026-09-14 19:10:37',0),(9,'Marketing','ri-megaphone-fill',9,1,'2026-09-14 19:10:37',0),(10,'Settlements','ri-money-dollar-circle-fill',10,1,'2026-09-14 19:10:37',0),(11,'Settings','ri-settings-3-fill',11,1,'2026-09-14 19:10:37',0),(12,'Dev Support','ri-customer-service-2-fill',12,1,'2026-09-14 19:10:37',0),(13,'Permissions','ri-shield-keyhole-fill',13,1,'2026-09-14 19:10:37',0);
/*!40000 ALTER TABLE `admin_main_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_sub_module`
--

DROP TABLE IF EXISTS `admin_sub_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_sub_module` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_main_module_id` int(11) NOT NULL,
  `sub_module_name` varchar(150) NOT NULL,
  `route_path` varchar(255) DEFAULT NULL,
  `sub_module_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_admin_sub_module_admin_main_module_id` (`admin_main_module_id`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_sub_module`
--

LOCK TABLES `admin_sub_module` WRITE;
/*!40000 ALTER TABLE `admin_sub_module` DISABLE KEYS */;
INSERT INTO `admin_sub_module` VALUES (1,8,'Delivery Partners','/masters/deliverypartners',1,1,'2026-09-14 19:10:37',0),(2,8,'Delivery Slots','/masters/deliveryslots',2,1,'2026-09-14 19:10:37',0),(3,9,'Banners','/masters/banners',1,1,'2026-09-14 19:10:37',0),(4,9,'Coupons','/masters/coupons',2,1,'2026-09-14 19:10:37',0),(5,9,'Notifications','/masters/notifications',3,1,'2026-09-14 19:10:37',0);
/*!40000 ALTER TABLE `admin_sub_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_user_permissions`
--

DROP TABLE IF EXISTS `admin_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `admin_users_t_id` int(11) NOT NULL,
  `admin_main_module_id` int(11) DEFAULT NULL,
  `admin_sub_module_id` int(11) DEFAULT NULL,
  `can_view` tinyint(1) NOT NULL DEFAULT 0,
  `can_add` tinyint(1) NOT NULL DEFAULT 0,
  `can_edit` tinyint(1) NOT NULL DEFAULT 0,
  `can_delete` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_admin_user_permissions_admin_users_t_id` (`admin_users_t_id`),
  KEY `idx_admin_user_permissions_admin_main_module_id` (`admin_main_module_id`),
  KEY `idx_admin_user_permissions_admin_sub_module_id` (`admin_sub_module_id`)
) ENGINE=InnoDB AUTO_INCREMENT=74 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_user_permissions`
--

LOCK TABLES `admin_user_permissions` WRITE;
/*!40000 ALTER TABLE `admin_user_permissions` DISABLE KEYS */;
INSERT INTO `admin_user_permissions` VALUES (58,1,1,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(59,1,2,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(60,1,3,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(61,1,4,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(62,1,5,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(63,1,6,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(64,1,7,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(65,1,10,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(66,1,11,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(67,1,12,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(68,1,13,NULL,1,1,1,1,'2026-09-14 19:28:47',0),(69,1,8,1,1,1,1,1,'2026-09-14 19:28:47',0),(70,1,8,2,1,1,1,1,'2026-09-14 19:28:47',0),(71,1,9,3,1,1,1,1,'2026-09-14 19:28:47',0),(72,1,9,4,1,1,1,1,'2026-09-14 19:28:47',0),(73,1,9,5,1,1,1,1,'2026-09-14 19:28:47',0);
/*!40000 ALTER TABLE `admin_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `admin_users_t`
--

DROP TABLE IF EXISTS `admin_users_t`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `admin_users_t` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `email` varchar(255) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `profile_image` longtext DEFAULT NULL,
  `login_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_admin_users_t_tenant_id` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `admin_users_t`
--

LOCK TABLES `admin_users_t` WRITE;
/*!40000 ALTER TABLE `admin_users_t` DISABLE KEYS */;
INSERT INTO `admin_users_t` VALUES (1,1,'Demo Admin','9999999999','admin@demostore.com','123456','Admin',NULL,0,'2026-09-14 16:53:54',0);
/*!40000 ALTER TABLE `admin_users_t` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_content`
--

DROP TABLE IF EXISTS `app_content`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_content` (
  `tenant_id` int(11) NOT NULL,
  `collection` varchar(30) NOT NULL,
  `draft_json` longtext NOT NULL,
  `published_json` longtext DEFAULT NULL,
  `draft_revision` int(11) NOT NULL DEFAULT 1,
  `revision` int(11) NOT NULL DEFAULT 0,
  `updated_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`tenant_id`,`collection`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_content`
--

LOCK TABLES `app_content` WRITE;
/*!40000 ALTER TABLE `app_content` DISABLE KEYS */;
INSERT INTO `app_content` VALUES (1,'home','{\"tabs\":[{\"id\":\"food\",\"label\":\"Food\",\"imageUrl\":\"public_app/banners/tab-food.png\"},{\"id\":\"grocery\",\"label\":\"Grocery\",\"imageUrl\":\"public_app/banners/tab-grocery.png\"}],\"filters\":[{\"id\":\"filter\",\"label\":\"Filter\"},{\"id\":\"veg\",\"label\":\"Veg\"},{\"id\":\"non-veg\",\"label\":\"Non-Veg\"},{\"id\":\"best-seller\",\"label\":\"Best Seller\"},{\"id\":\"rating\",\"label\":\"+Rating 4.0\"}]}','{\"tabs\":[{\"id\":\"food\",\"label\":\"Food\",\"imageUrl\":\"public_app/banners/tab-food.png\"},{\"id\":\"grocery\",\"label\":\"Grocery\",\"imageUrl\":\"public_app/banners/tab-grocery.png\"}],\"filters\":[{\"id\":\"filter\",\"label\":\"Filter\"},{\"id\":\"veg\",\"label\":\"Veg\"},{\"id\":\"non-veg\",\"label\":\"Non-Veg\"},{\"id\":\"best-seller\",\"label\":\"Best Seller\"},{\"id\":\"rating\",\"label\":\"+Rating 4.0\"}]}',1,1,'2026-10-06 11:21:45'),(1,'onboarding','{\"displayPolicy\":\"first_use\",\"slides\":[{\"id\":\"food\",\"kind\":\"image\",\"title\":\"Your favourite food, delivered\",\"mediaUrl\":\"public_app/onboarding/food.png\",\"altText\":\"Food delivery\"},{\"id\":\"grocery\",\"kind\":\"image\",\"title\":\"Groceries for every day\",\"mediaUrl\":\"public_app/onboarding/grocery.png\",\"altText\":\"Groceries\"},{\"id\":\"meat\",\"kind\":\"image\",\"title\":\"Fresh meat and essentials\",\"mediaUrl\":\"public_app/onboarding/meat.png\",\"altText\":\"Fresh meat\"},{\"id\":\"delivery\",\"kind\":\"image\",\"title\":\"Fast delivery to your door\",\"mediaUrl\":\"public_app/onboarding/delivery-person.png\",\"altText\":\"Delivery partner\"}]}','{\"displayPolicy\":\"first_use\",\"slides\":[{\"id\":\"food\",\"kind\":\"image\",\"title\":\"Your favourite food, delivered\",\"mediaUrl\":\"public_app/onboarding/food.png\",\"altText\":\"Food delivery\"},{\"id\":\"grocery\",\"kind\":\"image\",\"title\":\"Groceries for every day\",\"mediaUrl\":\"public_app/onboarding/grocery.png\",\"altText\":\"Groceries\"},{\"id\":\"meat\",\"kind\":\"image\",\"title\":\"Fresh meat and essentials\",\"mediaUrl\":\"public_app/onboarding/meat.png\",\"altText\":\"Fresh meat\"},{\"id\":\"delivery\",\"kind\":\"image\",\"title\":\"Fast delivery to your door\",\"mediaUrl\":\"public_app/onboarding/delivery-person.png\",\"altText\":\"Delivery partner\"}]}',1,1,'2026-10-02 19:28:03');
/*!40000 ALTER TABLE `app_content` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_ratings`
--

DROP TABLE IF EXISTS `app_ratings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_ratings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `rating` tinyint(1) NOT NULL DEFAULT 5,
  `comment` varchar(255) DEFAULT NULL,
  `app_version` varchar(50) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_app_ratings_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_ratings`
--

LOCK TABLES `app_ratings` WRITE;
/*!40000 ALTER TABLE `app_ratings` DISABLE KEYS */;
/*!40000 ALTER TABLE `app_ratings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `app_versions`
--

DROP TABLE IF EXISTS `app_versions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `app_versions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `app_type` varchar(20) NOT NULL COMMENT 'public / vendor / delivery / admin',
  `platform` varchar(20) NOT NULL DEFAULT 'android' COMMENT 'android / ios',
  `app_link` varchar(255) DEFAULT NULL,
  `current_version` varchar(50) DEFAULT NULL,
  `force_update_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 no,1 yes',
  `maintenance_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 live,1 under maintenance',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `app_versions`
--

LOCK TABLES `app_versions` WRITE;
/*!40000 ALTER TABLE `app_versions` DISABLE KEYS */;
/*!40000 ALTER TABLE `app_versions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `audit_logs`
--

DROP TABLE IF EXISTS `audit_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `audit_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_audit_logs_tenant_id` (`tenant_id`),
  KEY `idx_audit_logs_actor_type` (`actor_type`),
  KEY `idx_audit_logs_actor_id` (`actor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `audit_logs`
--

LOCK TABLES `audit_logs` WRITE;
/*!40000 ALTER TABLE `audit_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `audit_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `banners`
--

DROP TABLE IF EXISTS `banners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `banners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `banner_image` longtext DEFAULT NULL,
  `link_type` varchar(20) DEFAULT NULL COMMENT 'product / vendor / category / external',
  `product_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `external_url` varchar(255) DEFAULT NULL,
  `banner_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  `location_id` int(11) DEFAULT NULL,
  `placement` varchar(30) NOT NULL DEFAULT 'home_promo',
  `category_id` int(11) DEFAULT NULL,
  `subcategory_id` int(11) DEFAULT NULL,
  `vertical` varchar(50) DEFAULT NULL,
  `aspect_ratio` decimal(6,3) DEFAULT NULL,
  `alt_text` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_banners_tenant_id` (`tenant_id`),
  KEY `idx_banners_product_id` (`product_id`),
  KEY `idx_banners_vendor_id` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `banners`
--

LOCK TABLES `banners` WRITE;
/*!40000 ALTER TABLE `banners` DISABLE KEYS */;
INSERT INTO `banners` VALUES (3,1,'public_app/banners/home-header.png','category',NULL,NULL,NULL,1,1,'2026-10-02 19:28:03',0,NULL,'home_header',9001,NULL,'food',2.750,'Fresh food delivered to your door'),(4,1,'public_app/banners/banner-green-eats.png','category',NULL,NULL,NULL,1,1,'2026-10-02 19:28:03',0,NULL,'home_promo',9002,NULL,'food',2.100,'Green eats, clean conscience');
/*!40000 ALTER TABLE `banners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `billing_transactions`
--

DROP TABLE IF EXISTS `billing_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `billing_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_subscription_id` int(11) NOT NULL,
  `transaction_reference` varchar(100) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_gateway` varchar(50) DEFAULT NULL,
  `payment_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 success,2 failed,3 refunded',
  `paid_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_billing_transactions_tenant_subscription_id` (`tenant_subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `billing_transactions`
--

LOCK TABLES `billing_transactions` WRITE;
/*!40000 ALTER TABLE `billing_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `billing_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `cart_items`
--

DROP TABLE IF EXISTS `cart_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `cart_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `cart_id` int(11) NOT NULL,
  `product_variant_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price_at_add` decimal(10,2) NOT NULL DEFAULT 0.00,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_cart_items_cart_id` (`cart_id`),
  KEY `idx_cart_items_product_variant_id` (`product_variant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `cart_items`
--

LOCK TABLES `cart_items` WRITE;
/*!40000 ALTER TABLE `cart_items` DISABLE KEYS */;
INSERT INTO `cart_items` VALUES (1,2,9002,2,220.00,'2026-10-02 18:42:36',1),(2,3,9002,2,220.00,'2026-10-02 18:45:42',1),(3,4,9002,1,220.00,'2026-10-02 18:46:56',0),(4,5,9024,1,340.00,'2026-10-02 19:23:58',0),(5,6,9002,1,220.00,'2026-10-03 10:38:29',0),(6,7,9002,1,220.00,'2026-10-03 10:40:49',0),(7,8,9002,1,220.00,'2026-10-03 10:42:33',0),(8,8,9012,1,520.00,'2026-10-03 10:42:35',0),(9,9,9002,1,220.00,'2026-10-03 11:30:17',0),(10,10,9002,1,220.00,'2026-10-03 11:34:30',0),(11,11,9002,1,220.00,'2026-10-03 11:40:17',0),(12,12,9002,1,220.00,'2026-10-03 11:41:08',1),(13,12,9002,1,220.00,'2026-10-03 11:41:52',1),(14,12,9012,1,520.00,'2026-10-03 12:02:27',0),(15,13,9033,1,820.00,'2026-10-03 12:15:14',0),(16,14,9033,1,820.00,'2026-10-03 12:34:36',1),(17,14,9033,1,820.00,'2026-10-03 16:58:50',0),(18,15,9033,1,820.00,'2026-10-03 17:11:13',0),(19,16,9002,1,220.00,'2026-10-03 17:18:23',0),(20,17,9035,1,220.00,'2026-10-06 11:32:32',0),(21,18,9035,1,220.00,'2026-10-06 12:19:33',0),(22,19,9035,1,220.00,'2026-10-06 15:31:22',1),(23,19,9036,5,190.00,'2026-10-06 15:31:23',0);
/*!40000 ALTER TABLE `cart_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `carts`
--

DROP TABLE IF EXISTS `carts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `carts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 active,1 converted,2 abandoned',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_carts_customer_id` (`customer_id`),
  KEY `idx_carts_vendor_id` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=20 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `carts`
--

LOCK TABLES `carts` WRITE;
/*!40000 ALTER TABLE `carts` DISABLE KEYS */;
INSERT INTO `carts` VALUES (1,9008,9001,2,'2026-10-02 18:41:26',0),(2,9008,9001,2,'2026-10-02 18:42:36',0),(3,9008,9001,2,'2026-10-02 18:45:42',0),(4,9008,9001,2,'2026-10-02 18:46:56',0),(5,9009,9002,0,'2026-10-02 19:23:58',0),(6,9010,9001,1,'2026-10-03 10:38:29',0),(7,9010,9001,1,'2026-10-03 10:40:49',0),(8,9007,9001,1,'2026-10-03 10:42:33',0),(9,9012,9001,1,'2026-10-03 11:30:17',0),(10,9013,9001,1,'2026-10-03 11:34:30',0),(11,9013,9001,1,'2026-10-03 11:40:17',0),(12,9013,9001,1,'2026-10-03 11:41:08',0),(13,9013,9004,1,'2026-10-03 12:15:14',0),(14,9013,9004,1,'2026-10-03 12:34:36',0),(15,9013,9004,2,'2026-10-03 17:11:13',0),(16,9013,9001,0,'2026-10-03 17:18:23',0),(17,9014,9006,0,'2026-10-06 11:32:32',0),(18,9015,9006,1,'2026-10-06 12:19:33',0),(19,9007,9006,0,'2026-10-06 15:31:22',0);
/*!40000 ALTER TABLE `carts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `catalog_filters`
--

DROP TABLE IF EXISTS `catalog_filters`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `catalog_filters` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `filter_name` varchar(150) DEFAULT NULL,
  `filter_type` varchar(30) DEFAULT 'checkbox' COMMENT 'checkbox / range / radio',
  `filter_values` text DEFAULT NULL,
  `filter_order` int(11) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_catalog_filters_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `catalog_filters`
--

LOCK TABLES `catalog_filters` WRITE;
/*!40000 ALTER TABLE `catalog_filters` DISABLE KEYS */;
/*!40000 ALTER TABLE `catalog_filters` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categories`
--

DROP TABLE IF EXISTS `categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `parent_id` int(11) DEFAULT NULL COMMENT 'self-reference to categories.id',
  `category_name` varchar(225) DEFAULT NULL,
  `category_image` longtext DEFAULT NULL,
  `vertical` varchar(50) DEFAULT 'food' COMMENT 'food / grocery / meat / medicine / fruit',
  `category_order` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_categories_tenant_id` (`tenant_id`),
  KEY `idx_categories_parent_id` (`parent_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9038 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categories`
--

LOCK TABLES `categories` WRITE;
/*!40000 ALTER TABLE `categories` DISABLE KEYS */;
INSERT INTO `categories` VALUES (9001,1,NULL,'Biryani','public_app/categories/cat-biryani.png','food',1,1,'2026-09-18 14:41:14',0),(9002,1,NULL,'Paneer','public_app/categories/cat-paneer.png','food',2,1,'2026-09-18 14:41:14',0),(9003,1,NULL,'Snacks','public_app/categories/cat-snacks.png','food',3,1,'2026-09-18 14:41:14',0),(9004,1,NULL,'Tiffins','public_app/categories/cat-tiffins.png','food',4,1,'2026-09-18 14:41:14',0),(9005,1,NULL,'Sweets','public_app/categories/cat-sweets.png','food',5,1,'2026-09-18 14:41:14',0),(9011,1,NULL,'Masala & spices','public_app/categories/category-grocery.png','grocery',1,1,'2026-09-18 14:41:14',0),(9012,1,NULL,'Staples','public_app/categories/category-grocery.png','grocery',2,1,'2026-09-18 14:41:14',0),(9013,1,NULL,'Oils','public_app/categories/category-grocery.png','grocery',3,1,'2026-09-18 14:41:14',0),(9021,1,9011,'Powders','public_app/categories/category-grocery.png','grocery',1,1,'2026-09-21 16:02:18',0),(9022,1,9011,'Whole spices','public_app/categories/category-grocery.png','grocery',2,1,'2026-09-21 16:02:18',0),(9023,1,9011,'Masala blends','public_app/categories/category-grocery.png','grocery',3,1,'2026-09-21 16:02:18',0),(9024,1,9012,'Rice','public_app/categories/category-grocery.png','grocery',1,1,'2026-09-21 16:02:18',0),(9025,1,9012,'Dals & pulses','public_app/categories/category-grocery.png','grocery',2,1,'2026-09-21 16:02:18',0),(9026,1,9012,'Flours & atta','public_app/categories/category-grocery.png','grocery',3,1,'2026-09-21 16:02:18',0),(9027,1,9013,'Cooking oils','public_app/categories/category-grocery.png','grocery',1,1,'2026-09-21 16:02:18',0),(9028,1,9013,'Ghee & butter','public_app/categories/category-grocery.png','grocery',2,1,'2026-09-21 16:02:18',0),(9029,1,NULL,'Veg Plate','public_app/categories/cat-veg-plate.png','food',6,1,'2026-09-28 12:36:24',0),(9030,1,NULL,'Cakes','public_app/categories/cat-cakes.png','food',7,1,'2026-09-28 12:36:24',0),(9031,1,NULL,'Meat Dishes','public_app/categories/cat-meat-dishes.png','food',8,1,'2026-09-28 12:36:24',0),(9032,1,NULL,'Beverages','public_app/categories/cat-beverages.png','food',9,1,'2026-10-01 07:29:25',0),(9033,1,9001,'Fried Rice','public_app/categories/cat-biryani.png','food',2,1,'2026-10-01 07:29:25',0),(9034,1,9001,'Sambar Rice','public_app/categories/cat-biryani.png','food',3,1,'2026-10-01 07:29:25',0),(9035,1,9001,'Paneer Biryani','public_app/categories/cat-biryani.png','food',4,1,'2026-10-01 07:29:25',0),(9036,1,9001,'Chicken Biryani','public_app/categories/cat-biryani.png','food',5,1,'2026-10-01 07:29:25',0),(9037,1,9001,'Veg Biryani','public_app/categories/cat-biryani.png','food',6,1,'2026-10-01 07:29:25',0);
/*!40000 ALTER TABLE `categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `category_attributes`
--

DROP TABLE IF EXISTS `category_attributes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_attributes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `category_id` int(11) NOT NULL,
  `attribute_name` varchar(150) DEFAULT NULL,
  `attribute_type` varchar(30) DEFAULT 'text' COMMENT 'text / number / dropdown / boolean',
  `attribute_values` text DEFAULT NULL COMMENT 'comma separated / JSON options',
  `is_required` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_category_attributes_category_id` (`category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `category_attributes`
--

LOCK TABLES `category_attributes` WRITE;
/*!40000 ALTER TABLE `category_attributes` DISABLE KEYS */;
/*!40000 ALTER TABLE `category_attributes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `checkout_quotes`
--

DROP TABLE IF EXISTS `checkout_quotes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `checkout_quotes` (
  `id` varchar(48) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `cart_id` int(11) NOT NULL,
  `cart_version` int(11) NOT NULL,
  `payload_json` longtext NOT NULL,
  `expires_at` datetime NOT NULL,
  `consumed_order_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_quote_owner` (`customer_id`,`expires_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `checkout_quotes`
--

LOCK TABLES `checkout_quotes` WRITE;
/*!40000 ALTER TABLE `checkout_quotes` DISABLE KEYS */;
/*!40000 ALTER TABLE `checkout_quotes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `coupons`
--

DROP TABLE IF EXISTS `coupons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `coupons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_coupons_tenant_id` (`tenant_id`),
  KEY `idx_coupons_vendor_id` (`vendor_id`),
  KEY `idx_coupons_category_id` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `coupons`
--

LOCK TABLES `coupons` WRITE;
/*!40000 ALTER TABLE `coupons` DISABLE KEYS */;
INSERT INTO `coupons` VALUES (9001,1,9001,NULL,'EKART50','₹50 off above ₹299','flat',50.00,NULL,299.00,3,1000,'2026-08-29 14:41:15','2026-10-02 14:41:15',0,'2026-09-18 14:41:15',0),(9002,1,9001,NULL,'DINNER20','20% off dinner','percentage',35832.00,75800.00,35218.00,2,500,'2026-09-13 14:41:15','2026-10-16 14:41:15',1,'2026-09-18 14:41:15',0),(9003,1,9001,NULL,'WELCOME100','₹100 off first order','percentage',100.00,100.00,32408.00,1,300,'2026-07-20 14:41:15','2026-09-01 14:41:15',0,'2026-09-18 14:41:15',0);
/*!40000 ALTER TABLE `coupons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_account_requests`
--

DROP TABLE IF EXISTS `customer_account_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_account_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `request_type` varchar(30) NOT NULL,
  `reason` text DEFAULT NULL,
  `status` varchar(30) NOT NULL DEFAULT 'pending',
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_account_requests`
--

LOCK TABLES `customer_account_requests` WRITE;
/*!40000 ALTER TABLE `customer_account_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_account_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_addresses`
--

DROP TABLE IF EXISTS `customer_addresses`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_addresses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `address_label` varchar(50) DEFAULT 'home' COMMENT 'home / work / other',
  `full_address` longtext DEFAULT NULL,
  `landmark` varchar(255) DEFAULT NULL,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `pincode` varchar(15) DEFAULT NULL,
  `is_default` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  `recipient_name` varchar(150) DEFAULT NULL,
  `recipient_phone` varchar(20) DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_addresses_customer_id` (`customer_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9025 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_addresses`
--

LOCK TABLES `customer_addresses` WRITE;
/*!40000 ALTER TABLE `customer_addresses` DISABLE KEYS */;
INSERT INTO `customer_addresses` VALUES (9001,9001,'Home','14/3 Plot 8, Nadar Street, Thiru Vi Ka Nagar, Chennai 600082','Ring the bell twice','13.1100','80.2280','600082',0,'2026-09-18 14:41:14',0,NULL,NULL,NULL),(9002,9002,'Home','22 Ormes Road, Kilpauk, Chennai 600010','Flat 3B','13.0827','80.2400','600010',1,'2026-09-18 14:41:14',0,NULL,NULL,NULL),(9003,9003,'Home','7 Nelson Road, Aminjikarai, Chennai 600029',NULL,'13.0710','80.2230','600029',1,'2026-09-18 14:41:14',0,NULL,NULL,NULL),(9004,9004,'Home','AB-42, 4th Street, Anna Nagar, Chennai 600040','Opposite the park','13.0860','80.2090','600040',1,'2026-09-18 14:41:14',0,NULL,NULL,NULL),(9005,9005,'Work','18 Pulla Avenue, Shenoy Nagar, Chennai 600030','Security desk','13.0790','80.2270','600030',1,'2026-09-18 14:41:14',0,NULL,NULL,NULL),(9006,9006,'home','301, JSR Enclave','Lorem Ipsum',NULL,NULL,'5333124',1,'2026-10-02 16:49:19',0,'Rajesh','+91 12345678912',NULL),(9007,9001,'home','301, JSR Enclave','Lorem Ipsum',NULL,NULL,'5333124',0,'2026-10-02 17:49:03',0,'Rajesh','+91 12345678912',NULL),(9008,9001,'home','301, JSR Enclave','Lorem Ipsum',NULL,NULL,'5333124',1,'2026-10-02 17:53:31',0,'Rajesh','+91 12345678912',NULL),(9009,9007,'home','301, JSR Enclave','Lorem Ipsum',NULL,NULL,'5333124',0,'2026-10-02 18:36:59',0,'Rajesh','+91 12345678912',NULL),(9010,9008,'other','API smoke test address updated','Test',NULL,NULL,'600001',0,'2026-10-02 18:40:57',1,'API Test','9000000000',NULL),(9011,9008,'other','API audit temporary address updated',NULL,NULL,NULL,'600001',0,'2026-10-02 18:45:42',1,'API Audit','9000000000',NULL),(9012,9007,'home','301, JSR Enclave','Lorem Ipsum',NULL,NULL,'5333124',0,'2026-10-02 18:50:40',0,'Rajesh','+91 12345678912',NULL),(9013,9007,'home','301, JSR Enclave','Lorem Ipsum',NULL,NULL,'5333124',0,'2026-10-02 18:59:05',0,'Rajesh','+91 12345678912',NULL),(9014,9007,'home','301, JSR Enclave','Lorem Ipsum',NULL,NULL,'5333124',0,'2026-10-02 19:11:07',0,'Rajesh','+91 12345678912',NULL),(9015,9009,'home','Zbsb',NULL,NULL,NULL,'4646',1,'2026-10-02 19:23:18',0,'Ksj','9797',NULL),(9016,9010,'home','Cgg','Hcvj',NULL,NULL,'999989688888',1,'2026-10-03 10:37:19',0,'Dxrccr','999885888888',NULL),(9017,9007,'home',',bb',NULL,NULL,NULL,'0909',0,'2026-10-03 10:42:17',0,'Chch','09088086',NULL),(9018,9007,'home','Gxgx',NULL,NULL,NULL,'98908',0,'2026-10-03 10:43:41',0,'Yf','598,7',NULL),(9019,9011,'home','An zhs hs','n J sj',NULL,NULL,'76946 464',1,'2026-10-03 10:48:25',0,'Gsusbusbs','64 49046046064',NULL),(9020,9012,'home','Ubuvhvjv46+&;+','Hbyvfcrvt77+',NULL,NULL,'59 6 6 6 6',1,'2026-10-03 11:29:56',0,'Teja','9632587410',NULL),(9021,9013,'home','Jvhvyvyvyvyv','Gvhvyvjvuc',NULL,NULL,'86860',1,'2026-10-03 11:34:24',0,'Teja','96638605050',NULL),(9022,9014,'other','Shenoy Nagar, Chennai','ggfg','13.076426712705567','80.22244691848756','600030',1,'2026-10-06 11:30:18',0,'tcft','55555',9002),(9023,9015,'home','Shenoy Nagar, Chennai','gxcgg','13.096031311502971','80.23229598999025','600030',1,'2026-10-06 12:20:37',0,'t es t','8686688856888',9002),(9024,9007,'home','Rajahmundry, Rajahmundry','gxyffyct','16.9980232','81.7979575','533101',1,'2026-10-06 17:30:36',0,'test','96856754382',9004);
/*!40000 ALTER TABLE `customer_addresses` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_devices`
--

DROP TABLE IF EXISTS `customer_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `device_token` varchar(255) DEFAULT NULL,
  `device_type` varchar(20) DEFAULT 'android' COMMENT 'android / ios / web',
  `app_version` varchar(50) DEFAULT NULL,
  `last_active_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  `device_id` varchar(150) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_customer_devices_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_devices`
--

LOCK TABLES `customer_devices` WRITE;
/*!40000 ALTER TABLE `customer_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_favorites`
--

DROP TABLE IF EXISTS `customer_favorites`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_favorites` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_customer_favorites_customer_id` (`customer_id`),
  KEY `idx_customer_favorites_product_id` (`product_id`),
  KEY `idx_customer_favorites_vendor_id` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_favorites`
--

LOCK TABLES `customer_favorites` WRITE;
/*!40000 ALTER TABLE `customer_favorites` DISABLE KEYS */;
INSERT INTO `customer_favorites` VALUES (1,9006,NULL,9002,'2026-10-02 17:18:46',0),(2,9006,NULL,9005,'2026-10-02 17:19:03',0),(3,9006,NULL,9001,'2026-10-02 17:19:07',0),(4,9008,NULL,9004,'2026-10-02 18:40:57',1),(5,9008,9025,NULL,'2026-10-02 18:40:57',1),(6,9008,NULL,9001,'2026-10-02 18:45:42',1),(7,9013,NULL,9004,'2026-10-03 12:17:16',1),(8,9013,NULL,9004,'2026-10-03 12:17:57',1),(9,9013,NULL,9001,'2026-10-03 12:18:06',1),(10,9013,NULL,9001,'2026-10-03 12:24:19',1),(11,9013,NULL,9004,'2026-10-03 12:24:50',1),(12,9013,NULL,9001,'2026-10-03 12:24:52',1),(13,9013,NULL,9005,'2026-10-03 12:24:54',1),(14,9013,NULL,9004,'2026-10-03 12:33:03',1),(15,9013,NULL,9004,'2026-10-03 15:00:10',1),(16,9013,NULL,9004,'2026-10-03 15:00:11',1),(17,9013,NULL,9004,'2026-10-03 15:47:10',1),(18,9015,NULL,9006,'2026-10-06 12:52:39',0),(19,9007,9031,NULL,'2026-10-06 15:31:46',0),(20,9007,9030,NULL,'2026-10-06 15:31:48',0);
/*!40000 ALTER TABLE `customer_favorites` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_invoices`
--

DROP TABLE IF EXISTS `customer_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pdf_path` longtext DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_customer_invoices_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_invoices`
--

LOCK TABLES `customer_invoices` WRITE;
/*!40000 ALTER TABLE `customer_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_membership_plans`
--

DROP TABLE IF EXISTS `customer_membership_plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_membership_plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `plan_name` varchar(150) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `duration_days` int(11) NOT NULL DEFAULT 30,
  `benefits` text DEFAULT NULL COMMENT 'free delivery, priority support etc',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_customer_membership_plans_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_membership_plans`
--

LOCK TABLES `customer_membership_plans` WRITE;
/*!40000 ALTER TABLE `customer_membership_plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_membership_plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_memberships`
--

DROP TABLE IF EXISTS `customer_memberships`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_memberships` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `customer_membership_plan_id` int(11) NOT NULL,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 active,1 expired,2 cancelled',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_customer_memberships_customer_id` (`customer_id`),
  KEY `idx_customer_memberships_customer_membership_plan_id` (`customer_membership_plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_memberships`
--

LOCK TABLES `customer_memberships` WRITE;
/*!40000 ALTER TABLE `customer_memberships` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_memberships` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_preferences`
--

DROP TABLE IF EXISTS `customer_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `preferred_language` varchar(20) DEFAULT 'en',
  `dietary_preference` varchar(50) DEFAULT NULL COMMENT 'veg / non-veg / vegan',
  `marketing_opt_in` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_customer_preferences_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_preferences`
--

LOCK TABLES `customer_preferences` WRITE;
/*!40000 ALTER TABLE `customer_preferences` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_sessions`
--

DROP TABLE IF EXISTS `customer_sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_sessions` (
  `id` varchar(48) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `refresh_hash` varchar(64) NOT NULL,
  `expires_at` datetime NOT NULL,
  `revoked_at` datetime DEFAULT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_refresh` (`refresh_hash`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_sessions`
--

LOCK TABLES `customer_sessions` WRITE;
/*!40000 ALTER TABLE `customer_sessions` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customer_wallets`
--

DROP TABLE IF EXISTS `customer_wallets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customer_wallets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `transaction_type` varchar(20) DEFAULT 'credit' COMMENT 'credit / debit',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `balance_after` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reference_type` varchar(50) DEFAULT NULL COMMENT 'order / refund / referral / manual',
  `reference_id` int(11) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_customer_wallets_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customer_wallets`
--

LOCK TABLES `customer_wallets` WRITE;
/*!40000 ALTER TABLE `customer_wallets` DISABLE KEYS */;
/*!40000 ALTER TABLE `customer_wallets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `customers`
--

DROP TABLE IF EXISTS `customers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `customers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_customers_tenant_id` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9016 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `customers`
--

LOCK TABLES `customers` WRITE;
/*!40000 ALTER TABLE `customers` DISABLE KEYS */;
INSERT INTO `customers` VALUES (9001,1,'Meera S.',NULL,'9876500001',NULL,NULL,NULL,NULL,NULL,0,1,'2026-09-18 14:41:14',0),(9002,1,'Arun P.',NULL,'9876500002',NULL,NULL,NULL,NULL,NULL,0,1,'2026-09-18 14:41:14',0),(9003,1,'Kavitha R.',NULL,'9876500003',NULL,NULL,NULL,NULL,NULL,0,1,'2026-09-18 14:41:14',0),(9004,1,'Lakshmi N.',NULL,'9876500004',NULL,NULL,NULL,NULL,NULL,0,1,'2026-09-18 14:41:14',0),(9005,1,'Joseph D.',NULL,'9876500005',NULL,NULL,NULL,NULL,NULL,0,1,'2026-09-18 14:41:14',0),(9006,1,'',NULL,'9052376494',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-02 16:48:48',0),(9007,1,'',NULL,'7997753587',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-02 18:36:52',0),(9008,1,'',NULL,'9786943769',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-02 18:39:55',0),(9009,1,'',NULL,'7995734431',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-02 19:22:34',0),(9010,1,'',NULL,'9858555555',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-03 10:36:46',0),(9011,1,'',NULL,'7997753887',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-03 10:45:03',0),(9012,1,'',NULL,'9668686066',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-03 11:28:46',0),(9013,1,'',NULL,'9666666682',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-03 11:34:06',0),(9014,1,'',NULL,'9898896885',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-06 10:19:56',0),(9015,1,'',NULL,'9999898868',NULL,NULL,NULL,NULL,NULL,0,1,'2026-10-06 12:06:48',0);
/*!40000 ALTER TABLE `customers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_assignments`
--

DROP TABLE IF EXISTS `delivery_assignments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delivery_assignments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `delivery_partner_id` int(11) NOT NULL,
  `assigned_at` datetime DEFAULT current_timestamp(),
  `offer_expires_at` datetime DEFAULT NULL,
  `accepted_at` datetime DEFAULT NULL,
  `arrived_store_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `arrived_customer_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `assignment_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 assigned,1 accepted,2 picked_up,3 delivered,4 rejected,5 cancelled',
  `distance_km` decimal(6,2) DEFAULT NULL,
  `base_pay` decimal(10,2) NOT NULL DEFAULT 0.00,
  `distance_pay` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tip_pay` decimal(10,2) NOT NULL DEFAULT 0.00,
  `failure_reason` varchar(255) DEFAULT NULL,
  `handover_rating` varchar(10) DEFAULT NULL COMMENT 'slow / fine / quick',
  `proof_photo` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_delivery_assignments_order_id` (`order_id`),
  KEY `idx_delivery_assignments_delivery_partner_id` (`delivery_partner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9142 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_assignments`
--

LOCK TABLES `delivery_assignments` WRITE;
/*!40000 ALTER TABLE `delivery_assignments` DISABLE KEYS */;
INSERT INTO `delivery_assignments` VALUES (9001,9006,9002,'2026-09-18 14:24:14',NULL,'2026-09-18 14:25:14','2026-09-18 14:40:14',NULL,NULL,NULL,1,1.90,40.00,0.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:14',0),(9002,9007,9001,'2026-09-18 14:40:14',NULL,NULL,NULL,NULL,NULL,NULL,0,4.60,46.00,10.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:14',0),(9003,9008,9001,'2026-09-18 14:26:14',NULL,'2026-09-18 14:27:14','2026-09-18 14:33:14','2026-09-18 14:37:14','2026-09-18 17:18:23',NULL,2,4.60,46.00,10.00,10.00,NULL,NULL,'/uploads/partner_app/delivery-9001-mu8dyesa-1y2insuk.png','2026-09-18 14:41:14',0),(9004,9009,9001,'2026-09-18 13:49:14',NULL,'2026-09-18 13:50:14','2026-09-18 14:01:14','2026-09-18 14:09:14','2026-09-18 14:27:14','2026-09-18 14:29:14',3,3.10,46.00,12.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:14',0),(9005,9023,9001,'2026-09-18 13:43:14',NULL,'2026-09-18 13:44:14','2026-09-18 13:47:14','2026-09-18 13:49:14','2026-09-18 13:59:14','2026-09-18 14:01:14',3,2.80,42.00,10.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:14',0),(9006,9021,9001,'2026-09-18 14:39:14',NULL,NULL,NULL,NULL,NULL,NULL,0,3.20,52.00,12.00,14.00,NULL,NULL,NULL,'2026-09-18 14:41:14',0),(9007,9012,9001,'2026-09-18 12:57:14',NULL,'2026-09-18 12:58:14','2026-09-18 13:06:14','2026-09-18 13:11:14','2026-09-18 13:16:14',NULL,5,1.90,20.00,0.00,0.00,'Customer unavailable',NULL,NULL,'2026-09-18 14:41:14',0),(9101,9101,9001,'2026-09-16 14:36:14',NULL,'2026-09-16 14:36:14','2026-09-16 14:51:14','2026-09-16 14:54:14','2026-09-16 15:10:14','2026-09-16 15:12:14',3,2.80,44.00,10.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9102,9102,9001,'2026-09-15 14:29:14',NULL,'2026-09-15 14:29:14','2026-09-15 14:44:14','2026-09-15 14:47:14','2026-09-15 15:03:14','2026-09-15 15:05:14',3,3.60,44.00,14.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9103,9103,9001,'2026-09-14 14:22:14',NULL,'2026-09-14 14:22:14','2026-09-14 14:37:14','2026-09-14 14:40:14','2026-09-14 14:56:14','2026-09-14 14:58:14',3,4.40,44.00,6.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9104,9104,9001,'2026-09-13 14:15:14',NULL,'2026-09-13 14:15:14','2026-09-13 14:30:14','2026-09-13 14:33:14','2026-09-13 14:49:14','2026-09-13 14:51:14',3,2.00,44.00,10.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9105,9105,9001,'2026-09-12 14:08:14',NULL,'2026-09-12 14:08:14','2026-09-12 14:23:14','2026-09-12 14:26:14','2026-09-12 14:42:14','2026-09-12 14:44:14',3,2.80,44.00,14.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9106,9106,9001,'2026-09-17 14:01:14',NULL,'2026-09-17 14:01:14','2026-09-17 14:16:14','2026-09-17 14:19:14','2026-09-17 14:35:14','2026-09-17 14:37:14',3,3.60,44.00,6.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9107,9107,9001,'2026-09-16 13:54:14',NULL,'2026-09-16 13:54:14','2026-09-16 14:09:14','2026-09-16 14:12:14','2026-09-16 14:28:14','2026-09-16 14:30:14',3,4.40,44.00,10.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9108,9108,9001,'2026-09-15 13:47:14',NULL,'2026-09-15 13:47:14','2026-09-15 14:02:14','2026-09-15 14:05:14','2026-09-15 14:21:14','2026-09-15 14:23:14',3,2.00,44.00,14.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9109,9109,9001,'2026-09-14 13:40:14',NULL,'2026-09-14 13:40:14','2026-09-14 13:55:14','2026-09-14 13:58:14','2026-09-14 14:14:14','2026-09-14 14:16:14',3,2.80,44.00,6.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9110,9110,9001,'2026-09-13 13:33:14',NULL,'2026-09-13 13:33:14','2026-09-13 13:48:14','2026-09-13 13:51:14','2026-09-13 14:07:14','2026-09-13 14:09:14',3,3.60,44.00,10.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9111,9111,9001,'2026-09-12 13:26:14',NULL,'2026-09-12 13:26:14','2026-09-12 13:41:14','2026-09-12 13:44:14','2026-09-12 14:00:14','2026-09-12 14:02:14',3,4.40,44.00,14.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9112,9112,9001,'2026-09-17 13:19:14',NULL,'2026-09-17 13:19:14','2026-09-17 13:34:14','2026-09-17 13:37:14','2026-09-17 13:53:14','2026-09-17 13:55:14',3,2.00,44.00,6.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9113,9113,9001,'2026-09-16 13:12:14',NULL,'2026-09-16 13:12:14','2026-09-16 13:27:14','2026-09-16 13:30:14','2026-09-16 13:46:14','2026-09-16 13:48:14',3,2.80,44.00,10.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9114,9114,9001,'2026-09-15 13:05:14',NULL,'2026-09-15 13:05:14','2026-09-15 13:20:14','2026-09-15 13:23:14','2026-09-15 13:39:14','2026-09-15 13:41:14',3,3.60,44.00,14.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9115,9115,9001,'2026-09-14 12:58:14',NULL,'2026-09-14 12:58:14','2026-09-14 13:13:14','2026-09-14 13:16:14','2026-09-14 13:32:14','2026-09-14 13:34:14',3,4.40,44.00,6.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9116,9116,9001,'2026-09-13 12:51:14',NULL,'2026-09-13 12:51:14','2026-09-13 13:06:14','2026-09-13 13:09:14','2026-09-13 13:25:14','2026-09-13 13:27:14',3,2.00,44.00,10.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9117,9117,9001,'2026-09-12 12:44:14',NULL,'2026-09-12 12:44:14','2026-09-12 12:59:14','2026-09-12 13:02:14','2026-09-12 13:18:14','2026-09-12 13:20:14',3,2.80,44.00,14.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9118,9118,9001,'2026-09-17 12:37:14',NULL,'2026-09-17 12:37:14','2026-09-17 12:52:14','2026-09-17 12:55:14','2026-09-17 13:11:14','2026-09-17 13:13:14',3,3.60,44.00,6.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9119,9119,9001,'2026-09-16 12:30:14',NULL,'2026-09-16 12:30:14','2026-09-16 12:45:14','2026-09-16 12:48:14','2026-09-16 13:04:14','2026-09-16 13:06:14',3,4.40,44.00,10.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9120,9120,9001,'2026-09-15 12:23:14',NULL,'2026-09-15 12:23:14','2026-09-15 12:38:14','2026-09-15 12:41:14','2026-09-15 12:57:14','2026-09-15 12:59:14',3,2.00,44.00,14.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9121,9121,9001,'2026-09-14 12:16:14',NULL,'2026-09-14 12:16:14','2026-09-14 12:31:14','2026-09-14 12:34:14','2026-09-14 12:50:14','2026-09-14 12:52:14',3,2.80,44.00,6.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9122,9122,9001,'2026-09-13 12:09:14',NULL,'2026-09-13 12:09:14','2026-09-13 12:24:14','2026-09-13 12:27:14','2026-09-13 12:43:14','2026-09-13 12:45:14',3,3.60,44.00,10.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9123,9123,9001,'2026-09-12 12:02:14',NULL,'2026-09-12 12:02:14','2026-09-12 12:17:14','2026-09-12 12:20:14','2026-09-12 12:36:14','2026-09-12 12:38:14',3,4.40,44.00,14.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9124,9124,9001,'2026-09-17 11:55:14',NULL,'2026-09-17 11:55:14','2026-09-17 12:10:14','2026-09-17 12:13:14','2026-09-17 12:29:14','2026-09-17 12:31:14',3,2.00,44.00,6.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9125,9125,9001,'2026-09-16 11:48:14',NULL,'2026-09-16 11:48:14','2026-09-16 12:03:14','2026-09-16 12:06:14','2026-09-16 12:22:14','2026-09-16 12:24:14',3,2.80,44.00,10.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9126,9126,9001,'2026-09-15 11:41:14',NULL,'2026-09-15 11:41:14','2026-09-15 11:56:14','2026-09-15 11:59:14','2026-09-15 12:15:14','2026-09-15 12:17:14',3,3.60,44.00,14.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9127,9127,9001,'2026-09-14 11:34:14',NULL,'2026-09-14 11:34:14','2026-09-14 11:49:14','2026-09-14 11:52:14','2026-09-14 12:08:14','2026-09-14 12:10:14',3,4.40,44.00,6.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9128,9128,9001,'2026-09-13 11:27:14',NULL,'2026-09-13 11:27:14','2026-09-13 11:42:14','2026-09-13 11:45:14','2026-09-13 12:01:14','2026-09-13 12:03:14',3,2.00,44.00,10.00,10.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9129,9129,9001,'2026-09-12 11:20:14',NULL,'2026-09-12 11:20:14','2026-09-12 11:35:14','2026-09-12 11:38:14','2026-09-12 11:54:14','2026-09-12 11:56:14',3,2.80,44.00,14.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9130,9130,9001,'2026-09-17 11:13:14',NULL,'2026-09-17 11:13:14','2026-09-17 11:28:14','2026-09-17 11:31:14','2026-09-17 11:47:14','2026-09-17 11:49:14',3,3.60,44.00,6.00,0.00,NULL,NULL,NULL,'2026-09-18 14:41:15',0),(9133,9001,9002,'2026-09-19 15:16:16',NULL,NULL,NULL,NULL,NULL,NULL,4,3.40,40.00,10.00,10.00,NULL,NULL,NULL,'2026-09-19 15:16:16',0),(9134,9001,9001,'2026-09-19 15:16:16',NULL,NULL,NULL,NULL,NULL,NULL,0,3.40,40.00,10.00,10.00,NULL,NULL,NULL,'2026-09-19 15:16:16',0),(9135,9002,9002,'2026-09-25 15:51:35',NULL,NULL,NULL,NULL,NULL,NULL,4,3.20,40.00,10.00,0.00,NULL,NULL,NULL,'2026-09-25 15:51:35',0),(9136,9002,9001,'2026-09-25 15:51:35',NULL,NULL,NULL,NULL,NULL,NULL,0,3.20,40.00,10.00,0.00,NULL,NULL,NULL,'2026-09-25 15:51:35',0),(9137,9005,9002,'2026-09-28 09:58:26',NULL,NULL,NULL,NULL,NULL,NULL,0,0.20,40.00,1.00,0.00,NULL,NULL,NULL,'2026-09-28 09:58:26',0),(9138,9005,9001,'2026-09-28 09:58:26',NULL,NULL,NULL,NULL,NULL,NULL,0,0.20,40.00,1.00,0.00,NULL,NULL,NULL,'2026-09-28 09:58:26',0),(9139,9003,9002,'2026-09-29 12:49:11',NULL,NULL,NULL,NULL,NULL,NULL,0,1.90,40.00,6.00,0.00,NULL,NULL,NULL,'2026-09-29 12:49:11',0),(9140,9003,9003,'2026-09-29 12:49:11',NULL,NULL,NULL,NULL,NULL,NULL,0,1.90,40.00,6.00,0.00,NULL,NULL,NULL,'2026-09-29 12:49:11',0),(9141,9003,9001,'2026-09-29 12:49:11',NULL,NULL,NULL,NULL,NULL,NULL,0,1.90,40.00,6.00,0.00,NULL,NULL,NULL,'2026-09-29 12:49:11',0);
/*!40000 ALTER TABLE `delivery_assignments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_partner_settlements`
--

DROP TABLE IF EXISTS `delivery_partner_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delivery_partner_settlements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_delivery_partner_settlements_delivery_partner_id` (`delivery_partner_id`),
  KEY `idx_delivery_partner_settlements_delivery_assignment_id` (`delivery_assignment_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_partner_settlements`
--

LOCK TABLES `delivery_partner_settlements` WRITE;
/*!40000 ALTER TABLE `delivery_partner_settlements` DISABLE KEYS */;
INSERT INTO `delivery_partner_settlements` VALUES (9001,9001,NULL,'2026-09-05','2026-09-11',74,0.00,4585.00,0.00,4585.00,1,'2026-09-13 14:41:15','2026-09-18 14:41:15',0),(9002,9001,NULL,'2026-08-29','2026-09-04',61,0.00,3870.00,0.00,3870.00,1,'2026-09-06 14:41:15','2026-09-18 14:41:15',0),(9003,9001,NULL,'2026-08-22','2026-08-28',66,0.00,4102.00,0.00,4102.00,1,'2026-08-30 14:41:15','2026-09-18 14:41:15',0);
/*!40000 ALTER TABLE `delivery_partner_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_partners`
--

DROP TABLE IF EXISTS `delivery_partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delivery_partners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `name` varchar(255) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `pwd` varchar(255) DEFAULT NULL,
  `address` longtext DEFAULT NULL,
  `location_id` int(11) DEFAULT NULL,
  `zone_name` varchar(100) DEFAULT NULL,
  `shift_preference` varchar(20) DEFAULT NULL COMMENT 'mornings / afternoons / evenings / nights',
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
  `online_since` datetime DEFAULT NULL,
  `login_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `kyc_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 verified,2 rejected',
  `active_status` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_delivery_partners_tenant_id` (`tenant_id`),
  KEY `idx_delivery_partners_location_id` (`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_partners`
--

LOCK TABLES `delivery_partners` WRITE;
/*!40000 ALTER TABLE `delivery_partners` DISABLE KEYS */;
INSERT INTO `delivery_partners` VALUES (9001,1,'Ravi Kumar','9840721536','123456','12 Anna Salai, Villivakkam, Chennai 600049',9001,'Zone 4','evenings','13.0930','80.2130','••••••••7781',NULL,'TN0920190001234',NULL,'ABCDE1234F','bike','TN 09 BX 4412','30012347782','SBIN0001234',NULL,4.80,1,'2026-09-18 11:11:14',0,1,1,'2026-09-18 14:41:14',0),(9002,1,'Karthik R.','9840700002','123456','4 Kamaraj Street, Anna Nagar, Chennai 600040',9001,'Zone 4','mornings','13.0840','80.2110','••••••••1180',NULL,'TN0220180004455',NULL,'FGHIJ5678K','bike','TN 02 AK 1180','30012341180','SBIN0001234',NULL,4.70,1,'2026-09-18 13:11:14',0,1,1,'2026-09-18 14:41:14',0),(9003,1,'Karthik R.','9840700005','123456','4 Kamaraj Street, Anna Nagar, Chennai 600040',9001,'Zone 4','evenings','13.0840','80.2110',NULL,NULL,NULL,NULL,NULL,'bike','TN 02 AK 1180','30012341180','SBIN0001234',NULL,4.70,1,'2026-09-28 12:36:24',0,1,1,'2026-09-28 12:36:24',0);
/*!40000 ALTER TABLE `delivery_partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_slots`
--

DROP TABLE IF EXISTS `delivery_slots`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delivery_slots` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` int(11) NOT NULL,
  `slot_label` varchar(100) DEFAULT NULL COMMENT 'e.g. 9AM-11AM',
  `start_time` time DEFAULT NULL,
  `end_time` time DEFAULT NULL,
  `slot_type` varchar(20) DEFAULT 'delivery' COMMENT 'delivery / pickup',
  `max_orders` int(11) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_delivery_slots_vendor_id` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_slots`
--

LOCK TABLES `delivery_slots` WRITE;
/*!40000 ALTER TABLE `delivery_slots` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_slots` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `delivery_tracking`
--

DROP TABLE IF EXISTS `delivery_tracking`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `delivery_tracking` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `delivery_assignment_id` int(11) NOT NULL,
  `latitude` varchar(50) DEFAULT NULL,
  `longitude` varchar(50) DEFAULT NULL,
  `status_note` varchar(150) DEFAULT NULL,
  `recorded_at` datetime DEFAULT current_timestamp(),
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_delivery_tracking_delivery_assignment_id` (`delivery_assignment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `delivery_tracking`
--

LOCK TABLES `delivery_tracking` WRITE;
/*!40000 ALTER TABLE `delivery_tracking` DISABLE KEYS */;
/*!40000 ALTER TABLE `delivery_tracking` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dev_support_tickets`
--

DROP TABLE IF EXISTS `dev_support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dev_support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `raised_by` varchar(150) DEFAULT NULL,
  `subject` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `priority` varchar(20) DEFAULT 'medium' COMMENT 'low / medium / high / critical',
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 open,1 in-progress,2 resolved,3 closed',
  `resolved_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dev_support_tickets`
--

LOCK TABLES `dev_support_tickets` WRITE;
/*!40000 ALTER TABLE `dev_support_tickets` DISABLE KEYS */;
/*!40000 ALTER TABLE `dev_support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `dispute_evidence`
--

DROP TABLE IF EXISTS `dispute_evidence`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `dispute_evidence` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `dispute_id` int(11) NOT NULL,
  `evidence_type` varchar(20) DEFAULT 'image' COMMENT 'image / document / video',
  `file_path` longtext DEFAULT NULL,
  `uploaded_by_type` varchar(20) DEFAULT NULL,
  `uploaded_by_id` int(11) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_dispute_evidence_dispute_id` (`dispute_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `dispute_evidence`
--

LOCK TABLES `dispute_evidence` WRITE;
/*!40000 ALTER TABLE `dispute_evidence` DISABLE KEYS */;
/*!40000 ALTER TABLE `dispute_evidence` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `disputes`
--

DROP TABLE IF EXISTS `disputes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `disputes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `raised_by_type` varchar(20) DEFAULT NULL COMMENT 'customer / vendor',
  `raised_by_id` int(11) DEFAULT NULL,
  `dispute_reason` varchar(255) DEFAULT NULL,
  `dispute_amount` decimal(10,2) DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 open,1 under_review,2 resolved,3 rejected',
  `resolution_notes` text DEFAULT NULL,
  `resolved_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_disputes_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `disputes`
--

LOCK TABLES `disputes` WRITE;
/*!40000 ALTER TABLE `disputes` DISABLE KEYS */;
/*!40000 ALTER TABLE `disputes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `features`
--

DROP TABLE IF EXISTS `features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `feature_name` varchar(150) NOT NULL,
  `feature_key` varchar(100) DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `features`
--

LOCK TABLES `features` WRITE;
/*!40000 ALTER TABLE `features` DISABLE KEYS */;
/*!40000 ALTER TABLE `features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `integration_settings`
--

DROP TABLE IF EXISTS `integration_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `integration_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `integration_name` varchar(100) DEFAULT NULL COMMENT 'google_maps / firebase / whatsapp',
  `config_json` longtext DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_integration_settings_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `integration_settings`
--

LOCK TABLES `integration_settings` WRITE;
/*!40000 ALTER TABLE `integration_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `integration_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `invoices`
--

DROP TABLE IF EXISTS `invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `billing_transaction_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_date` date DEFAULT NULL,
  `total_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `pdf_path` longtext DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_invoices_billing_transaction_id` (`billing_transaction_id`),
  KEY `idx_invoices_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `invoices`
--

LOCK TABLES `invoices` WRITE;
/*!40000 ALTER TABLE `invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `locations`
--

DROP TABLE IF EXISTS `locations`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_locations_tenant_id` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9005 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `locations`
--

LOCK TABLES `locations` WRITE;
/*!40000 ALTER TABLE `locations` DISABLE KEYS */;
INSERT INTO `locations` VALUES (9001,1,'Chennai','Anna Nagar','600040','Tamil Nadu','India','13.0850','80.2101',NULL,8.00,1,'2026-09-18 14:41:14',0),(9002,1,'Chennai','Shenoy Nagar','600030','Tamil Nadu','India','13.0785','80.2210',NULL,8.00,1,'2026-09-18 14:41:14',0),(9003,1,'Chennai','Koyambedu','600107','Tamil Nadu','India','13.0694','80.1948',NULL,8.00,1,'2026-09-18 14:41:14',0),(9004,1,'Rajahmundry','Rajahmundry','533101','Andhra Pradesh','India','17.0005','81.8040',NULL,15.00,1,'2026-10-06 15:48:52',0);
/*!40000 ALTER TABLE `locations` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `measurement_units`
--

DROP TABLE IF EXISTS `measurement_units`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `measurement_units` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `unit_name` varchar(50) NOT NULL COMMENT 'kg / litre / piece / gram / ml',
  `unit_symbol` varchar(10) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=9006 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `measurement_units`
--

LOCK TABLES `measurement_units` WRITE;
/*!40000 ALTER TABLE `measurement_units` DISABLE KEYS */;
INSERT INTO `measurement_units` VALUES (9001,'plate','plate',1),(9002,'piece','pc',1),(9003,'gram','g',1),(9004,'kilogram','kg',1),(9005,'litre','L',1);
/*!40000 ALTER TABLE `measurement_units` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `membership_transactions`
--

DROP TABLE IF EXISTS `membership_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `membership_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_membership_id` int(11) NOT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_reference` varchar(150) DEFAULT NULL,
  `payment_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 success,2 failed',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_membership_transactions_customer_membership_id` (`customer_membership_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `membership_transactions`
--

LOCK TABLES `membership_transactions` WRITE;
/*!40000 ALTER TABLE `membership_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `membership_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_preferences`
--

DROP TABLE IF EXISTS `notification_preferences`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_preferences` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ref_type` varchar(20) NOT NULL COMMENT 'customer / vendor',
  `ref_id` int(11) NOT NULL,
  `push_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `sms_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `email_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `alert_sound` varchar(30) DEFAULT NULL COMMENT 'new-order / new-request sound',
  `language` varchar(20) DEFAULT NULL COMMENT 'app language',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_notification_preferences_ref_type` (`ref_type`),
  KEY `idx_notification_preferences_ref_id` (`ref_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_preferences`
--

LOCK TABLES `notification_preferences` WRITE;
/*!40000 ALTER TABLE `notification_preferences` DISABLE KEYS */;
INSERT INTO `notification_preferences` VALUES (1,'vendor',9001,1,1,1,'Loud bell','English','2026-09-18 14:44:32',0),(2,'delivery_partner',9002,1,1,1,NULL,NULL,'2026-09-26 14:13:56',0);
/*!40000 ALTER TABLE `notification_preferences` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_settings`
--

DROP TABLE IF EXISTS `notification_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `push_provider` varchar(50) DEFAULT NULL,
  `push_api_key` varchar(255) DEFAULT NULL,
  `sms_provider` varchar(50) DEFAULT NULL,
  `sms_api_key` varchar(255) DEFAULT NULL,
  `email_provider` varchar(50) DEFAULT NULL,
  `email_api_key` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_notification_settings_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_settings`
--

LOCK TABLES `notification_settings` WRITE;
/*!40000 ALTER TABLE `notification_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notification_templates`
--

DROP TABLE IF EXISTS `notification_templates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notification_templates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `template_key` varchar(100) DEFAULT NULL COMMENT 'order_placed / order_delivered / otp ...',
  `title_template` varchar(255) DEFAULT NULL,
  `body_template` text DEFAULT NULL,
  `channel` varchar(20) DEFAULT 'push' COMMENT 'push / sms / email',
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_notification_templates_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notification_templates`
--

LOCK TABLES `notification_templates` WRITE;
/*!40000 ALTER TABLE `notification_templates` DISABLE KEYS */;
/*!40000 ALTER TABLE `notification_templates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notifications`
--

DROP TABLE IF EXISTS `notifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `notifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `target_type` varchar(20) DEFAULT 'customer' COMMENT 'customer / vendor / delivery_partner / all',
  `target_id` int(11) DEFAULT NULL COMMENT 'NULL when broadcast to all',
  `title` varchar(255) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `notification_type` varchar(50) DEFAULT NULL COMMENT 'order / promo / system',
  `is_read` tinyint(1) NOT NULL DEFAULT 0,
  `sent_at` datetime DEFAULT current_timestamp(),
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_notifications_tenant_id` (`tenant_id`),
  KEY `idx_notifications_target_type` (`target_type`),
  KEY `idx_notifications_target_id` (`target_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9040 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notifications`
--

LOCK TABLES `notifications` WRITE;
/*!40000 ALTER TABLE `notifications` DISABLE KEYS */;
INSERT INTO `notifications` VALUES (9001,1,'vendor',9001,'New order #VK-2841','3 items · ₹640 · Prepaid. Accept within 3:00.','order',1,'2026-09-18 14:40:33','2026-09-18 14:41:15',0),(9002,1,'vendor',9001,'Partner at your counter','Karthik R. is waiting for #VK-2836. Handover code 5192.','order',1,'2026-09-18 14:40:15','2026-09-18 14:41:15',0),(9003,1,'vendor',9001,'Settlement paid','₹41,260 credited · UTR 429188341.','system',1,'2026-09-11 14:41:15','2026-09-18 14:41:15',0),(9004,1,'vendor',9001,'Weekend dinner boost','Stores running DINNER20 saw 18% more orders last weekend.','promo',1,'2026-09-17 14:41:15','2026-09-18 14:41:15',0),(9011,1,'delivery_partner',9001,'2 requests nearby','Amma\'s Kitchen and Sri Balaji Stores have orders ready.','order',0,'2026-09-18 14:40:15','2026-09-18 14:41:15',0),(9012,1,'delivery_partner',9001,'Payout scheduled','Last week\'s earnings reach SBI ••7782 on Tuesday.','system',0,'2026-09-18 09:41:15','2026-09-18 14:41:15',0),(9013,1,'delivery_partner',9001,'Dinner peak bonus is live','Finish 5 trips before 10 PM for +₹120.','promo',1,'2026-09-18 11:41:15','2026-09-18 14:41:15',0),(9018,1,'vendor',9001,'New order #VK-2841','3 items · ₹640 · Prepaid','order',1,'2026-09-18 16:36:22','2026-09-18 16:36:22',0),(9019,1,'vendor',9001,'New order #VK-2840','3 items · ₹760 · Prepaid','order',1,'2026-09-18 16:36:22','2026-09-18 16:36:22',0),(9020,1,'vendor',9002,'New order #VK-2850','2 items · ₹417 · Cash on delivery','order',0,'2026-09-18 16:36:22','2026-09-18 16:36:22',0),(9021,1,'delivery_partner',9002,'New request · Amma\'s Kitchen','#VK-2841 · 3.4 km drop','order',1,'2026-09-19 15:16:16','2026-09-19 15:16:16',0),(9022,1,'delivery_partner',9001,'New request · Amma\'s Kitchen','#VK-2841 · 3.4 km drop','order',0,'2026-09-19 15:16:16','2026-09-19 15:16:16',0),(9023,1,'delivery_partner',9002,'New request · Amma\'s Kitchen','#VK-2840 · 3.2 km drop','order',1,'2026-09-25 15:51:35','2026-09-25 15:51:35',0),(9024,1,'delivery_partner',9001,'New request · Amma\'s Kitchen','#VK-2840 · 3.2 km drop','order',0,'2026-09-25 15:51:35','2026-09-25 15:51:35',0),(9025,1,'delivery_partner',9002,'New request · Amma\'s Kitchen','#VK-2835 · 0.2 km drop','order',0,'2026-09-28 09:58:26','2026-09-28 09:58:26',0),(9026,1,'delivery_partner',9001,'New request · Amma\'s Kitchen','#VK-2835 · 0.2 km drop','order',0,'2026-09-28 09:58:26','2026-09-28 09:58:26',0),(9027,1,'delivery_partner',9002,'New request · Amma\'s Kitchen','#VK-2839 · 1.9 km drop','order',0,'2026-09-29 12:49:11','2026-09-29 12:49:11',0),(9028,1,'delivery_partner',9003,'New request · Amma\'s Kitchen','#VK-2839 · 1.9 km drop','order',0,'2026-09-29 12:49:11','2026-09-29 12:49:11',0),(9029,1,'delivery_partner',9001,'New request · Amma\'s Kitchen','#VK-2839 · 1.9 km drop','order',0,'2026-09-29 12:49:11','2026-09-29 12:49:11',0),(9030,1,'vendor',9001,'New order #GWT-MURXLX2J','1 item · ₹220 · Cash on delivery','order',0,'2026-10-03 10:38:40','2026-10-03 10:38:40',0),(9031,1,'vendor',9001,'New order #GWT-MURXOUXD','1 item · ₹220 · Cash on delivery','order',0,'2026-10-03 10:40:56','2026-10-03 10:40:56',0),(9032,1,'vendor',9001,'New order #GWT-MURXR2Z9','2 items · ₹740 · Cash on delivery','order',0,'2026-10-03 10:42:41','2026-10-03 10:42:41',0),(9033,1,'vendor',9001,'New order #GWT-MURZGHTL','1 item · ₹220 · Cash on delivery','order',0,'2026-10-03 11:30:26','2026-10-03 11:30:26',0),(9034,1,'vendor',9001,'New order #GWT-MURZLVTZ','1 item · ₹220 · Cash on delivery','order',0,'2026-10-03 11:34:37','2026-10-03 11:34:37',0),(9035,1,'vendor',9001,'New order #GWT-MURZTB5Z','1 item · ₹220 · Cash on delivery','order',0,'2026-10-03 11:40:22','2026-10-03 11:40:22',0),(9036,1,'vendor',9001,'New order #GWT-MUS0LT8P','1 item · ₹520 · Cash on delivery','order',0,'2026-10-03 12:02:34','2026-10-03 12:02:34',0),(9037,1,'vendor',9004,'New order #GWT-MUS12B96','1 item · ₹820 · Cash on delivery','order',0,'2026-10-03 12:15:22','2026-10-03 12:15:22',0),(9038,1,'vendor',9004,'New order #GWT-MUSBMJYM','1 item · ₹850 · Cash on delivery','order',0,'2026-10-03 17:11:05','2026-10-03 17:11:05',0),(9039,1,'vendor',9006,'New order #GWT-MUWCQ5TS','1 item · ₹220 · Cash on delivery','order',0,'2026-10-06 12:52:55','2026-10-06 12:52:55',0);
/*!40000 ALTER TABLE `notifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `offers`
--

DROP TABLE IF EXISTS `offers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `offers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `title` varchar(255) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `offer_image` longtext DEFAULT NULL,
  `valid_from` datetime DEFAULT NULL,
  `valid_upto` datetime DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_offers_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `offers`
--

LOCK TABLES `offers` WRITE;
/*!40000 ALTER TABLE `offers` DISABLE KEYS */;
/*!40000 ALTER TABLE `offers` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_item_options`
--

DROP TABLE IF EXISTS `order_item_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_item_options` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_item_id` int(11) NOT NULL,
  `product_addon_id` int(11) NOT NULL,
  `addon_name_snapshot` varchar(150) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `addon_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_order_item_options_order_item_id` (`order_item_id`),
  KEY `idx_order_item_options_product_addon_id` (`product_addon_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9003 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_item_options`
--

LOCK TABLES `order_item_options` WRITE;
/*!40000 ALTER TABLE `order_item_options` DISABLE KEYS */;
INSERT INTO `order_item_options` VALUES (9001,9001,9001,'Extra raita',1,20.00,'2026-09-18 14:41:14',0),(9002,9012,9001,'Extra raita',1,20.00,'2026-09-18 14:41:14',0);
/*!40000 ALTER TABLE `order_item_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_items`
--

DROP TABLE IF EXISTS `order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `product_variant_id` int(11) NOT NULL,
  `product_name_snapshot` varchar(255) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `unit_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `total_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_order_items_order_id` (`order_id`),
  KEY `idx_order_items_product_variant_id` (`product_variant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9532 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_items`
--

LOCK TABLES `order_items` WRITE;
/*!40000 ALTER TABLE `order_items` DISABLE KEYS */;
INSERT INTO `order_items` VALUES (9001,9001,9002,'Chicken Biryani',2,220.00,440.00,'2026-09-18 14:41:14',0),(9002,9001,9009,'Ennai Kathirikai',1,140.00,140.00,'2026-09-18 14:41:14',0),(9003,9002,9012,'Mutton Biryani',1,520.00,520.00,'2026-09-18 14:41:14',0),(9004,9002,9008,'Bread Halwa',2,90.00,180.00,'2026-09-18 14:41:14',0),(9005,9003,9013,'Veg Fried Rice',2,150.00,300.00,'2026-09-18 14:41:14',0),(9006,9003,9014,'Gobi 65',1,110.00,110.00,'2026-09-18 14:41:14',0),(9007,9004,9001,'Chicken Biryani',2,160.00,320.00,'2026-09-18 14:41:14',0),(9008,9005,9007,'Parotta',1,95.00,95.00,'2026-09-18 14:41:14',0),(9009,9005,9003,'Paneer Butter Masala',1,210.00,210.00,'2026-09-18 14:41:14',0),(9010,9006,9002,'Chicken Biryani',1,220.00,220.00,'2026-09-18 14:41:14',0),(9011,9006,9006,'Parotta',1,40.00,40.00,'2026-09-18 14:41:14',0),(9012,9007,9002,'Chicken Biryani',2,220.00,440.00,'2026-09-18 14:41:14',0),(9013,9007,9009,'Ennai Kathirikai',1,140.00,140.00,'2026-09-18 14:41:14',0),(9014,9008,9002,'Chicken Biryani',2,220.00,440.00,'2026-09-18 14:41:14',0),(9015,9008,9009,'Ennai Kathirikai',1,140.00,140.00,'2026-09-18 14:41:14',0),(9016,9009,9002,'Chicken Biryani',3,220.00,660.00,'2026-09-18 14:41:14',0),(9017,9009,9008,'Bread Halwa',2,90.00,180.00,'2026-09-18 14:41:14',0),(9018,9010,9004,'Mutton Chukka',2,320.00,640.00,'2026-09-18 14:41:14',0),(9019,9010,9006,'Parotta',1,40.00,40.00,'2026-09-18 14:41:14',0),(9020,9011,9001,'Chicken Biryani',2,160.00,320.00,'2026-09-18 14:41:14',0),(9021,9012,9001,'Chicken Biryani',1,160.00,160.00,'2026-09-18 14:41:14',0),(9031,9021,9022,'Aachi Sambar Powder',2,72.00,144.00,'2026-09-18 14:41:14',0),(9032,9021,9025,'Ponni Raw Rice',1,660.00,660.00,'2026-09-18 14:41:14',0),(9033,9022,9021,'Aachi Sambar Powder',1,38.00,38.00,'2026-09-18 14:41:14',0),(9034,9022,9024,'Ponni Raw Rice',1,340.00,340.00,'2026-09-18 14:41:14',0),(9035,9023,9024,'Ponni Raw Rice',1,340.00,340.00,'2026-09-18 14:41:14',0),(9036,9023,9022,'Aachi Sambar Powder',1,72.00,72.00,'2026-09-18 14:41:14',0),(9401,9101,9002,'Chicken Biryani',2,160.00,320.00,'2026-09-18 14:41:15',0),(9402,9102,9002,'Chicken Biryani',2,180.00,360.00,'2026-09-18 14:41:15',0),(9403,9103,9024,'Ponni Raw Rice',2,200.00,400.00,'2026-09-18 14:41:15',0),(9404,9104,9002,'Chicken Biryani',2,220.00,440.00,'2026-09-18 14:41:15',0),(9405,9105,9002,'Chicken Biryani',2,240.00,480.00,'2026-09-18 14:41:15',0),(9406,9106,9024,'Ponni Raw Rice',2,260.00,520.00,'2026-09-18 14:41:15',0),(9407,9107,9002,'Chicken Biryani',2,140.00,280.00,'2026-09-18 14:41:15',0),(9408,9108,9002,'Chicken Biryani',2,160.00,320.00,'2026-09-18 14:41:15',0),(9409,9109,9024,'Ponni Raw Rice',2,180.00,360.00,'2026-09-18 14:41:15',0),(9410,9110,9002,'Chicken Biryani',2,200.00,400.00,'2026-09-18 14:41:15',0),(9411,9111,9002,'Chicken Biryani',2,220.00,440.00,'2026-09-18 14:41:15',0),(9412,9112,9024,'Ponni Raw Rice',2,240.00,480.00,'2026-09-18 14:41:15',0),(9413,9113,9002,'Chicken Biryani',2,260.00,520.00,'2026-09-18 14:41:15',0),(9414,9114,9002,'Chicken Biryani',2,140.00,280.00,'2026-09-18 14:41:15',0),(9415,9115,9024,'Ponni Raw Rice',2,160.00,320.00,'2026-09-18 14:41:15',0),(9416,9116,9002,'Chicken Biryani',2,180.00,360.00,'2026-09-18 14:41:15',0),(9417,9117,9002,'Chicken Biryani',2,200.00,400.00,'2026-09-18 14:41:15',0),(9418,9118,9024,'Ponni Raw Rice',2,220.00,440.00,'2026-09-18 14:41:15',0),(9419,9119,9002,'Chicken Biryani',2,240.00,480.00,'2026-09-18 14:41:15',0),(9420,9120,9002,'Chicken Biryani',2,260.00,520.00,'2026-09-18 14:41:15',0),(9421,9121,9024,'Ponni Raw Rice',2,140.00,280.00,'2026-09-18 14:41:15',0),(9422,9122,9002,'Chicken Biryani',2,160.00,320.00,'2026-09-18 14:41:15',0),(9423,9123,9002,'Chicken Biryani',2,180.00,360.00,'2026-09-18 14:41:15',0),(9424,9124,9024,'Ponni Raw Rice',2,200.00,400.00,'2026-09-18 14:41:15',0),(9425,9125,9002,'Chicken Biryani',2,220.00,440.00,'2026-09-18 14:41:15',0),(9426,9126,9002,'Chicken Biryani',2,240.00,480.00,'2026-09-18 14:41:15',0),(9427,9127,9024,'Ponni Raw Rice',2,260.00,520.00,'2026-09-18 14:41:15',0),(9428,9128,9002,'Chicken Biryani',2,140.00,280.00,'2026-09-18 14:41:15',0),(9429,9129,9002,'Chicken Biryani',2,160.00,320.00,'2026-09-18 14:41:15',0),(9430,9130,9024,'Ponni Raw Rice',2,180.00,360.00,'2026-09-18 14:41:15',0),(9501,9201,9002,'Chicken Biryani',2,180.00,360.00,'2026-09-18 14:41:15',0),(9502,9202,9002,'Chicken Biryani',2,210.00,420.00,'2026-09-18 14:41:15',0),(9503,9203,9002,'Chicken Biryani',2,240.00,480.00,'2026-09-18 14:41:15',0),(9504,9204,9002,'Chicken Biryani',2,270.00,540.00,'2026-09-18 14:41:15',0),(9505,9205,9002,'Chicken Biryani',2,150.00,300.00,'2026-09-18 14:41:15',0),(9506,9206,9002,'Chicken Biryani',2,180.00,360.00,'2026-09-18 14:41:15',0),(9507,9207,9002,'Chicken Biryani',2,210.00,420.00,'2026-09-18 14:41:15',0),(9508,9208,9002,'Chicken Biryani',2,240.00,480.00,'2026-09-18 14:41:15',0),(9509,9209,9002,'Chicken Biryani',2,270.00,540.00,'2026-09-18 14:41:15',0),(9510,9210,9002,'Chicken Biryani',2,150.00,300.00,'2026-09-18 14:41:15',0),(9511,9211,9002,'Chicken Biryani',2,180.00,360.00,'2026-09-18 14:41:15',0),(9512,9212,9002,'Chicken Biryani',2,210.00,420.00,'2026-09-18 14:41:15',0),(9513,9213,9002,'Chicken Biryani',2,240.00,480.00,'2026-09-18 14:41:15',0),(9514,9214,9002,'Chicken Biryani',2,270.00,540.00,'2026-09-18 14:41:15',0),(9515,9215,9002,'Chicken Biryani',2,150.00,300.00,'2026-09-18 14:41:15',0),(9516,9216,9002,'Chicken Biryani',2,180.00,360.00,'2026-09-18 14:41:15',0),(9517,9217,9002,'Chicken Biryani',2,210.00,420.00,'2026-09-18 14:41:15',0),(9518,9218,9002,'Chicken Biryani',2,240.00,480.00,'2026-09-18 14:41:15',0),(9519,9219,9002,'Chicken Biryani',2,270.00,540.00,'2026-09-18 14:41:15',0),(9520,9220,9002,'Chicken Biryani',2,150.00,300.00,'2026-09-18 14:41:15',0),(9521,9221,9002,'Chicken Biryani',1,220.00,220.00,'2026-10-03 10:38:36',0),(9522,9222,9002,'Chicken Biryani',1,220.00,220.00,'2026-10-03 10:40:54',0),(9523,9223,9002,'Chicken Biryani',1,220.00,220.00,'2026-10-03 10:42:37',0),(9524,9223,9012,'Mutton Biryani',1,520.00,520.00,'2026-10-03 10:42:37',0),(9525,9224,9002,'Chicken Biryani',1,220.00,220.00,'2026-10-03 11:30:23',0),(9526,9225,9002,'Chicken Biryani',1,220.00,220.00,'2026-10-03 11:34:34',0),(9527,9226,9002,'Chicken Biryani',1,220.00,220.00,'2026-10-03 11:40:21',0),(9528,9227,9012,'Mutton Biryani',1,520.00,520.00,'2026-10-03 12:02:30',0),(9529,9228,9033,'Butterscotch Cake',1,820.00,820.00,'2026-10-03 12:15:20',0),(9530,9229,9033,'Butterscotch Cake',1,820.00,820.00,'2026-10-03 17:11:01',0),(9531,9230,9035,'Paneer Butter Masala',1,220.00,220.00,'2026-10-06 12:52:53',0);
/*!40000 ALTER TABLE `order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_status_history`
--

DROP TABLE IF EXISTS `order_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `old_status` int(11) DEFAULT NULL,
  `new_status` int(11) DEFAULT NULL,
  `changed_by_type` varchar(30) DEFAULT NULL COMMENT 'customer / vendor / delivery_partner / admin / system',
  `changed_by_id` int(11) DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_order_status_history_order_id` (`order_id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_status_history`
--

LOCK TABLES `order_status_history` WRITE;
/*!40000 ALTER TABLE `order_status_history` DISABLE KEYS */;
INSERT INTO `order_status_history` VALUES (7,9001,0,2,'vendor',9001,'Accepted · 15 min','2026-09-19 15:16:16',0),(8,9001,2,7,'vendor',9001,'Marked ready','2026-09-19 16:12:54',0),(9,9002,0,2,'vendor',9001,'Accepted · 15 min','2026-09-25 15:51:35',0),(10,9005,2,7,'vendor',9001,'Marked ready','2026-09-28 09:58:26',0),(11,9003,2,7,'vendor',9001,'Marked ready','2026-09-29 12:49:11',0),(12,9002,2,7,'vendor',9001,'Marked ready','2026-09-29 12:50:03',0);
/*!40000 ALTER TABLE `order_status_history` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `order_taxes`
--

DROP TABLE IF EXISTS `order_taxes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `order_taxes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `tax_rate_id` int(11) NOT NULL,
  `taxable_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_order_taxes_order_id` (`order_id`),
  KEY `idx_order_taxes_tax_rate_id` (`tax_rate_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `order_taxes`
--

LOCK TABLES `order_taxes` WRITE;
/*!40000 ALTER TABLE `order_taxes` DISABLE KEYS */;
/*!40000 ALTER TABLE `order_taxes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `orders` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_number` varchar(50) DEFAULT NULL,
  `customer_id` int(11) NOT NULL,
  `vendor_id` int(11) NOT NULL,
  `delivery_slot_id` int(11) DEFAULT NULL,
  `customer_address_id` int(11) DEFAULT NULL,
  `item_count` int(11) NOT NULL DEFAULT 0,
  `parcel_count` int(11) NOT NULL DEFAULT 1,
  `sub_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `coupon_code` varchar(50) DEFAULT NULL,
  `tax_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `packing_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `delivery_charges` decimal(10,2) NOT NULL DEFAULT 0.00,
  `tip_amount` decimal(10,2) NOT NULL DEFAULT 0.00 COMMENT 'goes to the delivery partner',
  `grand_total` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payment_type` varchar(30) DEFAULT NULL COMMENT 'cod / online / wallet',
  `order_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 placed,1 accepted,2 preparing,3 out_for_delivery,4 delivered,5 cancelled,6 rejected,7 ready',
  `order_instructions` text DEFAULT NULL,
  `prep_minutes` int(11) DEFAULT NULL COMMENT 'prep time promised by the vendor on accept',
  `handover_code` varchar(6) DEFAULT NULL COMMENT 'vendor reads it out, partner enters it at pickup',
  `delivery_otp` varchar(6) DEFAULT NULL COMMENT 'customer shares it with the partner at drop',
  `order_date_time` datetime DEFAULT current_timestamp(),
  `vendor_notified_at` datetime DEFAULT NULL COMMENT 'new-order push sent to the vendor',
  `accepted_at` datetime DEFAULT NULL,
  `ready_at` datetime DEFAULT NULL,
  `picked_up_at` datetime DEFAULT NULL,
  `delivered_at` datetime DEFAULT NULL,
  `cancelled_at` datetime DEFAULT NULL,
  `cancellation_reason` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  `address_snapshot` longtext DEFAULT NULL,
  `bill_snapshot` longtext DEFAULT NULL,
  `instruction_snapshot` longtext DEFAULT NULL,
  `scheduled_for` datetime DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_orders_customer_id` (`customer_id`),
  KEY `idx_orders_vendor_id` (`vendor_id`),
  KEY `idx_orders_delivery_slot_id` (`delivery_slot_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9231 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (9222,'GWT-MURXOUXD',9010,9001,NULL,9016,1,1,220.00,0.00,NULL,0.00,0.00,0.00,0.00,220.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-03 10:40:54','2026-10-03 10:40:56',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-03 10:40:54',0,NULL,NULL,NULL,NULL),(9223,'GWT-MURXR2Z9',9007,9001,NULL,9017,2,1,740.00,0.00,NULL,0.00,0.00,0.00,0.00,740.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-03 10:42:37','2026-10-03 10:42:41',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-03 10:42:37',0,NULL,NULL,NULL,NULL),(9224,'GWT-MURZGHTL',9012,9001,NULL,9020,1,1,220.00,0.00,NULL,0.00,0.00,0.00,0.00,220.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-03 11:30:23','2026-10-03 11:30:26',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-03 11:30:23',0,NULL,NULL,NULL,NULL),(9225,'GWT-MURZLVTZ',9013,9001,NULL,9021,1,1,220.00,0.00,NULL,0.00,0.00,0.00,0.00,220.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-03 11:34:34','2026-10-03 11:34:37',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-03 11:34:34',0,NULL,NULL,NULL,NULL),(9226,'GWT-MURZTB5Z',9013,9001,NULL,9021,1,1,220.00,0.00,NULL,0.00,0.00,0.00,0.00,220.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-03 11:40:21','2026-10-03 11:40:22',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-03 11:40:21',0,NULL,NULL,NULL,NULL),(9227,'GWT-MUS0LT8P',9013,9001,NULL,9021,1,1,520.00,0.00,NULL,0.00,0.00,0.00,0.00,520.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-03 12:02:30','2026-10-03 12:02:34',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-03 12:02:30',0,NULL,NULL,NULL,NULL),(9228,'GWT-MUS12B96',9013,9004,NULL,9021,1,1,820.00,0.00,NULL,0.00,0.00,0.00,0.00,820.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-03 12:15:20','2026-10-03 12:15:22',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-03 12:15:20',0,NULL,NULL,NULL,NULL),(9229,'GWT-MUSBMJYM',9013,9004,NULL,9021,1,1,820.00,0.00,NULL,0.00,0.00,0.00,30.00,850.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-03 17:11:01','2026-10-03 17:11:05',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-03 17:11:01',0,NULL,NULL,NULL,NULL),(9230,'GWT-MUWCQ5TS',9015,9006,NULL,9023,1,1,220.00,0.00,NULL,0.00,0.00,0.00,0.00,220.00,'cod',0,NULL,NULL,NULL,NULL,'2026-10-06 12:52:53','2026-10-06 12:52:55',NULL,NULL,NULL,NULL,NULL,NULL,'2026-10-06 12:52:53',0,'{\"label\":\"home\",\"line\":\"Shenoy Nagar, Chennai\",\"landmark\":\"gxcgg\",\"pincode\":\"600030\",\"locationId\":\"9002\",\"name\":\"t es t\",\"phone\":\"8686688856888\"}','{\"subtotal\":220,\"discount\":0,\"handlingCharge\":0,\"packingCharge\":0,\"donationCharge\":0,\"rainSurgeCharge\":0,\"tip\":0,\"total\":220}',NULL,NULL);
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `otp_verifications`
--

DROP TABLE IF EXISTS `otp_verifications`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `otp_verifications` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ref_type` varchar(20) NOT NULL COMMENT 'customer / vendor / delivery_partner / admin',
  `ref_id` int(11) NOT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `otp_code` varchar(10) DEFAULT NULL,
  `purpose` varchar(50) DEFAULT 'login' COMMENT 'login / checkout / payout / password_reset',
  `verify_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 verified,2 expired',
  `expires_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_otp_verifications_ref_type` (`ref_type`),
  KEY `idx_otp_verifications_ref_id` (`ref_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `otp_verifications`
--

LOCK TABLES `otp_verifications` WRITE;
/*!40000 ALTER TABLE `otp_verifications` DISABLE KEYS */;
INSERT INTO `otp_verifications` VALUES (1,'vendor',9001,'9840721536','115296','login',0,'2026-09-29 12:38:08','2026-09-29 12:33:08',0);
/*!40000 ALTER TABLE `otp_verifications` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_account_requests`
--

DROP TABLE IF EXISTS `partner_account_requests`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_account_requests` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ref_type` varchar(20) NOT NULL,
  `ref_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `request_type` varchar(30) NOT NULL,
  `reference` varchar(30) DEFAULT NULL,
  `reason` text DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0,
  `handled_at` datetime DEFAULT NULL,
  `handled_note` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  KEY `partner_account_requests_ref` (`ref_type`,`ref_id`,`d_in`),
  KEY `partner_account_requests_open` (`request_type`,`status`,`d_in`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_account_requests`
--

LOCK TABLES `partner_account_requests` WRITE;
/*!40000 ALTER TABLE `partner_account_requests` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_account_requests` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_app_devices`
--

DROP TABLE IF EXISTS `partner_app_devices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_app_devices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `ref_type` varchar(20) NOT NULL COMMENT 'vendor / delivery_partner',
  `ref_id` int(11) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `fcm_token` varchar(255) NOT NULL,
  `device_type` varchar(20) NOT NULL DEFAULT 'android' COMMENT 'android / ios',
  `app_version` varchar(50) DEFAULT NULL,
  `last_active_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_partner_device_token` (`fcm_token`),
  KEY `ix_partner_device_owner` (`ref_type`,`ref_id`,`d_in`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_app_devices`
--

LOCK TABLES `partner_app_devices` WRITE;
/*!40000 ALTER TABLE `partner_app_devices` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_app_devices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_main_module`
--

DROP TABLE IF EXISTS `partner_main_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_main_module` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_name` varchar(150) NOT NULL,
  `module_icon` varchar(150) DEFAULT NULL,
  `module_path` varchar(255) DEFAULT NULL,
  `module_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_main_module`
--

LOCK TABLES `partner_main_module` WRITE;
/*!40000 ALTER TABLE `partner_main_module` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_main_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_sub_module`
--

DROP TABLE IF EXISTS `partner_sub_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_sub_module` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partner_main_module_id` int(11) NOT NULL,
  `sub_module_name` varchar(150) NOT NULL,
  `route_path` varchar(255) DEFAULT NULL,
  `sub_module_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_partner_sub_module_partner_main_module_id` (`partner_main_module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_sub_module`
--

LOCK TABLES `partner_sub_module` WRITE;
/*!40000 ALTER TABLE `partner_sub_module` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_sub_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_user_permissions`
--

DROP TABLE IF EXISTS `partner_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `partner_user_id` int(11) NOT NULL,
  `partner_main_module_id` int(11) DEFAULT NULL,
  `partner_sub_module_id` int(11) DEFAULT NULL,
  `can_view` tinyint(1) DEFAULT 0,
  `can_add` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_partner_user_permissions_partner_user_id` (`partner_user_id`),
  KEY `idx_partner_user_permissions_partner_main_module_id` (`partner_main_module_id`),
  KEY `idx_partner_user_permissions_partner_sub_module_id` (`partner_sub_module_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_user_permissions`
--

LOCK TABLES `partner_user_permissions` WRITE;
/*!40000 ALTER TABLE `partner_user_permissions` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partner_users`
--

DROP TABLE IF EXISTS `partner_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partner_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_partner_users_partner_id` (`partner_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partner_users`
--

LOCK TABLES `partner_users` WRITE;
/*!40000 ALTER TABLE `partner_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `partner_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `partners`
--

DROP TABLE IF EXISTS `partners`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `partners` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `partners`
--

LOCK TABLES `partners` WRITE;
/*!40000 ALTER TABLE `partners` DISABLE KEYS */;
/*!40000 ALTER TABLE `partners` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payment_gateway_settings`
--

DROP TABLE IF EXISTS `payment_gateway_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payment_gateway_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `gateway_name` varchar(50) DEFAULT NULL COMMENT 'razorpay / stripe / paytm',
  `api_key` varchar(255) DEFAULT NULL,
  `api_secret` varchar(255) DEFAULT NULL,
  `webhook_secret` varchar(255) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_payment_gateway_settings_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payment_gateway_settings`
--

LOCK TABLES `payment_gateway_settings` WRITE;
/*!40000 ALTER TABLE `payment_gateway_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `payment_gateway_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `payments`
--

DROP TABLE IF EXISTS `payments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `payments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `payment_gateway` varchar(50) DEFAULT NULL COMMENT 'razorpay / stripe / cod / wallet',
  `gateway_payment_id` varchar(150) DEFAULT NULL,
  `gateway_order_id` varchar(150) DEFAULT NULL,
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `currency` varchar(10) NOT NULL DEFAULT 'INR',
  `payment_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 success,2 failed,3 refunded',
  `paid_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_payments_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `payments`
--

LOCK TABLES `payments` WRITE;
/*!40000 ALTER TABLE `payments` DISABLE KEYS */;
/*!40000 ALTER TABLE `payments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plan_features`
--

DROP TABLE IF EXISTS `plan_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plan_features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `plan_id` int(11) NOT NULL,
  `feature_id` int(11) NOT NULL,
  `feature_limit` varchar(100) DEFAULT NULL COMMENT 'e.g. 50, unlimited',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_plan_features_plan_id` (`plan_id`),
  KEY `idx_plan_features_feature_id` (`feature_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plan_features`
--

LOCK TABLES `plan_features` WRITE;
/*!40000 ALTER TABLE `plan_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `plan_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `plans`
--

DROP TABLE IF EXISTS `plans`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `plans`
--

LOCK TABLES `plans` WRITE;
/*!40000 ALTER TABLE `plans` DISABLE KEYS */;
/*!40000 ALTER TABLE `plans` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `platform_settings`
--

DROP TABLE IF EXISTS `platform_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `platform_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `setting_key` varchar(100) DEFAULT NULL,
  `setting_value` text DEFAULT NULL,
  `description` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `platform_settings`
--

LOCK TABLES `platform_settings` WRITE;
/*!40000 ALTER TABLE `platform_settings` DISABLE KEYS */;
/*!40000 ALTER TABLE `platform_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_addons`
--

DROP TABLE IF EXISTS `product_addons`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_addons` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `addon_name` varchar(150) DEFAULT NULL COMMENT 'e.g. Extra cheese, Toppings',
  `addon_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `max_quantity` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_product_addons_product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9007 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_addons`
--

LOCK TABLES `product_addons` WRITE;
/*!40000 ALTER TABLE `product_addons` DISABLE KEYS */;
INSERT INTO `product_addons` VALUES (9001,9001,'Extra raita',20.00,2,1,'2026-09-18 14:41:14',0),(9002,9001,'Boiled egg',15.00,2,1,'2026-09-18 14:41:14',0),(9003,9002,'Extra butter',25.00,1,1,'2026-09-18 14:41:14',0),(9004,9027,'Extra Ghee',20.00,2,1,'2026-10-01 07:45:13',0),(9005,9028,'Extra Ghee',20.00,2,1,'2026-10-01 07:45:14',0),(9006,9029,'Extra Ghee',20.00,2,1,'2026-10-01 09:25:15',0);
/*!40000 ALTER TABLE `product_addons` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_images`
--

DROP TABLE IF EXISTS `product_images`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_images` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `product_id` int(11) NOT NULL,
  `image_path` longtext DEFAULT NULL,
  `image_data` longblob DEFAULT NULL,
  `image_mime` varchar(50) DEFAULT NULL,
  `image_order` int(11) NOT NULL DEFAULT 0,
  `is_primary` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_product_images_product_id` (`product_id`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_images`
--

LOCK TABLES `product_images` WRITE;
/*!40000 ALTER TABLE `product_images` DISABLE KEYS */;
INSERT INTO `product_images` VALUES (1,9001,'/uploads/partner_app/vendor-9001-mu8dy134-o8tw3bsx.png',NULL,NULL,0,1,'2026-09-19 18:20:05',1),(2,9001,'public_app/products/cat-biryani.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(3,9002,'public_app/products/cat-paneer.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(4,9003,'public_app/products/cat-snacks.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(5,9004,'public_app/products/cat-tiffins.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(6,9005,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(7,9006,'public_app/products/cat-paneer.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(8,9007,'public_app/products/cat-biryani.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(9,9008,'public_app/products/cat-snacks.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(10,9009,'public_app/products/cat-snacks.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(11,9010,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(12,9021,'public_app/products/cat-veg-plate.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(13,9022,'public_app/products/cat-veg-plate.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(14,9023,'public_app/products/cat-veg-plate.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(15,9024,'public_app/products/cat-veg-plate.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(16,9025,'public_app/products/cat-cakes.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(17,9026,'public_app/products/cat-meat-dishes.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(18,9027,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(19,9028,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(20,9029,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:10:22',1),(21,9001,'public_app/products/cat-biryani.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(22,9002,'public_app/products/cat-paneer.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(23,9003,'public_app/products/cat-snacks.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(24,9004,'public_app/products/cat-tiffins.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(25,9005,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(26,9006,'public_app/products/cat-paneer.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(27,9007,'public_app/products/cat-biryani.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(28,9008,'public_app/products/cat-snacks.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(29,9009,'public_app/products/cat-snacks.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(30,9010,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(31,9021,'public_app/products/cat-veg-plate.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(32,9022,'public_app/products/cat-veg-plate.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(33,9023,'public_app/products/cat-veg-plate.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(34,9024,'public_app/products/cat-veg-plate.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(35,9025,'public_app/products/cat-cakes.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(36,9026,'public_app/products/cat-meat-dishes.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(37,9027,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(38,9028,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(39,9029,'public_app/products/cat-sweets.png',NULL,NULL,0,1,'2026-10-02 19:28:03',0),(40,9030,'public_app/products/cat-paneer.png',NULL,NULL,0,1,'2026-10-06 11:31:17',0),(41,9031,'public_app/products/cat-paneer.png',NULL,NULL,0,1,'2026-10-06 11:31:17',0);
/*!40000 ALTER TABLE `product_images` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `product_variants`
--

DROP TABLE IF EXISTS `product_variants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `product_variants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_product_variants_product_id` (`product_id`),
  KEY `idx_product_variants_measurement_unit_id` (`measurement_unit_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9037 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `product_variants`
--

LOCK TABLES `product_variants` WRITE;
/*!40000 ALTER TABLE `product_variants` DISABLE KEYS */;
INSERT INTO `product_variants` VALUES (9001,9001,9001,'Half plate',1.00,160.00,NULL,24,'BIR-CHK-H',0,1,'2026-09-18 14:41:14',0),(9002,9001,9001,'Full plate',1.00,220.00,NULL,24,'BIR-CHK-F',1,1,'2026-09-18 14:41:14',0),(9003,9002,9001,'Regular',1.00,210.00,NULL,30,'CUR-PBM-R',1,1,'2026-09-18 14:41:14',0),(9004,9003,9001,'Regular',1.00,320.00,NULL,0,'DRY-MTN-R',1,1,'2026-09-18 14:41:14',0),(9005,9004,9002,'Pack of 1',1.00,20.00,NULL,140,'BRD-PAR-1',1,1,'2026-09-18 14:41:14',0),(9006,9004,9002,'Pack of 2',2.00,40.00,NULL,140,'BRD-PAR-2',0,1,'2026-09-18 14:41:14',0),(9007,9004,9002,'Pack of 5',5.00,95.00,NULL,140,'BRD-PAR-5',0,1,'2026-09-18 14:41:14',0),(9008,9005,9002,'Cup',1.00,90.00,NULL,40,'SWT-BHL-C',1,1,'2026-09-18 14:41:14',0),(9009,9006,9001,'Half',1.00,140.00,NULL,20,'CUR-ENK-H',1,1,'2026-09-18 14:41:14',0),(9010,9006,9001,'Full',1.00,240.00,NULL,20,'CUR-ENK-F',0,1,'2026-09-18 14:41:14',0),(9011,9007,9001,'Half',1.00,300.00,NULL,15,'BIR-MTN-H',0,1,'2026-09-18 14:41:14',0),(9012,9007,9001,'Full',1.00,520.00,NULL,15,'BIR-MTN-F',1,1,'2026-09-18 14:41:14',0),(9013,9008,9001,'Regular',1.00,150.00,NULL,25,'STR-VFR-R',1,1,'2026-09-18 14:41:14',0),(9014,9009,9001,'Regular',1.00,110.00,NULL,25,'STR-G65-R',1,1,'2026-09-18 14:41:14',0),(9015,9010,9002,'2 pieces',2.00,120.00,NULL,0,'SWT-RML-2',1,1,'2026-09-18 14:41:14',0),(9021,9021,9003,'100 g pouch',100.00,45.00,38.00,146,'AACHI-100',1,1,'2026-09-18 14:41:14',0),(9022,9021,9003,'200 g pouch',200.00,85.00,72.00,88,'AACHI-200',0,1,'2026-09-18 14:41:14',0),(9023,9021,9003,'500 g box',500.00,190.00,165.00,20,'AACHI-500',0,1,'2026-09-18 14:41:14',0),(9024,9022,9004,'5 kg bag',5.00,380.00,340.00,38,'PONNI-5',1,1,'2026-09-18 14:41:14',0),(9025,9022,9004,'10 kg sack',10.00,740.00,660.00,20,'PONNI-10',0,1,'2026-09-18 14:41:14',0),(9026,9023,9005,'1 L pouch',1.00,185.00,168.00,0,'GW-1L',1,1,'2026-09-18 14:41:14',0),(9027,9010,9001,'lsewlw',NULL,31624.00,NULL,20,NULL,0,1,'2026-09-29 12:48:57',0),(9028,9027,9001,'Regular',NULL,50.00,NULL,20,NULL,1,1,'2026-10-01 07:45:13',0),(9029,9028,9001,'Regular',NULL,50.00,NULL,20,NULL,1,1,'2026-10-01 07:45:14',0),(9030,9029,9001,'Regular',NULL,50.00,NULL,20,NULL,1,1,'2026-10-01 09:25:15',0),(9031,9029,9001,'Half(20g)',NULL,25.00,NULL,20,NULL,0,1,'2026-10-01 09:25:15',0),(9032,9024,9002,'Regular',NULL,36.00,NULL,120,NULL,1,1,'2026-10-03 12:07:56',0),(9033,9025,9002,'Regular',NULL,820.00,NULL,12,NULL,1,1,'2026-10-03 12:07:56',0),(9034,9026,9002,'Regular',NULL,520.00,NULL,35,NULL,1,1,'2026-10-03 12:07:56',0),(9035,9030,9002,'Regular',NULL,220.00,NULL,25,NULL,1,1,'2026-10-06 11:31:17',0),(9036,9031,9002,'Regular',NULL,190.00,NULL,25,NULL,1,1,'2026-10-06 11:31:17',0);
/*!40000 ALTER TABLE `product_variants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `products` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` int(11) NOT NULL,
  `category_id` int(11) NOT NULL,
  `product_name` varchar(255) DEFAULT NULL,
  `product_code` varchar(100) DEFAULT NULL,
  `description` text DEFAULT NULL,
  `base_price` decimal(10,2) NOT NULL DEFAULT 0.00,
  `discount_price` decimal(10,2) DEFAULT NULL,
  `stock_quantity` int(11) NOT NULL DEFAULT 0,
  `prep_minutes` int(11) DEFAULT NULL COMMENT 'typical prep time in minutes (food)',
  `attributes_json` text DEFAULT NULL COMMENT 'category-specific attributes as JSON',
  `is_veg` tinyint(1) DEFAULT NULL,
  `is_returnable` tinyint(1) NOT NULL DEFAULT 0,
  `is_featured` tinyint(1) NOT NULL DEFAULT 0,
  `is_available` tinyint(1) NOT NULL DEFAULT 1,
  `active_status` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_products_vendor_id` (`vendor_id`),
  KEY `idx_products_category_id` (`category_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9032 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (9001,9001,9001,'Chicken Biryani','BIR-CHK','Seeraga samba rice, bone-in chicken, slow dum.',220.00,NULL,24,18,'{\"tags\":[\"Non-veg\",\"Spicy\"],\"spice_choice\":true}',0,0,1,1,1,'2026-09-18 14:41:14',0),(9002,9001,9002,'Paneer Butter Masala','CUR-PBM',NULL,210.00,NULL,30,12,'{\"tags\":[\"Veg\"]}',1,0,0,1,1,'2026-09-18 14:41:14',0),(9003,9001,9003,'Mutton Chukka','DRY-MTN',NULL,320.00,NULL,0,25,'{\"tags\":[\"Non-veg\",\"Spicy\"],\"spice_choice\":true,\"out_note\":\"back tomorrow\"}',0,0,0,1,1,'2026-09-18 14:41:14',0),(9004,9001,9004,'Parotta','BRD-PAR',NULL,20.00,NULL,140,8,'{\"tags\":[\"Veg\"],\"price_line\":\"₹20 / piece · packs of 1, 2, 5\"}',1,0,0,1,1,'2026-09-18 14:41:14',0),(9005,9001,9005,'Bread Halwa','SWT-BHL',NULL,90.00,NULL,40,5,'{\"tags\":[\"Veg\"]}',1,0,0,1,1,'2026-09-18 14:41:14',0),(9006,9001,9002,'Ennai Kathirikai','CUR-ENK',NULL,140.00,NULL,20,10,'{\"tags\":[\"Veg\"]}',1,0,0,1,1,'2026-09-18 14:41:14',0),(9007,9001,9001,'Mutton Biryani','BIR-MTN',NULL,520.00,NULL,15,25,'{\"tags\":[\"Non-veg\"]}',0,0,0,1,1,'2026-09-18 14:41:14',0),(9008,9001,9003,'Veg Fried Rice','STR-VFR',NULL,150.00,NULL,25,12,'{\"tags\":[\"Veg\"]}',1,0,0,1,1,'2026-09-18 14:41:14',0),(9009,9001,9003,'Gobi 65','STR-G65',NULL,110.00,NULL,25,10,'{\"tags\":[\"Veg\"]}',1,0,0,1,1,'2026-09-18 14:41:14',0),(9010,9001,9005,'Rasmalai','SWT-RML',NULL,120.00,NULL,0,2,'{\"tags\":[\"Veg\"],\"out_note\":\"back tomorrow\"}',1,0,0,1,1,'2026-09-18 14:41:14',0),(9021,9002,9011,'Aachi Sambar Powder','EAN8901004412',NULL,85.00,72.00,146,NULL,'{\"brand\":\"Aachi\",\"ean\":\"EAN 8901…4412\",\"low_stock_alert\":20,\"batch_expiry\":\"14 Mar 2027\",\"hsn_gst\":\"0910 · 5%\",\"max_per_order\":6}',1,0,1,1,1,'2026-09-18 14:41:14',0),(9022,9002,9012,'Ponni Raw Rice','EAN8904001180',NULL,380.00,340.00,38,NULL,'{\"brand\":\"Sri Lakshmi\",\"ean\":\"EAN 8904…1180\",\"low_stock_alert\":10,\"batch_expiry\":\"02 Jan 2027\",\"hsn_gst\":\"1006 · 0%\",\"max_per_order\":3}',1,0,0,1,1,'2026-09-18 14:41:14',0),(9023,9002,9013,'Gold Winner Sunflower Oil','EAN8906000021',NULL,185.00,168.00,0,NULL,'{\"brand\":\"Gold Winner\",\"ean\":\"EAN 8906…0021\",\"low_stock_alert\":12,\"batch_expiry\":\"20 Feb 2027\",\"hsn_gst\":\"1512 · 5%\",\"max_per_order\":4,\"out_note\":\"restock Thursday\"}',1,0,0,0,1,'2026-09-18 14:41:14',0),(9024,9003,9029,'Tomato','GF-TOM-1KG','Fresh local tomatoes',36.00,NULL,120,NULL,'{\"unit\":\"kg\",\"grade\":\"Grade A\"}',1,0,1,1,1,'2026-09-28 12:36:24',0),(9025,9004,9030,'Butterscotch Cake','AB-CAKE-1KG','One kilogram celebration cake',820.00,NULL,12,NULL,'{\"kind\":\"bakery\",\"flavor\":\"Butterscotch\",\"sold_as\":\"1 kg\"}',1,0,1,1,1,'2026-09-28 12:36:24',0),(9026,9005,9031,'Chicken Curry Cut','MF-CHK-1KG','Cleaned chicken curry cut',520.00,NULL,35,NULL,'{\"kind\":\"meat\",\"unit\":\"kg\",\"cut\":\"Curry cut\"}',0,0,1,1,1,'2026-09-28 12:36:24',0),(9027,9001,9005,'Kalakand',NULL,NULL,50.00,NULL,20,15,NULL,1,0,0,1,1,'2026-10-01 07:45:13',0),(9028,9001,9005,'Kalakand',NULL,NULL,50.00,NULL,20,15,NULL,1,0,0,1,1,'2026-10-01 07:45:14',0),(9029,9001,9005,'Mysorepak',NULL,NULL,50.00,NULL,20,15,NULL,1,0,0,1,1,'2026-10-01 09:25:15',0),(9030,9006,9002,'Paneer Butter Masala','LOCAL-SHENOY-PANEER-BUTTER-MASALA','Creamy tomato gravy with fresh paneer.',220.00,NULL,25,20,NULL,1,0,1,1,1,'2026-10-06 11:31:17',0),(9031,9006,9002,'Paneer Tikka','LOCAL-SHENOY-PANEER-TIKKA','Char-grilled paneer with peppers and spices.',190.00,NULL,25,20,NULL,1,0,0,1,1,'2026-10-06 11:31:17',0);
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_cart_context`
--

DROP TABLE IF EXISTS `public_cart_context`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `public_cart_context` (
  `cart_id` int(11) NOT NULL,
  `version` int(11) NOT NULL DEFAULT 1,
  `context_json` longtext NOT NULL,
  PRIMARY KEY (`cart_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_cart_context`
--

LOCK TABLES `public_cart_context` WRITE;
/*!40000 ALTER TABLE `public_cart_context` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_cart_context` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_cart_options`
--

DROP TABLE IF EXISTS `public_cart_options`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `public_cart_options` (
  `cart_item_id` int(11) NOT NULL,
  `addon_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  PRIMARY KEY (`cart_item_id`,`addon_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_cart_options`
--

LOCK TABLES `public_cart_options` WRITE;
/*!40000 ALTER TABLE `public_cart_options` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_cart_options` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_coupon_usage`
--

DROP TABLE IF EXISTS `public_coupon_usage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `public_coupon_usage` (
  `coupon_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `order_id` int(11) NOT NULL,
  `released` tinyint(4) NOT NULL DEFAULT 0,
  PRIMARY KEY (`coupon_id`,`order_id`),
  KEY `idx_usage_customer` (`coupon_id`,`customer_id`,`released`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_coupon_usage`
--

LOCK TABLES `public_coupon_usage` WRITE;
/*!40000 ALTER TABLE `public_coupon_usage` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_coupon_usage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_idempotency`
--

DROP TABLE IF EXISTS `public_idempotency`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `public_idempotency` (
  `tenant_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `operation` varchar(30) NOT NULL,
  `request_key` varchar(150) NOT NULL,
  `body_hash` varchar(64) NOT NULL,
  `response_json` longtext DEFAULT NULL,
  PRIMARY KEY (`tenant_id`,`customer_id`,`operation`,`request_key`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_idempotency`
--

LOCK TABLES `public_idempotency` WRITE;
/*!40000 ALTER TABLE `public_idempotency` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_idempotency` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_notification_receipts`
--

DROP TABLE IF EXISTS `public_notification_receipts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `public_notification_receipts` (
  `customer_id` int(11) NOT NULL,
  `notification_id` int(11) NOT NULL,
  `read_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`customer_id`,`notification_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_notification_receipts`
--

LOCK TABLES `public_notification_receipts` WRITE;
/*!40000 ALTER TABLE `public_notification_receipts` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_notification_receipts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_otp_challenges`
--

DROP TABLE IF EXISTS `public_otp_challenges`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `public_otp_challenges` (
  `id` varchar(48) NOT NULL,
  `tenant_id` int(11) NOT NULL,
  `mobile` varchar(20) NOT NULL,
  `digest` varchar(64) NOT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `consumed_at` datetime DEFAULT NULL,
  `expires_at` datetime NOT NULL,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  KEY `idx_otp_phone` (`tenant_id`,`mobile`,`created_at`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_otp_challenges`
--

LOCK TABLES `public_otp_challenges` WRITE;
/*!40000 ALTER TABLE `public_otp_challenges` DISABLE KEYS */;
INSERT INTO `public_otp_challenges` VALUES ('11c6a5b375dc1e4c1f543645ac79c1ffde64e75af4a7f0eb',1,'0000000000','e18fe13db69f094da76d1ba802042e793327b339b9d8626db18ec4120f2edaf3',0,NULL,'2026-10-06 10:23:00','2026-10-06 10:18:00'),('1c32e15ee04dc35d8d84a80c23be5b9367f85cd99d95bb44',1,'9898896885','f741ade8c7c5097ac516c6b382a7c91557e8f4d0e19021df6e4076b1408b80f1',0,NULL,'2026-10-06 10:21:29','2026-10-06 10:16:29'),('1ca1386c61745b494c43e81cb755cb6fcf561014ee55ffae',1,'9898896885','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-06 10:19:56','2026-10-06 10:24:51','2026-10-06 10:19:51'),('1cfcdb5fa73a350ede0bd93f4cc149c2530787606130a803',1,'9876543210','61dbec1d67afe651537e012d2327f6b469780e41565e50e39498f8336fd38cc8',0,NULL,'2026-10-05 16:17:51','2026-10-05 16:12:51'),('22d6668bc8020b713c3212d6ae028da1b0d86395393d1684',1,'7995734431','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 19:22:34','2026-10-02 19:27:30','2026-10-02 19:22:30'),('29b46a6f9ceb83cd74c9b3a4c02f702665cd73cfabb199b4',1,'7997753587','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-03 10:42:56','2026-10-03 10:47:54','2026-10-03 10:42:54'),('38dcc8789b107ce7236bb65055b627047c18aac6666deb92',1,'9876500001','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 17:52:54','2026-10-02 17:57:07','2026-10-02 17:52:07'),('391ae061547a139c2329c5f8c0912b306e1edb5fb42e9c6d',1,'9786943769','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:45:42','2026-10-02 18:50:42','2026-10-02 18:45:42'),('47a7cb00631de8ea4074b5be951c73c4848c1a3512017310',1,'9858555555','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-03 10:36:46','2026-10-03 10:41:43','2026-10-03 10:36:43'),('4879b02142911f23167aa45819375611586e88a7131eec50',1,'7997753587','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:58:55','2026-10-02 19:03:49','2026-10-02 18:58:49'),('57c36af3b85f3fadbc2b6f69c569541be0f6160bce611dba',1,'9786943769','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:39:55','2026-10-02 18:44:55','2026-10-02 18:39:55'),('5d0e2f56494f9c3f7c1948fa0b5de2e16f218fd51c23ec6d',1,'7997753887','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-03 10:45:03','2026-10-03 10:49:55','2026-10-03 10:44:55'),('627d61b1bdc168ea0064d4c60c06377af636cf14cbfec1e2',1,'9786943769','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:46:56','2026-10-02 18:51:56','2026-10-02 18:46:56'),('6cc8bf43de8b54b9d370ae725e4f4ae0d3a344f45daa8c74',1,'7997753587','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-03 10:42:04','2026-10-03 10:47:01','2026-10-03 10:42:01'),('799234c6b5d1a6e6cdd1095c199d93ded938932dbe2a9549',1,'9999999999','c22549e687919a8e05e93b679b9cf6adaf550708f1a59f8e0f436f88c0dabcbf',0,NULL,'2026-10-05 16:15:35','2026-10-05 16:10:35'),('7e837cb7e399511249ab81fba7423e5e29261a54f0d901bf',1,'7997753587','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 19:10:13','2026-10-02 19:15:10','2026-10-02 19:10:10'),('899e15b9e414c41c1dff5f12f9d3abfc0a2e788cc32b1c5e',1,'9876500001','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,NULL,'2026-10-02 16:15:21','2026-10-02 16:10:21'),('8b3abf6181bdd8732754c4e3fa4873207bc15fabd8e46a90',1,'9786943769','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:42:36','2026-10-02 18:47:35','2026-10-02 18:42:35'),('92374a135b2b115183a93f0f5b062946dff5486c82e51cec',1,'7997753587','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-06 15:27:06','2026-10-06 15:32:01','2026-10-06 15:27:01'),('9a2cab3f8ba7c2684fa3ec836ab6f3f5784982307e3c96a3',1,'7997753587','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:36:52','2026-10-02 18:41:50','2026-10-02 18:36:50'),('9cad77c65e04a42beb639186423abede077288858d6b25e8',1,'6669606866','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,NULL,'2026-10-03 11:38:47','2026-10-03 11:33:47'),('9cd3f784d77e288abe4090678cb3154cc38caeee89362474',1,'9999898868','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-06 12:06:48','2026-10-06 12:11:42','2026-10-06 12:06:42'),('9d46faf6d6d8ba0b587a63e95915d18d8dd52dce83b0f1d8',1,'8989685888','56fee0650f471b6a677901e473aaa4ef06b93198f3dae85a15c5fc260572266d',0,NULL,'2026-10-05 16:20:19','2026-10-05 16:15:19'),('a15146c93a009b0a4aef903697eb0d8e02fb7fb05c6150a7',1,'9876500001','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 17:47:51','2026-10-02 17:52:10','2026-10-02 17:47:10'),('acb1a9d2875f1ec92b1c70e4c8f7293635b5f1f3943e6fea',1,'9668686066','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-03 11:28:45','2026-10-03 11:33:39','2026-10-03 11:28:39'),('af0fdd8356f5e6ad396c7de47de1839a5c255acaca50bb5e',1,'7997753587','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-06 17:28:26','2026-10-06 17:33:21','2026-10-06 17:28:21'),('bb777ccd6e4eca291b6c203842be3780bf3ada9a32113646',1,'9786943769','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:41:26','2026-10-02 18:46:26','2026-10-02 18:41:26'),('bc35c04e3063901c4e3179478f923f756aae76a0cbd026b8',1,'9052376494','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 16:48:48','2026-10-02 16:53:31','2026-10-02 16:48:31'),('c00e62cdfdb2d0f7fba2cc4eb1c1477a40ec020499da417d',1,'9786943769','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:40:57','2026-10-02 18:45:57','2026-10-02 18:40:57'),('c099d32e8ddae7e97976c07a2d9701cc9d87251c8897144e',1,'7997753587','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-02 18:50:22','2026-10-02 18:55:01','2026-10-02 18:50:01'),('c2ecd9f5c14c697175c78e7ca76d544190a2872baa4717e3',1,'9666666682','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,'2026-10-03 11:34:06','2026-10-03 11:39:02','2026-10-03 11:34:02'),('d2a18339caa74f83bab808e534ba7dc30a84610513ec21ae',1,'9876543210','4b70c9928c3588cbd5f03ef7e4ce5a51cca5b9a5355a17b987eb9eb7fd747578',0,NULL,'2026-10-05 16:18:26','2026-10-05 16:13:26'),('d919e1bd31557beab71d95c5710f5ddb475780f316a4a112',1,'0000000001','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,NULL,'2026-10-06 10:24:36','2026-10-06 10:19:36'),('e360d87609b1445ec13fbaaef7bcf753adfc9d7c1ddac18e',1,'9876543210','c851c78a5599734768420b217e7d5a39e6e6ff66bd0c97e8d80cd8a3da36f039',0,NULL,'2026-10-05 16:11:27','2026-10-05 16:06:27'),('e37ffc9500d846ea34c22238d76bcc45f29f15c4c2437041',1,'9876500001','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,NULL,'2026-10-02 16:18:12','2026-10-02 16:13:12'),('fb5db3e2a5653862ef0048a82e16533e04d7e468df82e731',1,'8850584848','03ac674216f3e15c761ee1a5e255f067953623c8b388b4459e13f978d7c846f4',0,NULL,'2026-10-03 10:40:56','2026-10-03 10:35:56');
/*!40000 ALTER TABLE `public_otp_challenges` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `public_outbox`
--

DROP TABLE IF EXISTS `public_outbox`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `public_outbox` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `event_type` varchar(50) NOT NULL,
  `completed_at` datetime DEFAULT NULL,
  `attempts` int(11) NOT NULL DEFAULT 0,
  `created_at` datetime NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_outbox` (`order_id`,`event_type`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `public_outbox`
--

LOCK TABLES `public_outbox` WRITE;
/*!40000 ALTER TABLE `public_outbox` DISABLE KEYS */;
/*!40000 ALTER TABLE `public_outbox` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_order_deliveries`
--

DROP TABLE IF EXISTS `recurring_order_deliveries`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recurring_order_deliveries` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recurring_order_subscription_id` int(11) NOT NULL,
  `scheduled_date` date DEFAULT NULL,
  `order_id` int(11) DEFAULT NULL COMMENT 'linked once fulfilled',
  `delivery_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 scheduled,1 fulfilled,2 skipped,3 failed',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_recurring_order_deliveries_recurring_order_subscription_id` (`recurring_order_subscription_id`),
  KEY `idx_recurring_order_deliveries_order_id` (`order_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_order_deliveries`
--

LOCK TABLES `recurring_order_deliveries` WRITE;
/*!40000 ALTER TABLE `recurring_order_deliveries` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurring_order_deliveries` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_order_items`
--

DROP TABLE IF EXISTS `recurring_order_items`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recurring_order_items` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `recurring_order_subscription_id` int(11) NOT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `price_per_cycle` decimal(10,2) NOT NULL DEFAULT 0.00,
  `effective_from` date DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_recurring_order_items_recurring_order_subscription_id` (`recurring_order_subscription_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_order_items`
--

LOCK TABLES `recurring_order_items` WRITE;
/*!40000 ALTER TABLE `recurring_order_items` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurring_order_items` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `recurring_order_subscriptions`
--

DROP TABLE IF EXISTS `recurring_order_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `recurring_order_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `product_variant_id` int(11) NOT NULL,
  `subscription_frequency_type_id` int(11) NOT NULL,
  `customer_address_id` int(11) DEFAULT NULL,
  `quantity` int(11) NOT NULL DEFAULT 1,
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 active,1 paused,2 cancelled,3 completed',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_recurring_order_subscriptions_customer_id` (`customer_id`),
  KEY `idx_recurring_order_subscriptions_product_variant_id` (`product_variant_id`),
  KEY `idx_recurring_order_subscriptions_subscription_frequency_type_id` (`subscription_frequency_type_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `recurring_order_subscriptions`
--

LOCK TABLES `recurring_order_subscriptions` WRITE;
/*!40000 ALTER TABLE `recurring_order_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `recurring_order_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referral_codes`
--

DROP TABLE IF EXISTS `referral_codes`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referral_codes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_id` int(11) NOT NULL,
  `referral_code` varchar(50) DEFAULT NULL,
  `total_referrals` int(11) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_referral_codes_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referral_codes`
--

LOCK TABLES `referral_codes` WRITE;
/*!40000 ALTER TABLE `referral_codes` DISABLE KEYS */;
/*!40000 ALTER TABLE `referral_codes` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `referrals`
--

DROP TABLE IF EXISTS `referrals`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referrals` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `referral_code_id` int(11) NOT NULL,
  `referred_customer_id` int(11) NOT NULL,
  `referral_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 qualified,2 rewarded',
  `qualified_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_referrals_referral_code_id` (`referral_code_id`),
  KEY `idx_referrals_referred_customer_id` (`referred_customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `referrals`
--

LOCK TABLES `referrals` WRITE;
/*!40000 ALTER TABLE `referrals` DISABLE KEYS */;
/*!40000 ALTER TABLE `referrals` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `refunds`
--

DROP TABLE IF EXISTS `refunds`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `refunds` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `payment_id` int(11) NOT NULL,
  `refund_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `refund_reason` varchar(255) DEFAULT NULL,
  `gateway_refund_id` varchar(150) DEFAULT NULL,
  `refund_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 initiated,1 processed,2 failed',
  `processed_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_refunds_payment_id` (`payment_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `refunds`
--

LOCK TABLES `refunds` WRITE;
/*!40000 ALTER TABLE `refunds` DISABLE KEYS */;
/*!40000 ALTER TABLE `refunds` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reviews`
--

DROP TABLE IF EXISTS `reviews`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reviews` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `order_id` int(11) NOT NULL,
  `customer_id` int(11) NOT NULL,
  `product_id` int(11) DEFAULT NULL,
  `vendor_id` int(11) DEFAULT NULL,
  `rating` tinyint(1) NOT NULL DEFAULT 5,
  `review_text` text DEFAULT NULL,
  `review_images` longtext DEFAULT NULL,
  `vendor_reply` text DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_reviews_order_id` (`order_id`),
  KEY `idx_reviews_customer_id` (`customer_id`),
  KEY `idx_reviews_product_id` (`product_id`),
  KEY `idx_reviews_vendor_id` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reviews`
--

LOCK TABLES `reviews` WRITE;
/*!40000 ALTER TABLE `reviews` DISABLE KEYS */;
/*!40000 ALTER TABLE `reviews` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `reward_transactions`
--

DROP TABLE IF EXISTS `reward_transactions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `reward_transactions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `customer_wallet_id` int(11) NOT NULL,
  `referral_id` int(11) DEFAULT NULL,
  `reward_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reward_type` varchar(50) DEFAULT 'referral' COMMENT 'referral / promo / cashback',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_reward_transactions_customer_wallet_id` (`customer_wallet_id`),
  KEY `idx_reward_transactions_referral_id` (`referral_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `reward_transactions`
--

LOCK TABLES `reward_transactions` WRITE;
/*!40000 ALTER TABLE `reward_transactions` DISABLE KEYS */;
/*!40000 ALTER TABLE `reward_transactions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sa_main_module`
--

DROP TABLE IF EXISTS `sa_main_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sa_main_module` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `module_name` varchar(150) NOT NULL,
  `module_icon` varchar(150) DEFAULT NULL,
  `module_path` varchar(255) DEFAULT NULL,
  `module_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sa_main_module`
--

LOCK TABLES `sa_main_module` WRITE;
/*!40000 ALTER TABLE `sa_main_module` DISABLE KEYS */;
INSERT INTO `sa_main_module` VALUES (1,'Dashboard','ri-home-2-fill','/dashboard',1,1,'2026-09-13 17:32:58',0),(2,'Tenants','ri-building-2-fill',NULL,2,1,'2026-09-13 17:32:58',0),(3,'Partners','ri-team-fill',NULL,3,1,'2026-09-13 17:32:58',0),(4,'Plans & Billing','ri-money-dollar-circle-fill',NULL,4,1,'2026-09-13 17:32:58',0),(5,'Dev Support','ri-customer-service-2-fill','/masters/devsupport',5,1,'2026-09-13 17:32:58',0),(6,'Permissions','ri-shield-keyhole-fill',NULL,6,1,'2026-09-13 17:32:58',0);
/*!40000 ALTER TABLE `sa_main_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sa_sub_module`
--

DROP TABLE IF EXISTS `sa_sub_module`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sa_sub_module` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `sa_main_module_id` int(11) NOT NULL,
  `sub_module_name` varchar(150) NOT NULL,
  `route_path` varchar(255) DEFAULT NULL,
  `sub_module_order` int(11) DEFAULT 0,
  `is_active` tinyint(1) DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_sa_sub_module_sa_main_module_id` (`sa_main_module_id`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sa_sub_module`
--

LOCK TABLES `sa_sub_module` WRITE;
/*!40000 ALTER TABLE `sa_sub_module` DISABLE KEYS */;
INSERT INTO `sa_sub_module` VALUES (1,2,'Manage Tenants','/masters/tenants',1,1,'2026-09-13 17:32:58',0),(2,2,'Tenant Settings','/masters/tenant-settings',2,1,'2026-09-13 17:32:58',0),(3,3,'Manage Partners','/masters/partners',1,1,'2026-09-13 17:32:58',0),(4,4,'Plans','/masters/plans',1,1,'2026-09-13 17:32:58',0),(5,4,'Subscriptions','/masters/subscriptions',2,1,'2026-09-13 17:32:58',0),(6,6,'Create Users','/permission/createusers',1,1,'2026-09-13 17:32:58',1),(7,6,'Permissions','/permission/permissions',2,1,'2026-09-13 17:32:58',0);
/*!40000 ALTER TABLE `sa_sub_module` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sa_user_permissions`
--

DROP TABLE IF EXISTS `sa_user_permissions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sa_user_permissions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `super_admin_user_id` int(11) NOT NULL,
  `sa_main_module_id` int(11) DEFAULT NULL,
  `sa_sub_module_id` int(11) DEFAULT NULL,
  `can_view` tinyint(1) DEFAULT 0,
  `can_add` tinyint(1) DEFAULT 0,
  `can_edit` tinyint(1) DEFAULT 0,
  `can_delete` tinyint(1) DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_sa_user_permissions_super_admin_user_id` (`super_admin_user_id`),
  KEY `idx_sa_user_permissions_sa_main_module_id` (`sa_main_module_id`),
  KEY `idx_sa_user_permissions_sa_sub_module_id` (`sa_sub_module_id`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sa_user_permissions`
--

LOCK TABLES `sa_user_permissions` WRITE;
/*!40000 ALTER TABLE `sa_user_permissions` DISABLE KEYS */;
INSERT INTO `sa_user_permissions` VALUES (1,1,1,NULL,1,1,1,1,'2026-09-13 17:32:58',0),(2,1,2,1,1,1,1,1,'2026-09-13 17:32:58',0),(3,1,2,2,1,1,1,1,'2026-09-13 17:32:58',0),(4,1,3,3,1,1,1,1,'2026-09-13 17:32:58',0),(5,1,4,4,1,1,1,1,'2026-09-13 17:32:58',0),(6,1,4,5,1,1,1,1,'2026-09-13 17:32:58',0),(7,1,5,NULL,1,1,1,1,'2026-09-13 17:32:58',0),(8,1,6,6,1,1,1,1,'2026-09-13 17:32:58',0),(9,1,6,7,1,1,1,1,'2026-09-13 17:32:58',0);
/*!40000 ALTER TABLE `sa_user_permissions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `search_logs`
--

DROP TABLE IF EXISTS `search_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `search_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `customer_id` int(11) DEFAULT NULL,
  `search_term` varchar(255) DEFAULT NULL,
  `result_count` int(11) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_search_logs_tenant_id` (`tenant_id`),
  KEY `idx_search_logs_customer_id` (`customer_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `search_logs`
--

LOCK TABLES `search_logs` WRITE;
/*!40000 ALTER TABLE `search_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `search_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sms_logs`
--

DROP TABLE IF EXISTS `sms_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sms_logs` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) DEFAULT NULL,
  `mobile_number` varchar(20) DEFAULT NULL,
  `message_text` text DEFAULT NULL,
  `sms_provider` varchar(50) DEFAULT NULL,
  `delivery_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 queued,1 sent,2 failed',
  `credits_used` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_sms_logs_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sms_logs`
--

LOCK TABLES `sms_logs` WRITE;
/*!40000 ALTER TABLE `sms_logs` DISABLE KEYS */;
/*!40000 ALTER TABLE `sms_logs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `subscription_frequency_types`
--

DROP TABLE IF EXISTS `subscription_frequency_types`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `subscription_frequency_types` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `frequency_name` varchar(50) NOT NULL COMMENT 'daily / alternate-day / weekly',
  `interval_days` int(11) NOT NULL DEFAULT 1,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `subscription_frequency_types`
--

LOCK TABLES `subscription_frequency_types` WRITE;
/*!40000 ALTER TABLE `subscription_frequency_types` DISABLE KEYS */;
/*!40000 ALTER TABLE `subscription_frequency_types` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `super_admin_users`
--

DROP TABLE IF EXISTS `super_admin_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `super_admin_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `super_admin_users`
--

LOCK TABLES `super_admin_users` WRITE;
/*!40000 ALTER TABLE `super_admin_users` DISABLE KEYS */;
INSERT INTO `super_admin_users` VALUES (1,'Super Admin','7661967145','admin@godavariwave.com','123456',NULL,1,1,1,'2026-09-14 12:45:03','2026-09-13 17:32:58',0);
/*!40000 ALTER TABLE `super_admin_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_messages`
--

DROP TABLE IF EXISTS `support_messages`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_messages` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `support_ticket_id` int(11) NOT NULL,
  `sender_type` varchar(20) DEFAULT NULL COMMENT 'customer / vendor / admin',
  `sender_id` int(11) DEFAULT NULL,
  `message` text DEFAULT NULL,
  `attachment_path` longtext DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_support_messages_support_ticket_id` (`support_ticket_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_messages`
--

LOCK TABLES `support_messages` WRITE;
/*!40000 ALTER TABLE `support_messages` DISABLE KEYS */;
INSERT INTO `support_messages` VALUES (1,1,'delivery_partner',9001,'9840721536',NULL,'2026-09-29 13:04:56',0);
/*!40000 ALTER TABLE `support_messages` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `support_tickets`
--

DROP TABLE IF EXISTS `support_tickets`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `support_tickets` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  `delivery_partner_id` int(11) DEFAULT NULL,
  `ticket_reference` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_support_tickets_tenant_id` (`tenant_id`),
  KEY `idx_support_tickets_customer_id` (`customer_id`),
  KEY `idx_support_tickets_vendor_id` (`vendor_id`),
  KEY `support_tickets_partner` (`delivery_partner_id`,`d_in`),
  KEY `support_tickets_reference` (`ticket_reference`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `support_tickets`
--

LOCK TABLES `support_tickets` WRITE;
/*!40000 ALTER TABLE `support_tickets` DISABLE KEYS */;
INSERT INTO `support_tickets` VALUES (1,1,'delivery_partner',NULL,NULL,NULL,'Order issue','9840721536','medium',0,'2026-09-29 13:04:56',0,9001,'SR-10001');
/*!40000 ALTER TABLE `support_tickets` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_categories`
--

DROP TABLE IF EXISTS `tax_categories`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tax_categories` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `tax_category_name` varchar(150) DEFAULT NULL,
  `hsn_sac_code` varchar(20) DEFAULT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tax_categories_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_categories`
--

LOCK TABLES `tax_categories` WRITE;
/*!40000 ALTER TABLE `tax_categories` DISABLE KEYS */;
/*!40000 ALTER TABLE `tax_categories` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tax_rates`
--

DROP TABLE IF EXISTS `tax_rates`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tax_rates` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tax_category_id` int(11) NOT NULL,
  `region` varchar(150) DEFAULT NULL COMMENT 'state / country the rate applies to',
  `tax_name` varchar(50) DEFAULT 'GST',
  `tax_percentage` decimal(5,2) NOT NULL DEFAULT 0.00,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tax_rates_tax_category_id` (`tax_category_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tax_rates`
--

LOCK TABLES `tax_rates` WRITE;
/*!40000 ALTER TABLE `tax_rates` DISABLE KEYS */;
/*!40000 ALTER TABLE `tax_rates` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_branding`
--

DROP TABLE IF EXISTS `tenant_branding`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_branding` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_branding_tenant_id` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_branding`
--

LOCK TABLES `tenant_branding` WRITE;
/*!40000 ALTER TABLE `tenant_branding` DISABLE KEYS */;
INSERT INTO `tenant_branding` VALUES (1,1,'admin_dashboard',NULL,NULL,NULL,NULL,NULL,'#01003c',NULL,'#01003c',NULL,NULL,NULL,NULL,'2026-09-14 16:53:54',0);
/*!40000 ALTER TABLE `tenant_branding` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_charge_settings`
--

DROP TABLE IF EXISTS `tenant_charge_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_charge_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `handling_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `packing_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `donation_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rain_surge_charge` decimal(10,2) NOT NULL DEFAULT 0.00,
  `rain_surge_active` tinyint(1) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  `cod_enabled` tinyint(4) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_charge_settings_tenant_id` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_charge_settings`
--

LOCK TABLES `tenant_charge_settings` WRITE;
/*!40000 ALTER TABLE `tenant_charge_settings` DISABLE KEYS */;
INSERT INTO `tenant_charge_settings` VALUES (1,1,0.00,0.00,0.00,0.00,0,'2026-09-14 19:10:37',0,1);
/*!40000 ALTER TABLE `tenant_charge_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_domains`
--

DROP TABLE IF EXISTS `tenant_domains`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_domains` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `subdomain` varchar(255) DEFAULT NULL,
  `custom_domain` varchar(255) DEFAULT NULL,
  `ssl_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 active,2 failed',
  `is_primary` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_domains_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_domains`
--

LOCK TABLES `tenant_domains` WRITE;
/*!40000 ALTER TABLE `tenant_domains` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_domains` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_features`
--

DROP TABLE IF EXISTS `tenant_features`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_features` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `feature_key` varchar(100) DEFAULT NULL COMMENT 'subscriptions / wallet / referrals / delivery_partners ...',
  `is_enabled` tinyint(1) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_features_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_features`
--

LOCK TABLES `tenant_features` WRITE;
/*!40000 ALTER TABLE `tenant_features` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_features` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_provisioning`
--

DROP TABLE IF EXISTS `tenant_provisioning`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_provisioning` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `step_name` varchar(150) DEFAULT NULL COMMENT 'kyc / branding / catalog / payment_gateway / go_live',
  `step_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 completed,2 skipped',
  `completed_at` datetime DEFAULT NULL,
  `remarks` varchar(255) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_provisioning_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_provisioning`
--

LOCK TABLES `tenant_provisioning` WRITE;
/*!40000 ALTER TABLE `tenant_provisioning` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_provisioning` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_settings`
--

DROP TABLE IF EXISTS `tenant_settings`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_settings` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  `terms_url` varchar(255) DEFAULT NULL,
  `privacy_url` varchar(255) DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `idx_tenant_settings_tenant_id` (`tenant_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_settings`
--

LOCK TABLES `tenant_settings` WRITE;
/*!40000 ALTER TABLE `tenant_settings` DISABLE KEYS */;
INSERT INTO `tenant_settings` VALUES (1,1,'INR','₹','Asia/Kolkata','DD-MM-YYYY','#01003c','#6c757d','en',NULL,NULL,'2026-09-14 16:53:54',0,NULL,NULL);
/*!40000 ALTER TABLE `tenant_settings` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_subscriptions`
--

DROP TABLE IF EXISTS `tenant_subscriptions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_subscriptions` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `billing_cycle` varchar(20) NOT NULL DEFAULT 'monthly' COMMENT 'monthly / yearly',
  `start_date` date DEFAULT NULL,
  `end_date` date DEFAULT NULL,
  `auto_renew` tinyint(1) NOT NULL DEFAULT 1,
  `status` int(11) NOT NULL DEFAULT 0 COMMENT '0 trial,1 active,2 expired,3 cancelled',
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_subscriptions_tenant_id` (`tenant_id`),
  KEY `idx_tenant_subscriptions_plan_id` (`plan_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_subscriptions`
--

LOCK TABLES `tenant_subscriptions` WRITE;
/*!40000 ALTER TABLE `tenant_subscriptions` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_subscriptions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenant_users`
--

DROP TABLE IF EXISTS `tenant_users`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenant_users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tenant_users_tenant_id` (`tenant_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenant_users`
--

LOCK TABLES `tenant_users` WRITE;
/*!40000 ALTER TABLE `tenant_users` DISABLE KEYS */;
/*!40000 ALTER TABLE `tenant_users` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tenants`
--

DROP TABLE IF EXISTS `tenants`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tenants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_tenants_plan_id` (`plan_id`),
  KEY `idx_tenants_partner_id` (`partner_id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tenants`
--

LOCK TABLES `tenants` WRITE;
/*!40000 ALTER TABLE `tenants` DISABLE KEYS */;
INSERT INTO `tenants` VALUES (1,'Demo Store','DEMO001','Demo Admin','9999999999','admin@demostore.com',NULL,NULL,NULL,NULL,NULL,NULL,0,1,'2026-09-14 16:53:54',0);
/*!40000 ALTER TABLE `tenants` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_adjustments`
--

DROP TABLE IF EXISTS `vendor_adjustments`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendor_adjustments` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` int(11) NOT NULL,
  `adjustment_type` varchar(20) DEFAULT 'credit' COMMENT 'credit / debit',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `reason` varchar(255) DEFAULT NULL,
  `adjusted_by` int(11) DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_vendor_adjustments_vendor_id` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_adjustments`
--

LOCK TABLES `vendor_adjustments` WRITE;
/*!40000 ALTER TABLE `vendor_adjustments` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_adjustments` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_dayparts`
--

DROP TABLE IF EXISTS `vendor_dayparts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendor_dayparts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` int(11) NOT NULL,
  `daypart_key` varchar(30) NOT NULL,
  `label` varchar(60) NOT NULL,
  `start_time` time NOT NULL,
  `end_time` time NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 0,
  `daypart_order` int(11) NOT NULL DEFAULT 0,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendor_daypart_key` (`vendor_id`,`daypart_key`),
  KEY `vendor_dayparts_vendor` (`vendor_id`,`d_in`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_dayparts`
--

LOCK TABLES `vendor_dayparts` WRITE;
/*!40000 ALTER TABLE `vendor_dayparts` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_dayparts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_invoices`
--

DROP TABLE IF EXISTS `vendor_invoices`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendor_invoices` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_id` int(11) NOT NULL,
  `invoice_number` varchar(100) DEFAULT NULL,
  `invoice_type` varchar(20) DEFAULT 'commission' COMMENT 'commission / settlement',
  `amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `invoice_date` date DEFAULT NULL,
  `pdf_path` longtext DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_vendor_invoices_vendor_id` (`vendor_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_invoices`
--

LOCK TABLES `vendor_invoices` WRITE;
/*!40000 ALTER TABLE `vendor_invoices` DISABLE KEYS */;
/*!40000 ALTER TABLE `vendor_invoices` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_payouts`
--

DROP TABLE IF EXISTS `vendor_payouts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendor_payouts` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_settlement_id` int(11) NOT NULL,
  `payout_amount` decimal(10,2) NOT NULL DEFAULT 0.00,
  `payout_method` varchar(50) DEFAULT NULL COMMENT 'bank_transfer / upi',
  `transaction_reference` varchar(150) DEFAULT NULL,
  `payout_proof` longtext DEFAULT NULL,
  `payout_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 pending,1 completed,2 failed',
  `paid_at` datetime DEFAULT NULL,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_vendor_payouts_vendor_settlement_id` (`vendor_settlement_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9004 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_payouts`
--

LOCK TABLES `vendor_payouts` WRITE;
/*!40000 ALTER TABLE `vendor_payouts` DISABLE KEYS */;
INSERT INTO `vendor_payouts` VALUES (9002,9002,41260.00,'bank_transfer','429188341',NULL,1,'2026-09-11 14:41:15','2026-09-18 14:41:15',0),(9003,9003,38940.00,'bank_transfer','428910255',NULL,1,'2026-09-04 14:41:15','2026-09-18 14:41:15',0);
/*!40000 ALTER TABLE `vendor_payouts` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendor_settlements`
--

DROP TABLE IF EXISTS `vendor_settlements`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendor_settlements` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
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
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  PRIMARY KEY (`id`),
  KEY `idx_vendor_settlements_vendor_id` (`vendor_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9012 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendor_settlements`
--

LOCK TABLES `vendor_settlements` WRITE;
/*!40000 ALTER TABLE `vendor_settlements` DISABLE KEYS */;
INSERT INTO `vendor_settlements` VALUES (9001,9001,'VS-9001','2026-09-09','2026-09-15',128,41680.00,7500.00,34180.00,0,'2026-09-18 14:41:15',0),(9002,9001,'VS-9002','2026-09-02','2026-09-08',151,50310.00,9050.00,41260.00,2,'2026-09-18 14:41:15',0),(9003,9001,'VS-9003','2026-08-26','2026-09-01',143,47490.00,8550.00,38940.00,2,'2026-09-18 14:41:15',0),(9011,9002,'VS-9011','2026-09-09','2026-09-15',64,18240.00,2736.00,15504.00,0,'2026-09-18 14:41:15',0);
/*!40000 ALTER TABLE `vendor_settlements` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vendors`
--

DROP TABLE IF EXISTS `vendors`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `vendors` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tenant_id` int(11) NOT NULL,
  `location_id` int(11) NOT NULL,
  `vendor_name` varchar(255) DEFAULT NULL,
  `store_category` varchar(20) DEFAULT NULL COMMENT 'food / grocery / fruit / bakery / meat',
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
  `is_busy` tinyint(1) NOT NULL DEFAULT 0 COMMENT '1 = busy mode, adds 10 min to prep estimates',
  `login_status` int(11) NOT NULL DEFAULT 0 COMMENT '0 allowed,1 blocked',
  `active_status` int(11) NOT NULL DEFAULT 1,
  `i_ts` datetime NOT NULL DEFAULT current_timestamp(),
  `d_in` tinyint(1) NOT NULL DEFAULT 0 COMMENT '0 active, 1 deleted',
  `rates_published_on` date DEFAULT NULL,
  `allow_substitution` tinyint(1) NOT NULL DEFAULT 1,
  PRIMARY KEY (`id`),
  KEY `idx_vendors_tenant_id` (`tenant_id`),
  KEY `idx_vendors_location_id` (`location_id`)
) ENGINE=InnoDB AUTO_INCREMENT=9007 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vendors`
--

LOCK TABLES `vendors` WRITE;
/*!40000 ALTER TABLE `vendors` DISABLE KEYS */;
INSERT INTO `vendors` VALUES (9001,1,9001,'Amma\'s Kitchen','food','VK-8841','9840721536',NULL,'orders@ammaskitchen.in','123456','14 2nd Avenue, Anna Nagar West, Chennai 600040','13.0850','80.2101','12419025000123','33AABCU9603R1ZX','GCC/TL/2024/88412',NULL,'AABCU9603R','public_app/restaurants/cat-biryani.png',NULL,NULL,NULL,'Amma Kitchen Foods','50100234514412','HDFC0000123','HDFC Bank',NULL,'05:30:00','07:30:00',NULL,18.00,4.60,1,1,0,0,1,'2026-09-18 14:41:14',0,NULL,1),(9002,1,9001,'Sri Balaji Stores','grocery','VK-7302','9840700001',NULL,'balaji.stores@example.in','123456','5 Sannathi Street, Anna Nagar East, Chennai 600102','13.0878','80.2213',NULL,'33AAKFS1234L1ZQ','GCC/TL/2023/41120',NULL,'AAKFS1234L','public_app/restaurants/cat-paneer.png',NULL,NULL,NULL,'Sri Balaji Stores','50100998804412','HDFC0000123','HDFC Bank',NULL,'07:00:00','22:00:00',NULL,15.00,4.50,1,1,0,0,1,'2026-09-18 14:41:14',0,NULL,1),(9003,1,9001,'Green Farm Mandi','fruit','VK-6120','9840700002',NULL,'greenfarm@example.in','123456','Shop 42, Koyambedu Market, Chennai 600107','13.0694','80.1948',NULL,NULL,NULL,NULL,NULL,'public_app/restaurants/cat-veg-plate.png',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'05:00:00','21:00:00',NULL,12.00,4.40,1,1,0,0,1,'2026-09-28 12:36:24',0,NULL,1),(9004,1,9001,'Anna Nagar Bakes','bakery','VK-5518','9840700003',NULL,'bakes@example.in','123456','9 Blue Star Road, Anna Nagar, Chennai 600040','13.0832','80.2168',NULL,NULL,NULL,NULL,NULL,'public_app/restaurants/cat-cakes.png',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'07:00:00','22:00:00',NULL,16.00,4.70,1,1,0,0,1,'2026-09-28 12:36:24',0,NULL,1),(9005,1,9001,'Marina Fresh Meats','meat','VK-4907','9840700004',NULL,'marinafresh@example.in','123456','3 Marina Beach Road, Triplicane, Chennai 600005','13.0569','80.2765',NULL,NULL,NULL,NULL,NULL,'public_app/restaurants/cat-meat-dishes.png',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,'06:00:00','13:00:00',NULL,14.00,4.50,1,1,0,0,1,'2026-09-28 12:36:24',0,NULL,1),(9006,1,9002,'Shenoy Paneer Kitchen','food','LOCAL-SHENOY-PANEER-9002',NULL,NULL,NULL,NULL,'12 Pulla Avenue, Shenoy Nagar, Chennai','13.0785','80.2210',NULL,NULL,NULL,NULL,NULL,'public_app/restaurants/cat-paneer.png',NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,NULL,0.00,4.50,0,1,0,0,1,'2026-10-06 11:31:17',0,NULL,1);
/*!40000 ALTER TABLE `vendors` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping events for database 'multivendor_db'
--

--
-- Dumping routines for database 'multivendor_db'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-07  9:21:16
