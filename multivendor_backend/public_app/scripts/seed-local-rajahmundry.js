const path = require('path');
const fs = require('fs');
const pool = require('../../config/dbconnect').MySQLConPool;

// Local development catalogue for the Rajahmundry service area. The script is
// idempotent, so it can be run again after rebuilding the local database.
const tenantId = Number(process.env.MV_PUBLIC_TENANT_ID || 1);
const locationId = 9004;
const uploadsRoot = path.resolve(__dirname, '../../uploads/public_app');
const restaurantImage = 'public_app/restaurants/cat-biryani.png';
const productImage = 'public_app/products/cat-biryani.png';

const restaurants = [
  {
    code: 'LOCAL-RAJAHMUNDRY-GODAVARI',
    name: 'Godavari Biryani House',
    address: '12 Main Road, Rajahmundry, Andhra Pradesh 533101',
    image: restaurantImage,
    categoryId: 9001,
    products: [
      ['LOCAL-RAJAHMUNDRY-GODAVARI-CHICKEN', 'Godavari Chicken Biryani', 260, 0],
      ['LOCAL-RAJAHMUNDRY-GODAVARI-PANEER', 'Paneer Biryani', 220, 1],
    ],
  },
  {
    code: 'LOCAL-RAJAHMUNDRY-TIFFINS',
    name: 'River Godavari Tiffins',
    address: '24 River Road, Rajahmundry, Andhra Pradesh 533101',
    image: 'public_app/restaurants/cat-paneer.png',
    categoryId: 9004,
    products: [
      ['LOCAL-RAJAHMUNDRY-TIFFINS-IDLI', 'Idli Sambar', 80, 1],
      ['LOCAL-RAJAHMUNDRY-TIFFINS-DOSA', 'Masala Dosa', 120, 1],
    ],
  },
  {
    code: 'LOCAL-RAJAHMUNDRY-VEG',
    name: 'Rajahmundry Veg Kitchen',
    address: '8 Market Street, Rajahmundry, Andhra Pradesh 533101',
    image: 'public_app/restaurants/cat-veg-plate.png',
    categoryId: 9029,
    products: [
      ['LOCAL-RAJAHMUNDRY-VEG-MEALS', 'Andhra Veg Meals', 180, 1],
      ['LOCAL-RAJAHMUNDRY-VEG-PANEER', 'Paneer Butter Masala', 210, 1],
    ],
  },
];

const query = (sql, params = []) => new Promise((resolve, reject) => {
  pool.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
});

async function ensureProduct(vendorId, categoryId, spec, unitId) {
  const [code, name, price, isVeg] = spec;
  let row = (await query(
    'SELECT id FROM products WHERE vendor_id=? AND product_code=? AND d_in=0 LIMIT 1',
    [vendorId, code],
  ))[0];
  if (!row) {
    const result = await query(
      `INSERT INTO products
        (vendor_id,category_id,product_name,product_code,description,base_price,
         stock_quantity,prep_minutes,is_veg,is_featured,is_available,active_status,d_in)
       VALUES (?,?,?,?,?,?,25,20,?,?,1,1,0)`,
      [vendorId, categoryId, name, code, `${name} prepared fresh in Rajahmundry.`, price, isVeg, 1],
    );
    row = { id: result.insertId };
  } else {
    await query(
      `UPDATE products SET category_id=?,product_name=?,description=?,base_price=?,
       stock_quantity=25,prep_minutes=20,is_veg=?,is_featured=1,is_available=1,
       active_status=1,d_in=0 WHERE id=? AND vendor_id=?`,
      [categoryId, name, `${name} prepared fresh in Rajahmundry.`, price, isVeg, row.id, vendorId],
    );
  }

  const image = (await query(
    'SELECT id FROM product_images WHERE product_id=? AND is_primary=1 AND d_in=0 LIMIT 1',
    [row.id],
  ))[0];
  if (image) await query('UPDATE product_images SET image_path=?,d_in=0 WHERE id=?', [productImage, image.id]);
  else await query('INSERT INTO product_images (product_id,image_path,image_order,is_primary,d_in) VALUES (?, ?, 0, 1, 0)', [row.id, productImage]);

  const variant = (await query(
    'SELECT id FROM product_variants WHERE product_id=? AND d_in=0 AND is_active=1 LIMIT 1',
    [row.id],
  ))[0];
  if (variant) {
    await query(
      `UPDATE product_variants SET measurement_unit_id=?,variant_name='Regular',
       price=?,discount_price=NULL,stock_quantity=25,is_default=1,is_active=1,d_in=0
       WHERE id=?`,
      [unitId, price, variant.id],
    );
  } else {
    await query(
      `INSERT INTO product_variants
        (product_id,measurement_unit_id,variant_name,price,stock_quantity,is_default,is_active,d_in)
       VALUES (?,?,'Regular',?,25,1,1,0)`,
      [row.id, unitId, price],
    );
  }
}

async function seed() {
  const location = (await query(
    'SELECT id,city,latitude,longitude FROM locations WHERE id=? AND tenant_id=? AND active_status=1 AND d_in=0',
    [locationId, tenantId],
  ))[0];
  const unit = (await query("SELECT id FROM measurement_units WHERE unit_name='piece' AND is_active=1 LIMIT 1"))[0];
  if (!location || !unit) throw new Error('Rajahmundry location or piece measurement unit is missing.');

  for (const item of restaurants) {
    let vendor = (await query(
      'SELECT id FROM vendors WHERE tenant_id=? AND vendor_unique_code=? AND d_in=0 LIMIT 1',
      [tenantId, item.code],
    ))[0];
    if (!vendor) {
      const result = await query(
        `INSERT INTO vendors
          (tenant_id,location_id,store_category,vendor_name,vendor_unique_code,
           vendor_address,latitude,longitude,shop_image,vendor_rating,is_online,active_status,d_in)
         VALUES (?,?,'food',?,?,?,?,?,?,4.5,1,1,0)`,
        [tenantId, location.id, item.name, item.code, item.address, location.latitude, location.longitude, item.image],
      );
      vendor = { id: result.insertId };
    } else {
      await query(
        `UPDATE vendors SET location_id=?,store_category='food',vendor_name=?,vendor_address=?,
         latitude=?,longitude=?,shop_image=?,vendor_rating=4.5,is_online=1,active_status=1,d_in=0
         WHERE id=? AND tenant_id=?`,
        [location.id, item.name, item.address, location.latitude, location.longitude, item.image, vendor.id, tenantId],
      );
    }
    for (const product of item.products) await ensureProduct(vendor.id, item.categoryId, product, unit.id);
  }

  console.log(`Rajahmundry local catalogue ready: ${restaurants.length} restaurants.`);
}

if (process.env.MV_ENABLE_RAJAHMUNDRY_LOCAL === '1') {
  seed().catch(error => {
    console.error('Rajahmundry local catalogue seed failed:', error.code || error.message);
    process.exitCode = 1;
  }).finally(() => pool.end());
} else {
  console.log('Rajahmundry local catalogue seed is disabled. Set MV_ENABLE_RAJAHMUNDRY_LOCAL=1 to enable it temporarily.');
  pool.end();
}
