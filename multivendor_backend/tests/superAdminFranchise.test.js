jest.mock('../config/dbconnect', () => ({ MySQLConPool: {} }));

const express = require('express');
const request = require('supertest');
const jwt = require('jsonwebtoken');
const path = require('path');
const dbutil = require('../utils/dbutils');

global.appRoot = path.resolve(__dirname, '..');
const app = express();
app.use(express.json());
app.use('/super_admin', require('../super_admin/routes/routes'));

const secret = process.env.MV_ADMIN_JWT_SECRET || 'mv-superadmin-dev-secret';
const token = jwt.sign({ admin_id: 1, admin_type: 1 }, secret);

afterEach(() => jest.restoreAllMocks());

test('super-admin franchise route returns active franchises with tenant names', async () => {
    const row = { id: 21, tenant_id: 4, tenant_name: 'YY', franchise_name: 'YY Franchise' };
    const query = jest.spyOn(dbutil, 'sqlinjection').mockImplementation((pool, sql, params, label, callback) => {
        expect(sql).toContain('FROM franchises f LEFT JOIN tenants t ON t.id = f.tenant_id');
        expect(sql).toContain('IFNULL(f.d_in,0) = 0');
        expect(label).toBe('getfranchises');
        return callback(null, [row]);
    });

    const response = await request(app)
        .get('/super_admin/getfranchises')
        .set('Authorization', 'Bearer ' + token);

    expect(response.body).toEqual({ status: 200, data: [row] });
    expect(query).toHaveBeenCalledTimes(1);
});
