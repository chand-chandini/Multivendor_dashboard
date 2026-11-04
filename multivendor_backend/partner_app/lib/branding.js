// Partner App - tenant branding for the mobile app.
//
// The colours are the ones the tenant picks in the admin dashboard, stored in
// `tenant_branding`. One row per workspace:
//
//   brand_scope = 'vendor_app'    the vendor side's colour
//   brand_scope = 'delivery_app'  the delivery partner side's colour
//   brand_scope = 'partner_app'   used for both when a workspace row is missing
//
// Column mapping, which is what the dashboard's colour pickers write:
//   primary_color    the workspace accent - buttons, selected chips, hero cards
//   secondary_color  the soft fill behind tiles, active tab pill and soft pills
//   button_color     button fill, when it should differ from the accent
//   header_color     the app background; the app's own cream is used if unset
//   logo_light/dark/icon, login_bg_image  image URLs the app may show
//   font_family      ignored: the app ships Inter as a bundled font
//   sidebar_color, custom_css  dashboard-only, ignored here
//
// Anything not set falls back to the app's built-in palette, so a tenant that
// never opens the branding screen still gets a complete theme.

var db = require('./db');
var colour = require('./colour');

var SCOPES = { vendor: 'vendor_app', delivery: 'delivery_app' };

function imageUrl(value) {
    var s = String(value || '').trim();
    return s ? s : null;
}

function themeFrom(row) {
    if (!row) return null;
    var shades = colour.shades(row.primary_color, row.secondary_color);
    if (!shades) return null;
    var button = colour.parse(row.button_color);
    return {
        accent: shades.accent,
        accentDeep: shades.accentDeep,
        onAccent: shades.onAccent,
        soft: shades.soft,
        onSoft: shades.onSoft,
        line: shades.line,
        wash: shades.wash,
        button: button ? colour.hex(button) : shades.accent,
        background: colour.parse(row.header_color) ? colour.hex(colour.parse(row.header_color)) : null,
        logo: imageUrl(row.logo_light),
        logoDark: imageUrl(row.logo_dark),
        icon: imageUrl(row.logo_icon),
        loginBackground: imageUrl(row.login_bg_image)
    };
}

/**
 * Both workspaces' themes for a tenant. Null entries mean "no colour picked",
 * and the app keeps its own palette for that side.
 */
async function load(tenantId) {
    if (!tenantId) return { vendor: null, delivery: null };
    var rows = await db.query(
        "SELECT * FROM tenant_branding WHERE tenant_id = ? AND d_in = 0 AND brand_scope IN ('vendor_app','delivery_app','partner_app')",
        [tenantId], 'branding-load');
    var byScope = {};
    rows.forEach(function (r) { byScope[r.brand_scope] = r; });
    var shared = byScope.partner_app;
    return {
        vendor: themeFrom(byScope[SCOPES.vendor] || shared),
        delivery: themeFrom(byScope[SCOPES.delivery] || shared)
    };
}

/**
 * The tenant to theme the sign-in screen with, before anyone has signed in.
 * A single-tenant install needs no hint; otherwise the caller passes ?tenant=.
 */
async function resolveTenant(requested) {
    var id = parseInt(requested, 10);
    if (id > 0) return id;
    var rows = await db.query('SELECT id FROM tenants WHERE d_in = 0 AND active_status = 1 LIMIT 2', [], 'branding-tenant');
    return rows.length === 1 ? rows[0].id : null;
}

module.exports = { load: load, resolveTenant: resolveTenant, SCOPES: SCOPES };
