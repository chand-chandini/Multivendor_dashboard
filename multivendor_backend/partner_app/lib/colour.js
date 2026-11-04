// Partner App - colour helpers
// The admin picks one colour per workspace; the shades the app needs around it
// (text on a tinted card, the soft tile fill, borders) are derived here so the
// app does no colour maths of its own.

/** "#1d4ed8" / "#1D4" -> { r, g, b }, or null when it isn't a hex colour. */
function parse(value) {
    var hex = String(value || '').trim();
    if (!/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.test(hex)) return null;
    hex = hex.replace('#', '');
    if (hex.length === 3) hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    return {
        r: parseInt(hex.slice(0, 2), 16),
        g: parseInt(hex.slice(2, 4), 16),
        b: parseInt(hex.slice(4, 6), 16)
    };
}

function hex(rgb) {
    var part = function (n) { return Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0'); };
    return '#' + part(rgb.r) + part(rgb.g) + part(rgb.b);
}

/** amount 0 = colour, 1 = target. */
function mix(rgb, target, amount) {
    return {
        r: rgb.r + (target.r - rgb.r) * amount,
        g: rgb.g + (target.g - rgb.g) * amount,
        b: rgb.b + (target.b - rgb.b) * amount
    };
}

var WHITE = { r: 255, g: 255, b: 255 };
var BLACK = { r: 0, g: 0, b: 0 };

/** Relative luminance (WCAG), used to decide whether labels on the colour are light or dark. */
function luminance(rgb) {
    var channel = function (c) {
        var v = c / 255;
        return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    };
    return 0.2126 * channel(rgb.r) + 0.7152 * channel(rgb.g) + 0.0722 * channel(rgb.b);
}

/** The set of shades the app's role theme needs, derived from one picked colour. */
function shades(value, softValue) {
    var base = parse(value);
    if (!base) return null;
    var soft = parse(softValue) || mix(base, WHITE, 0.84);
    return {
        accent: hex(base),
        accentDeep: hex(mix(base, BLACK, 0.35)),
        onAccent: luminance(base) > 0.45 ? '#201E1D' : '#FFFFFF',
        soft: hex(soft),
        onSoft: luminance(soft) > 0.45 ? hex(mix(base, BLACK, 0.45)) : '#FFFFFF',
        line: hex(mix(base, WHITE, 0.62)),
        wash: hex(mix(base, WHITE, 0.93))
    };
}

module.exports = { parse: parse, hex: hex, mix: mix, luminance: luminance, shades: shades };
