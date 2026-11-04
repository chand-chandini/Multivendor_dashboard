const fs = require('fs');
const path = require('path');
const pool = require('../../config/dbconnect').MySQLConPool;

const tenantId = Number(process.env.MV_PUBLIC_TENANT_ID || 1);
const appAssets = process.env.MVB_APP_ASSETS
  || path.resolve(__dirname, '../../../multivendor_public_app/src/assets');
const sourceImage = path.join(appAssets, 'onboarding', 'grocery.png');
const uploadDir = path.resolve(__dirname, '../../uploads/public_app/categories');
const imagePath = 'public_app/categories/category-grocery.png';

async function main() {
  if (!fs.existsSync(sourceImage)) throw new Error(`Missing category artwork: ${sourceImage}`);
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.copyFileSync(sourceImage, path.join(uploadDir, 'category-grocery.png'));

  const query = (sql, params) => new Promise((resolve, reject) => {
    pool.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
  });
  await query(
    `UPDATE categories
     SET is_active=1,d_in=0,vertical='grocery',category_image=?
     WHERE tenant_id=? AND id IN (9011,9012,9013) AND parent_id IS NULL`,
    [imagePath, tenantId],
  );
  await query(
    `UPDATE categories
     SET is_active=1,d_in=0,vertical='grocery',category_image=?
     WHERE tenant_id=? AND id BETWEEN 9021 AND 9028 AND parent_id IN (9011,9012,9013)`,
    [imagePath, tenantId],
  );
  console.log('Local Grocery main categories and subcategories are active.');
}

main()
  .catch(error => { console.error('Local category seed failed:', error.code || error.message); process.exitCode = 1; })
  .finally(() => pool.end());
