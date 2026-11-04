const path = require('path');
const fs = require('fs');

const usePublicUploads =
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.MV_UPLOADS_DIR || process.env.MV_UPLOADS_BASE_URL);
const legacyUploadsDir = path.join(__dirname, '../uploads');
const uploadsDir = process.env.MV_UPLOADS_DIR
    ? path.resolve(process.env.MV_UPLOADS_DIR)
    : usePublicUploads
        ? path.resolve(__dirname, '../../public_html/upload_files')
        : legacyUploadsDir;
const imageBaseUrl = process.env.MV_UPLOADS_BASE_URL
    ? process.env.MV_UPLOADS_BASE_URL.replace(/\/+$/, '')
    : usePublicUploads
        ? 'https://ekart360.in/upload_files'
        : null;

if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

module.exports = {
    uploadsDir,
    legacyUploadsDir,
    imageBaseUrl
};