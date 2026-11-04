const pool = require('../../config/dbconnect').MySQLConPool;

const tenantId = Number(process.env.MV_PUBLIC_TENANT_ID || 1);

const query = (sql, params = []) => new Promise((resolve, reject) => {
  pool.query(sql, params, (error, rows) => error ? reject(error) : resolve(rows));
});

async function disableRajahmundry() {
  const locations = await query(
    `SELECT id FROM locations
     WHERE tenant_id=? AND LOWER(city) IN ('rajahmundry','rajamahendravaram')`,
    [tenantId],
  );
  const locationIds = locations.map(location => location.id);

  if (!locationIds.length) {
    console.log(`No Rajahmundry location found for tenant ${tenantId}.`);
    return;
  }

  await query(
    'UPDATE vendors SET active_status=0,d_in=1 WHERE tenant_id=? AND location_id IN (?)',
    [tenantId, locationIds],
  );
  await query(
    'UPDATE delivery_partners SET active_status=0,d_in=1 WHERE tenant_id=? AND location_id IN (?)',
    [tenantId, locationIds],
  );
  await query(
    'UPDATE customer_addresses SET location_id=NULL WHERE location_id IN (?)',
    [locationIds],
  );
  await query(
    'UPDATE locations SET active_status=0,d_in=1 WHERE tenant_id=? AND id IN (?)',
    [tenantId, locationIds],
  );

  console.log(`Rajahmundry disabled locally for tenant ${tenantId} (location ids: ${locationIds.join(', ')}).`);
}

disableRajahmundry()
  .catch(error => {
    console.error('Disabling local Rajahmundry failed:', error.code || error.message);
    process.exitCode = 1;
  })
  .finally(() => pool.end());
