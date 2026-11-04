const fs = require('fs');
const path = require('path');
const pool = require('../../config/dbconnect').MySQLConPool;

const tenantId = Number(process.env.MV_PUBLIC_TENANT_ID || 1);
const assetRoot = process.env.MVB_APP_ASSETS
  || path.resolve(__dirname, '../../../multivendor_public_app/src/assets/home');
const uploadsRoot = path.resolve(__dirname, '../../uploads/public_app');
const paneerImage = 'cat-paneer.png';

function copyAsset(folder) {
  const source = path.join(assetRoot, paneerImage);
  if (!fs.existsSync(source)) throw new Error(`Missing app asset: ${source}`);
  const destinationDirectory = path.join(uploadsRoot, folder);
  fs.mkdirSync(destinationDirectory, { recursive: true });
  fs.copyFileSync(source, path.join(destinationDirectory, paneerImage));
}

copyAsset('restaurants');
copyAsset('products');

const query = (sql, params = []) => new Promise((resolve, reject) => {
  pool.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
});

async function seed() {
  const location = (await query(
    'SELECT id,area,city,latitude,longitude FROM locations WHERE id=9002 AND tenant_id=? AND active_status=1 AND d_in=0',
    [tenantId],
  ))[0];
  const category = (await query(
    "SELECT id FROM categories WHERE id=9002 AND tenant_id=? AND category_name='Paneer' AND is_active=1 AND d_in=0",
    [tenantId],
  ))[0];
  const unit = (await query(
    "SELECT id FROM measurement_units WHERE unit_name='piece' AND is_active=1 LIMIT 1",
  ))[0];
  if (!location || !category || !unit) {
    throw new Error('Tenant 1 must have the active Shenoy Nagar location, Paneer category, and piece unit first.');
  }

  const uniqueCode = 'LOCAL-SHENOY-PANEER-9002';
  let vendor = (await query(
    'SELECT id FROM vendors WHERE tenant_id=? AND vendor_unique_code=? AND d_in=0 LIMIT 1',
    [tenantId, uniqueCode],
  ))[0];
  if (!vendor) {
    const result = await query(
      `INSERT INTO vendors
        (tenant_id,location_id,store_category,vendor_name,vendor_unique_code,
         vendor_address,latitude,longitude,shop_image,vendor_rating,is_online,active_status,d_in)
       VALUES (?,?,'food','Shenoy Paneer Kitchen',?,?,?,?,?,4.5,1,1,0)`,
      [tenantId, location.id, uniqueCode,
        `12 Pulla Avenue, ${location.area}, ${location.city}`,
        location.latitude, location.longitude,
        'public_app/restaurants/cat-paneer.png'],
    );
    vendor = { id: result.insertId };
  } else {
    await query(
      'UPDATE vendors SET location_id=?,store_category=\'food\',vendor_name=\'Shenoy Paneer Kitchen\',vendor_address=?,latitude=?,longitude=?,shop_image=\'public_app/restaurants/cat-paneer.png\',is_online=1,active_status=1,d_in=0 WHERE id=? AND tenant_id=?',
      [location.id, `12 Pulla Avenue, ${location.area}, ${location.city}`,
        location.latitude, location.longitude, vendor.id, tenantId],
    );
  }

  const products = [
    { code: 'LOCAL-SHENOY-PANEER-BUTTER-MASALA', name: 'Paneer Butter Masala', price: 220, description: 'Creamy tomato gravy with fresh paneer.', featured: 1 },
    { code: 'LOCAL-SHENOY-PANEER-TIKKA', name: 'Paneer Tikka', price: 190, description: 'Char-grilled paneer with peppers and spices.', featured: 0 },
  ];
  for (const product of products) {
    let row = (await query(
      'SELECT id FROM products WHERE vendor_id=? AND product_code=? AND d_in=0 LIMIT 1',
      [vendor.id, product.code],
    ))[0];
    if (!row) {
      const result = await query(
        `INSERT INTO products
          (vendor_id,category_id,product_name,product_code,description,base_price,
           stock_quantity,prep_minutes,is_veg,is_featured,is_available,active_status,d_in)
         VALUES (?,?,?,?,?,?,25,20,1,?,1,1,0)`,
        [vendor.id, category.id, product.name, product.code, product.description,
          product.price, product.featured],
      );
      row = { id: result.insertId };
    } else {
      await query(
        'UPDATE products SET category_id=?,product_name=?,description=?,base_price=?,stock_quantity=25,prep_minutes=20,is_veg=1,is_featured=?,is_available=1,active_status=1,d_in=0 WHERE id=? AND vendor_id=?',
        [category.id, product.name, product.description, product.price,
          product.featured, row.id, vendor.id],
      );
    }
    const image = (await query(
      'SELECT id FROM product_images WHERE product_id=? AND is_primary=1 ORDER BY id LIMIT 1',
      [row.id],
    ))[0];
    if (image) {
      await query(
        "UPDATE product_images SET image_path='public_app/products/cat-paneer.png',d_in=0 WHERE id=?",
        [image.id],
      );
    } else {
      await query(
        "INSERT INTO product_images (product_id,image_path,image_order,is_primary,d_in) VALUES (?,'public_app/products/cat-paneer.png',0,1,0)",
        [row.id],
      );
    }
    const variant = (await query(
      'SELECT id FROM product_variants WHERE product_id=? AND d_in=0 AND is_active=1 LIMIT 1',
      [row.id],
    ))[0];
    if (variant) {
      await query(
        "UPDATE product_variants SET measurement_unit_id=?,variant_name='Regular',quantity_value=NULL,price=?,discount_price=NULL,stock_quantity=25,is_default=1,is_active=1,d_in=0 WHERE id=?",
        [unit.id, product.price, variant.id],
      );
    } else {
      await query(
        "INSERT INTO product_variants (product_id,measurement_unit_id,variant_name,price,stock_quantity,is_default,is_active,d_in) VALUES (?,?,'Regular',?,25,1,1,0)",
        [row.id, unit.id, product.price],
      );
    }
  }

  console.log(`Local Paneer catalog ready for ${location.area}: ${vendor.id}, ${products.length} products.`);
}

seed().catch((error) => {
  console.error('Local Paneer catalog seed failed:', error.code || error.message);
  process.exitCode = 1;
}).finally(() => pool.end());
