const fs = require('fs');
const path = require('path');
const db = require('../lib/db');
const pool = require('../../config/dbconnect').MySQLConPool;
const additions = {
    customer_addresses: { recipient_name: 'varchar(150) NULL', recipient_phone: 'varchar(20) NULL', location_id: 'int NULL' },
    orders: {
        address_snapshot: 'longtext NULL', bill_snapshot: 'longtext NULL', instruction_snapshot: 'longtext NULL',
        scheduled_for: 'datetime NULL',
        packing_charges: 'decimal(10,2) NOT NULL DEFAULT 0.00', tip_amount: 'decimal(10,2) NOT NULL DEFAULT 0.00',
        prep_minutes: 'int NULL', accepted_at: 'datetime NULL', ready_at: 'datetime NULL', picked_up_at: 'datetime NULL',
        handover_code: 'varchar(10) NULL', delivery_otp: 'varchar(10) NULL', parcel_count: 'int NOT NULL DEFAULT 1'
    },
    banners: { location_id: 'int NULL', placement: "varchar(30) NOT NULL DEFAULT 'home_promo'", category_id: 'int NULL', subcategory_id: 'int NULL', vertical: 'varchar(50) NULL', aspect_ratio: 'decimal(6,3) NULL', alt_text: 'varchar(255) NULL' },
    customer_devices: { device_id: 'varchar(150) NULL' },
    tenant_charge_settings: { cod_enabled: 'tinyint NOT NULL DEFAULT 1' }
};
async function main() {
    const sql = fs.readFileSync(path.join(__dirname, '../../database/migration_public_app.sql'), 'utf8');
    await db.query(sql);
    for (const [table, columns] of Object.entries(additions)) {
        for (const [column, definition] of Object.entries(columns)) {
            const existing = await db.one('SELECT COLUMN_NAME FROM information_schema.COLUMNS WHERE TABLE_SCHEMA=DATABASE() AND TABLE_NAME=? AND COLUMN_NAME=?', [table, column]);
            if (!existing) await db.query(`ALTER TABLE \`${table}\` ADD COLUMN \`${column}\` ${definition}`);
        }
    }
    console.log('Customer API migrations complete.');
}
if (require.main === module) {
    main()
        .catch(error => { console.error('Migration failed:', error.code || error.message); process.exitCode = 1; })
        .finally(() => pool.end());
}

module.exports = { main, additions };
