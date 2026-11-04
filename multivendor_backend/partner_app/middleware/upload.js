// Partner App - image uploads (delivery proof, product photos).
//
// Uses the same upload folder and public URL as the admin dashboard
// (dashboard_api/uploadPath.js), so one convention covers every image:
//   * in production (NODE_ENV=production, or MV_UPLOADS_DIR / MV_UPLOADS_BASE_URL
//     set) files are written flat into ../../public_html/upload_files and the
//     stored value is the full URL, https://ekart360.in/upload_files/<file>;
//   * locally they go into <repo>/uploads, which app.js serves at /uploads, and
//     the stored value is /uploads/<file>.
// The columns that hold them (product_images.image_path,
// delivery_assignments.proof_photo) store that URL, and the dashboard reads the
// same value. Files written by older versions sit in uploads/partner_app/ and
// are still found there.

var fs = require('fs');
var path = require('path');
var multer = require('multer');
var uploadPaths = require('../../dashboard_api/uploadPath');

var MAX_BYTES = 8 * 1024 * 1024; // a phone photo, not a raw camera file
var LEGACY_FOLDER = 'partner_app'; // where this app saved files before the shared folder

function uploadDir() {
    return uploadPaths.uploadsDir;
}

var ALLOWED = {
    'image/jpeg': '.jpg',
    'image/jpg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
    'image/heic': '.heic'
};

var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDir());
    },
    filename: function (req, file, cb) {
        // Never trust the client's filename: build our own from the caller and
        // a random suffix, so one upload cannot overwrite another or escape the
        // folder with a crafted name.
        var ext = ALLOWED[String(file.mimetype).toLowerCase()] || '.jpg';
        var who = (req.partner ? req.partner.role + '-' + req.partner.id : 'anon');
        var unique = Date.now().toString(36) + '-' + Math.random().toString(36).slice(2, 10);
        cb(null, who + '-' + unique + ext);
    }
});

function fileFilter(req, file, cb) {
    if (!ALLOWED[String(file.mimetype).toLowerCase()]) {
        return cb(new Error('Only JPG, PNG, WEBP or HEIC images can be uploaded.'));
    }
    cb(null, true);
}

var uploader = multer({ storage: storage, limits: { fileSize: MAX_BYTES, files: 1 }, fileFilter: fileFilter });
// Kept for callers that want the bytes in memory (req.file.buffer) instead of on disk.
var memoryUploader = multer({ storage: multer.memoryStorage(), limits: { fileSize: MAX_BYTES, files: 1 }, fileFilter: fileFilter });

/**
 * Accepts one image on the `photo` field and answers in the app's envelope
 * instead of letting multer's error reach the generic handler.
 */
function single(field, toMemory) {
    var run = (toMemory ? memoryUploader : uploader).single(field || 'photo');
    return function (req, res, next) {
        run(req, res, function (err) {
            if (err) {
                var message = err.code === 'LIMIT_FILE_SIZE'
                    ? 'That image is too large. Keep it under 8 MB.'
                    : (err.message || 'That image could not be uploaded.');
                return res.json({ status: 202, message: message });
            }
            next();
        });
    };
}

/** Same as single(), but the file stays in memory instead of being written to disk. */
function singleInMemory(field) {
    return single(field, true);
}

/** The value stored in the database and served back to the app: a URL, as the dashboard stores them. */
function publicPath(file) {
    return (uploadPaths.imageBaseUrl || '/uploads') + '/' + file.filename;
}

/** Deletes a previously stored upload; used when a photo is replaced. */
function removeStored(storedPath) {
    if (!storedPath) return;
    var name = path.basename(String(storedPath).split('?')[0]);
    if (!name) return;
    // The shared folder first, then the folder older versions of this app used.
    var folders = [uploadDir(), path.join(uploadPaths.legacyUploadsDir, LEGACY_FOLDER)];
    folders.forEach(function (folder) {
        var full = path.join(folder, name);
        // Only ever removes a file inside one of our own upload folders.
        if (path.dirname(full) !== path.resolve(folder)) return;
        fs.unlink(full, function () { });
    });
}

module.exports = { single: single, singleInMemory: singleInMemory, publicPath: publicPath, removeStored: removeStored, MAX_BYTES: MAX_BYTES };
