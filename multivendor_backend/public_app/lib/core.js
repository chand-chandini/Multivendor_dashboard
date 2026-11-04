const crypto = require('crypto');
const db = require('./db');
class ApiError extends Error {
    constructor(status, code, message) { super(message); this.status = status; this.code = code; }
}
const fail = (status, code, message) => { throw new ApiError(status, code, message); };
const handle = fn => (req, res, next) => Promise.resolve(fn(req, res)).catch(next);
const id = value => { if (!/^\d+$/.test(String(value || ''))) fail(400, 'INVALID_ID', 'A valid ID is required.'); return Number(value); };
const money = value => Math.round(Number(value || 0) * 100);
const text = (value, limit = 1000) => String(value || '').trim().slice(0, limit);
const json = (value, fallback) => { try { return JSON.parse(value); } catch (_) { return fallback; } };
const uuid = () => crypto.randomBytes(24).toString('hex');
const hash = value => crypto.createHash('sha256').update(String(value)).digest('hex');
function coordinates(source) {
    const latitude = Number(source.latitude), longitude = Number(source.longitude);
    if (source.latitude === undefined || source.longitude === undefined || !Number.isFinite(latitude) || !Number.isFinite(longitude) || latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) fail(400, 'INVALID_COORDINATES', 'Valid latitude and longitude are required.');
    return { latitude, longitude };
}
function distance(a, b) {
    const rad = n => Number(n) * Math.PI / 180;
    const dlat = rad(b.latitude) - rad(a.latitude), dlng = rad(b.longitude) - rad(a.longitude);
    const h = Math.sin(dlat / 2) ** 2 + Math.cos(rad(a.latitude)) * Math.cos(rad(b.latitude)) * Math.sin(dlng / 2) ** 2;
    return 6371 * 2 * Math.asin(Math.min(1, Math.sqrt(h)));
}
async function tenant(req, res, next) {
    try {
        const code = req.headers['x-tenant-code'] || process.env.MV_PUBLIC_TENANT_CODE;
        let row;
        if (code) row = await db.one('SELECT * FROM tenants WHERE tenant_unique_code=? AND d_in=0', [code]);
        else if (process.env.MV_PUBLIC_TENANT_ID) row = await db.one('SELECT * FROM tenants WHERE id=? AND d_in=0', [id(process.env.MV_PUBLIC_TENANT_ID)]);
        else {
            const rows = await db.query('SELECT * FROM tenants WHERE d_in=0 LIMIT 2');
            if (rows.length === 1) row = rows[0];
        }
        if (!row) fail(400, 'TENANT_REQUIRED', 'Configure a valid customer app tenant.');
        if (row.active_status !== undefined && Number(row.active_status) !== 1) fail(403, 'TENANT_INACTIVE', 'This service is currently unavailable.');
        req.tenant = row; next();
    } catch (error) { next(error); }
}
function media(req, value) {
    if (!value) return null;
    if (/^(https?:\/\/|data:image\/)/.test(value)) return value;
    const base = process.env.MV_PUBLIC_ORIGIN || `${req.protocol}://${req.get('host')}`;
    return base + '/uploads/' + String(value).replace(/^\/?uploads\//, '').replace(/^\//, '');
}
function errorHandler(error, req, res, next) {
    if (res.headersSent) return next(error);
    if (!(error instanceof ApiError)) console.error('[public_app]', req.method, req.path, error.sqlMessage || error.message || error.code || error.name);
    res.status(error.status || 500).json({ error: { code: error.code && error.status ? error.code : 'SERVER_ERROR', message: error.status ? error.message : 'The service could not complete your request.' } });
}
module.exports = { ApiError, fail, handle, id, money, text, json, uuid, hash, coordinates, distance, tenant, media, errorHandler };
