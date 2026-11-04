const pool = require('../../config/dbconnect').MySQLConPool;

const tenantId = Number(process.env.MV_PUBLIC_TENANT_ID || 1);
const rajahmundry = {
  city: 'Rajahmundry',
  area: 'Rajahmundry',
  pincode: '533101',
  state: 'Andhra Pradesh',
  country: 'India',
  latitude: '17.0005',
  longitude: '81.8040',
  maxDeliveryKm: 15,
};

const query = (sql, params = []) => new Promise((resolve, reject) => {
  pool.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
});

async function seed() {
  const existing = (await query(
    `SELECT id FROM locations
     WHERE tenant_id=? AND LOWER(city) IN ('rajahmundry','rajamahendravaram')
     ORDER BY id LIMIT 1`,
    [tenantId],
  ))[0];

  if (existing) {
    await query(
      `UPDATE locations
       SET city=?,area=?,pincode=?,state=?,country=?,latitude=?,longitude=?,
           max_delivery_service_km=?,active_status=1,d_in=0
       WHERE id=? AND tenant_id=?`,
      [rajahmundry.city, rajahmundry.area, rajahmundry.pincode, rajahmundry.state,
        rajahmundry.country, rajahmundry.latitude, rajahmundry.longitude,
        rajahmundry.maxDeliveryKm, existing.id, tenantId],
    );
    console.log(`Rajahmundry delivery area refreshed (id ${existing.id}, tenant ${tenantId}).`);
    return;
  }

  const result = await query(
    `INSERT INTO locations
       (tenant_id,city,area,pincode,state,country,latitude,longitude,
        max_delivery_service_km,active_status,d_in)
     VALUES (?,?,?,?,?,?,?,?,?,1,0)`,
    [tenantId, rajahmundry.city, rajahmundry.area, rajahmundry.pincode,
      rajahmundry.state, rajahmundry.country, rajahmundry.latitude,
      rajahmundry.longitude, rajahmundry.maxDeliveryKm],
  );
  console.log(`Rajahmundry delivery area added (id ${result.insertId}, tenant ${tenantId}).`);
}

if (process.env.MV_ENABLE_RAJAHMUNDRY_LOCAL === '1') {
  seed()
    .catch(error => { console.error('Rajahmundry seed failed:', error.code || error.message); process.exitCode = 1; })
    .finally(() => pool.end());
} else {
  console.log('Rajahmundry local seed is disabled. Set MV_ENABLE_RAJAHMUNDRY_LOCAL=1 to enable it temporarily.');
  pool.end();
}
