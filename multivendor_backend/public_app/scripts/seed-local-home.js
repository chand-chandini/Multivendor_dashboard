const fs = require('fs');
const path = require('path');
const pool = require('../../config/dbconnect').MySQLConPool;

const tenantId = Number(process.env.MV_PUBLIC_TENANT_ID || 1);
const appAssets = process.env.MVB_APP_ASSETS
  || path.resolve(__dirname, '../../../multivendor_public_app/src/assets/home');
const bannerUploads = path.resolve(__dirname, '../../uploads/public_app/banners');
const tabImages = ['tab-food.png', 'tab-grocery.png'];

for (const file of tabImages) {
  const source = path.join(appAssets, file);
  if (!fs.existsSync(source)) throw new Error(`Missing app asset: ${source}`);
  fs.mkdirSync(bannerUploads, { recursive: true });
  fs.copyFileSync(source, path.join(bannerUploads, file));
}

const home = {
  tabs: [
    { id: 'food', label: 'Food', imageUrl: 'public_app/banners/tab-food.png' },
    { id: 'grocery', label: 'Grocery', imageUrl: 'public_app/banners/tab-grocery.png' },
  ],
  filters: [
    { id: 'filter', label: 'Filter' },
    { id: 'veg', label: 'Veg' },
    { id: 'non-veg', label: 'Non-Veg' },
    { id: 'best-seller', label: 'Best Seller' },
    { id: 'rating', label: '+Rating 4.0' },
  ],
};
const json = JSON.stringify(home);

pool.query(
  `INSERT INTO app_content
    (tenant_id, collection, draft_json, published_json, draft_revision, revision)
   VALUES (?, 'home', ?, ?, 1, 1)
   ON DUPLICATE KEY UPDATE
     draft_json=VALUES(draft_json), published_json=VALUES(published_json),
     draft_revision=GREATEST(draft_revision, 1), revision=GREATEST(revision, 1)`,
  [tenantId, json, json],
  (error) => {
    pool.end();
    if (error) {
      console.error('Local home content seed failed:', error.code || error.message);
      process.exitCode = 1;
      return;
    }
    console.log(`Local home content ready for tenant ${tenantId}.`);
  },
);
