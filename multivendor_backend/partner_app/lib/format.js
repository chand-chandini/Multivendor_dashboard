// Partner App - row formatting helpers
// The mobile app receives view-ready JSON: epoch-millisecond timestamps, numbers
// (the mysql driver returns DECIMAL as strings), and labels like "₹1,48,930".

var MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
var DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function ms(value) {
    if (!value) return undefined;
    var t = new Date(value).getTime();
    return isNaN(t) ? undefined : t;
}

function num(value, fallback) {
    var n = Number(value);
    return isNaN(n) || value === null || value === undefined ? (fallback === undefined ? 0 : fallback) : n;
}

/** Indian digit grouping: 148930 -> "₹1,48,930". */
function inr(value) {
    var n = Math.round(Math.abs(num(value)));
    var s = String(n);
    var grouped = s.length <= 3 ? s : s.slice(0, -3).replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + s.slice(-3);
    return (num(value) < 0 ? '−' : '') + '₹' + grouped;
}

function dayMonth(value) {
    var d = new Date(value);
    return d.getDate() + ' ' + MONTHS[d.getMonth()];
}

/** "8–14 Sep" or "28 Aug–3 Sep" */
function rangeLabel(start, end) {
    var a = new Date(start), b = new Date(end);
    return a.getMonth() === b.getMonth() ? a.getDate() + '–' + dayMonth(b) : dayMonth(a) + '–' + dayMonth(b);
}

function dayName(value) {
    return DAYS[new Date(value).getDay()];
}

/** "18:00:00" -> "6:00 PM" */
function timeLabel(t) {
    if (!t) return '';
    var parts = String(t).split(':');
    var h = Number(parts[0]), m = parts[1] || '00';
    return (h % 12 === 0 ? 12 : h % 12) + ':' + m + ' ' + (h < 12 ? 'AM' : 'PM');
}

/** "6:00–11:00 PM" when both ends share AM/PM. */
function hoursLabel(open, close) {
    var a = timeLabel(open), b = timeLabel(close);
    if (!a || !b) return 'Hours not set';
    return a.slice(-2) === b.slice(-2) ? a.slice(0, -3) + '–' + b : a + '–' + b;
}

function initials(name) {
    return String(name || '')
        .replace(/[^A-Za-z\s]/g, '')
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map(function (p) { return p[0].toUpperCase(); })
        .join('');
}

/** Great-circle distance in km, one decimal. */
function km(lat1, lng1, lat2, lng2) {
    var a1 = num(lat1, NaN), o1 = num(lng1, NaN), a2 = num(lat2, NaN), o2 = num(lng2, NaN);
    if ([a1, o1, a2, o2].some(isNaN)) return 0;
    var R = 6371, rad = Math.PI / 180;
    var dLat = (a2 - a1) * rad, dLng = (o2 - o1) * rad;
    var h = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(a1 * rad) * Math.cos(a2 * rad) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
    return Math.round(R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h)) * 10) / 10;
}

/** "14/3 Plot 8, Nadar Street, Thiru Vi Ka Nagar, Chennai 600082" -> "Thiru Vi Ka Nagar" */
function areaFrom(address) {
    var parts = String(address || '').split(',').map(function (p) { return p.trim(); }).filter(Boolean);
    return parts.length >= 2 ? parts[parts.length - 2] : parts[0] || '';
}

/** "50100234514412" -> "••4412" */
function masked(account) {
    var s = String(account || '');
    return s ? '••' + s.slice(-4) : '';
}

/** "123412341234" -> "•••• •••• 1234". Already-masked values keep their last 4. */
function aadhaar(value) {
    var last = String(value || '').replace(/\D/g, '').slice(-4);
    return last ? '•••• •••• ' + last : '';
}

/** "ABCDE1234F" -> "ABCDE••34F" — the same shape the vendor documents use. */
function pan(value) {
    var s = String(value || '').trim();
    return s.length >= 8 ? s.slice(0, 5) + '••' + s.slice(-3) : s;
}

/** Short bank label: "HDFC Bank" + account -> "HDFC ••4412" */
function bankLabel(bankName, account, ifsc) {
    var short = String(bankName || '').split(' ')[0] || String(ifsc || '').slice(0, 4);
    return (short ? short + ' ' : '') + masked(account);
}

/** DB vertical -> app category. The schema calls fruits & vegetables "fruit". */
function category(vertical) {
    var v = String(vertical || 'food').toLowerCase();
    if (v === 'fruit' || v === 'fruits' || v === 'produce') return 'produce';
    return ['food', 'grocery', 'bakery', 'meat'].indexOf(v) >= 0 ? v : 'food';
}

function parseJson(text) {
    if (!text) return {};
    try { return JSON.parse(text) || {}; } catch (e) { return {}; }
}

/** orders.order_status -> app status. */
function orderStatus(code) {
    switch (num(code)) {
        case 0: return 'new';
        case 1:
        case 2: return 'cooking';
        case 7: return 'ready';
        case 3: return 'picked_up';
        case 4: return 'delivered';
        case 5: return 'cancelled';
        case 6: return 'rejected';
        default: return 'new';
    }
}

function randomCode(length) {
    var s = '';
    for (var i = 0; i < length; i++) s += Math.floor(Math.random() * 10);
    return s.charAt(0) === '0' ? '1' + s.slice(1) : s;
}

/**
 * True when a DATE/DATETIME falls on today. Daily decisions — the produce rate
 * sheet — are stored as the date they were made, so yesterday's publish must
 * not leave today's sheet looking live.
 */
function isToday(value) {
    if (!value) return false;
    var d = new Date(value);
    if (isNaN(d.getTime())) return false;
    var now = new Date();
    return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth() && d.getDate() === now.getDate();
}

module.exports = {
    ms: ms, num: num, inr: inr, dayMonth: dayMonth, rangeLabel: rangeLabel, dayName: dayName,
    timeLabel: timeLabel, hoursLabel: hoursLabel, initials: initials, km: km, areaFrom: areaFrom,
    masked: masked, aadhaar: aadhaar, pan: pan, bankLabel: bankLabel, category: category, parseJson: parseJson,
    orderStatus: orderStatus, randomCode: randomCode, isToday: isToday, DAYS: DAYS
};
