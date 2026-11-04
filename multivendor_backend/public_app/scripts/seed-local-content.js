const fs = require('fs');
const path = require('path');
const mysql = require('mysql');
const appAssets = process.env.MVB_APP_ASSETS || 'C:/mvb/src/assets/home';
const uploads = path.join(__dirname, '..', '..', 'uploads', 'public_app');
const imageNames = ['cat-biryani.png','cat-paneer.png','cat-veg-plate.png','cat-meat-dishes.png','cat-snacks.png','cat-tiffins.png','cat-cakes.png','cat-sweets.png','cat-beverages.png','home-header.png','banner-green-eats.png','banner-food-delivery.png','banner-fresh-groceries.png','banner-fast-delivery.png'];
for (const dir of ['categories','restaurants','products','banners','onboarding']) fs.mkdirSync(path.join(uploads, dir), { recursive: true });
const categoryImages = {
  9001: ['Biryani','cat-biryani.png'], 9002: ['Paneer','cat-paneer.png'], 9003: ['Snacks','cat-snacks.png'],
  9004: ['Tiffins','cat-tiffins.png'], 9005: ['Sweets','cat-sweets.png'], 9029: ['Veg Plate','cat-veg-plate.png'],
  9030: ['Cakes','cat-cakes.png'], 9031: ['Meat Dishes','cat-meat-dishes.png'], 9032: ['Beverages','cat-beverages.png'],
};
const copyAsset = (name, folder) => { const src=path.join(appAssets,name); const dst=path.join(uploads,folder,name); if (!fs.existsSync(src)) throw new Error(`Missing app asset: ${src}`); fs.copyFileSync(src,dst); return `public_app/${folder}/${name}`; };
const copyOnboarding = (name) => { const src=path.join(path.dirname(appAssets),'onboarding',name); const dst=path.join(uploads,'onboarding',name); if (!fs.existsSync(src)) throw new Error(`Missing onboarding asset: ${src}`); fs.copyFileSync(src,dst); return `public_app/onboarding/${name}`; };
const catPath = {}; for (const [id, [,name]] of Object.entries(categoryImages)) catPath[id]=copyAsset(name,'categories');
const restaurantFiles=['cat-biryani.png','cat-paneer.png','cat-veg-plate.png','cat-cakes.png','cat-meat-dishes.png'];
for (const name of restaurantFiles) copyAsset(name,'restaurants');
for (const name of imageNames.slice(0,9)) copyAsset(name,'products');
copyAsset('home-header.png','banners');
for (const name of ['banner-food-delivery.png','banner-fresh-groceries.png','banner-fast-delivery.png']) copyAsset(name,'banners');
for (const name of ['onboarding-food-v3.png','onboarding-grocery-v3.png','onboarding-delivery-v3.png']) copyOnboarding(name);
const c = mysql.createConnection({host:'127.0.0.1', user:'root', password:'', database:'multivendor_db', multipleStatements:false});
const query = (sql, params=[]) => new Promise((resolve,reject)=>c.query(sql,params,(e,r)=>e?reject(e):resolve(r)));
(async()=>{
  try {
    await new Promise((resolve,reject)=>c.connect(e=>e?reject(e):resolve()));
    const wanted = Object.entries(categoryImages);
    await query('UPDATE categories SET parent_id=NULL, is_active=0 WHERE tenant_id=1 AND parent_id IS NULL');
    for (let i=0;i<wanted.length;i++) { const [id,[name,file]] = [wanted[i][0],wanted[i][1]]; await query('UPDATE categories SET parent_id=NULL, category_name=?, category_image=?, vertical=\'food\', category_order=?, is_active=1, d_in=0 WHERE id=? AND tenant_id=1',[name,catPath[id],i+1,id]); }
    await query('UPDATE categories SET parent_id=9001, is_active=1, d_in=0 WHERE id IN (9033,9034,9035,9036,9037) AND tenant_id=1');
    await query("UPDATE categories SET category_image='public_app/categories/cat-biryani.png' WHERE tenant_id=1 AND parent_id=9001 AND d_in=0");
    await query('UPDATE categories SET is_active=0, d_in=1 WHERE tenant_id=1 AND parent_id IS NOT NULL AND id NOT IN (9033,9034,9035,9036,9037)');
    const vendorImages = {9001:'cat-biryani.png',9002:'cat-paneer.png',9003:'cat-veg-plate.png',9004:'cat-cakes.png',9005:'cat-meat-dishes.png'};
    for (const [id,file] of Object.entries(vendorImages)) await query('UPDATE vendors SET shop_image=?, is_online=1, active_status=1 WHERE id=? AND tenant_id=1',[`public_app/restaurants/${file}`,id]);
    const products = await query('SELECT id,category_id FROM products WHERE d_in=0 AND active_status=1');
    const imageByCategory = {9001:'cat-biryani.png',9002:'cat-paneer.png',9003:'cat-snacks.png',9004:'cat-tiffins.png',9005:'cat-sweets.png',9029:'cat-veg-plate.png',9030:'cat-cakes.png',9031:'cat-meat-dishes.png',9032:'cat-beverages.png'};
    for (const p of products) { const file=imageByCategory[p.category_id] || 'cat-veg-plate.png'; const img=`public_app/products/${file}`; await query('UPDATE product_images SET d_in=1 WHERE product_id=?',[p.id]); await query('INSERT INTO product_images (product_id,image_path,image_order,is_primary,d_in) VALUES (?,?,0,1,0)',[p.id,img]); }
    // Checkout stores product variants in cart_items. Some local seed
    // products were created without a variant, which made the menu show an
    // ADD button but caused /me/cart/items to reject the product and orders
    // to fail with CART_EMPTY. Give those simple products one regular piece
    // variant; existing multi-variant products remain unchanged.
    await query(`
      INSERT INTO product_variants
        (product_id, measurement_unit_id, variant_name, price, discount_price,
         stock_quantity, is_default, is_active, d_in)
      SELECT p.id, mu.id, 'Regular', p.base_price, p.discount_price,
             p.stock_quantity, 1, 1, 0
      FROM products p
      JOIN measurement_units mu ON mu.unit_name='piece' AND mu.is_active=1
      LEFT JOIN product_variants pv
        ON pv.product_id=p.id AND pv.d_in=0 AND pv.is_active=1
      WHERE p.d_in=0 AND p.active_status=1 AND pv.id IS NULL
    `);
    await query('DELETE FROM banners WHERE tenant_id=1 AND placement IN (\'home_header\',\'home_promo\')');
    await query('INSERT INTO banners (tenant_id,banner_image,link_type,category_id,banner_order,is_active,d_in,placement,vertical,aspect_ratio,alt_text) VALUES (1,\'public_app/banners/home-header.png\',\'category\',9001,1,1,0,\'home_header\',\'food\',2.75,\'Fresh food delivered to your door\')');
    const promoBanners = [
      ['banner-food-delivery.png', 9001, 1, 'Fresh biryani delivered hot'],
      ['banner-fresh-groceries.png', 9004, 2, 'Fresh groceries at your door'],
      ['banner-fast-delivery.png', 9003, 3, 'Fast delivery, right on time'],
    ];
    for (const [file, categoryId, order, altText] of promoBanners) {
      await query('INSERT INTO banners (tenant_id,banner_image,link_type,category_id,banner_order,is_active,d_in,placement,vertical,aspect_ratio,alt_text) VALUES (1,?,?,?,?,1,0,\'home_promo\',\'food\',2.1,?)', [`public_app/banners/${file}`, 'category', categoryId, order, altText]);
    }
    const onboarding = { displayPolicy: 'first_use', slides: [
      {
        id: 'fresh-food', kind: 'image', title: 'Delicious choices, all in one place',
        headline: [{ text: 'Delicious choices,' }, { text: 'all in one place', bold: true }],
        mediaUrl: 'public_app/onboarding/onboarding-food-v3.png',
        altText: 'Fresh biryani and food ready to order',
      },
      {
        id: 'fresh-groceries', kind: 'image', title: 'Fresh essentials, delivered with care',
        headline: [{ text: 'Fresh essentials,' }, { text: 'delivered with care', bold: true }],
        mediaUrl: 'public_app/onboarding/onboarding-grocery-v3.png',
        altText: 'Fresh groceries packed for delivery',
      },
      {
        id: 'fast-delivery', kind: 'image', title: 'Fast delivery, right to your doorstep',
        headline: [{ text: 'Fast delivery,' }, { text: 'right to your doorstep', bold: true }],
        mediaUrl: 'public_app/onboarding/onboarding-delivery-v3.png',
        altText: 'Courier delivering an order by scooter',
      },
    ]};
    await query('INSERT INTO app_content (tenant_id,collection,draft_json,published_json,draft_revision,revision) VALUES (1,\'onboarding\',?,?,1,1) ON DUPLICATE KEY UPDATE draft_json=VALUES(draft_json),published_json=VALUES(published_json),draft_revision=1,revision=1',[JSON.stringify(onboarding),JSON.stringify(onboarding)]);
    console.log(JSON.stringify({categories:wanted.length,products:products.length,banners:promoBanners.length + 1,onboardingSlides:onboarding.slides.length,uploads},null,2));
  } catch(e) { console.error(e); process.exitCode=1; }
  finally { c.end(); }
})();
