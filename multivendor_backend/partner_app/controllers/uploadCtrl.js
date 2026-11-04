// Partner App - general image upload for either workspace.
var upload = require('../middleware/upload');

/**
 * POST /uploadimage  (multipart: photo)   vendor or delivery token
 *
 * Saves the image in the shared upload folder (production: public_html/upload_files,
 * so the URL is https://ekart360.in/upload_files/<file>) and answers with that URL.
 * It does not touch any table: the caller keeps the URL where it belongs.
 */
exports.uploadimage = function (req, res) {
    if (!req.file) return res.json({ status: 202, message: 'Attach a photo to upload.' });
    var url = upload.publicPath(req.file);
    // Locally the value is /uploads/<file>; make it usable by the app as it is.
    if (url.charAt(0) === '/') url = req.protocol + '://' + req.get('host') + url;
    return res.json({ status: 200, message: 'Image saved', url: url, filename: req.file.filename });
};
