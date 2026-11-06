var express = require('express');
var router = express.Router();
var mainCtrl = require('../controllers/mainCtrl');
var franchiseCtrl = require('../controllers/franchiseCtrl');
var appContentCtrl = require('../controllers/appContentCtrl');
var authMiddleware = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { uploadsDir } = require('../uploadPath');
// Tenant feature entitlement — see utils/entitlements.js
// var requireFeature = require('../../utils/requireFeature');




const locationStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = 'location_' + Date.now() + extension;
        cb(null, filename);
    }
});

const uploadLocationImage = multer({
    storage: locationStorage
});
const shopItemStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = 'shop_item_' + Date.now() + extension;
        cb(null, filename);
    }
});

const uploadShopItemImage = multer({
    storage: shopItemStorage
});
const deliveryPartnerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename =
            'delivery_partner_' +
            file.fieldname +
            '_' +
            Date.now() +
            extension;

        cb(null, filename);
    }
});

const uploadDeliveryPartnerImages = multer({
    storage: deliveryPartnerStorage,
    limits: { fileSize: 8 * 1024 * 1024, files: 4 }
});
function deliveryPartnerUploadError(err, req, res, next) {
    if (!err) return next();
    var field = err.field || 'aadhar_image';
    var message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Document image must be no larger than 8 MiB.'
        : 'Choose one supported image for each document field.';
    return res.json({ status: 202, message: message, errors: { [field]: message } });
}
// --- ADD THIS BLOCK ---
const franchiseStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = 'franchise_' + file.fieldname + '_' + Date.now() + extension;
        cb(null, filename);
    }
});

const uploadFranchiseImages = multer({
    storage: franchiseStorage,
    limits: { fileSize: 8 * 1024 * 1024, files: 3 }
});

function franchiseUploadError(err, req, res, next) {
    if (!err) return next();
    var field = err.field || 'bank_image';
    var message = err.code === 'LIMIT_FILE_SIZE'
        ? 'Document image must be no larger than 8 MiB.'
        : 'Choose one supported image for each document field.';
    return res.json({ status: 202, message: message, errors: { [field]: message } });
}

const devSupportStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = 'dev_support_' + Date.now() + extension;
        cb(null, filename);
    }
});

const uploadDevSupportImage = multer({
    storage: devSupportStorage
});
const bannerStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = 'banner_' + Date.now() + extension;
        cb(null, filename);
    }
});
const uploadBannerImage = multer({
    storage: bannerStorage
});
const vendorStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);

        const filename =
            'vendor_' +
            file.fieldname +
            '_' +
            Date.now() +
            extension;

        cb(null, filename);
    }
});

const uploadVendorImages = multer({
    storage: vendorStorage
});
const categoryStorage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        const extension = path.extname(file.originalname);
        const filename = 'category_' + Date.now() + extension;
        cb(null, filename);
    }
});

const uploadCategoryImage = multer({
    storage: categoryStorage
});
// Public route (no JWT required)
router.post('/getUserData', mainCtrl.getUserData);
// Login-page branding, resolved from the host the dashboard is served on
router.get('/getloginbranding', mainCtrl.getloginbranding);

// Protected routes (JWT required)

// Auth / Users
router.post('/getmodulelistdetails', authMiddleware, mainCtrl.getmodulelistdetails);
router.post('/submituserslogin', authMiddleware, mainCtrl.submituserslogin);
router.get('/getuserlist', authMiddleware, mainCtrl.getuserlist);
router.post('/getupdatemodules', authMiddleware, mainCtrl.getupdatemodules);
router.post('/deleteuser', authMiddleware, mainCtrl.deleteuser);
router.post('/postusermenulist', authMiddleware, mainCtrl.postusermenulist);
router.post('/getusersprofile', authMiddleware, mainCtrl.getusersprofile);
router.post('/updatetheme', authMiddleware, mainCtrl.updatetheme);
router.post('/updatelogo', authMiddleware, mainCtrl.updatelogo);
router.post('/updateuserpassword', authMiddleware, mainCtrl.updateuserpassword);
router.get('/getmasterdata1', authMiddleware, mainCtrl.getmasterdata1);

// Franchise administration: JWT plus database-backed action permissions.
router.get('/getfranchises', authMiddleware, franchiseCtrl.getfranchises);
router.post(
    '/addfranchise', 
    authMiddleware, 
    uploadFranchiseImages.fields([
        { name: 'bank_image', maxCount: 1 },
        { name: 'aadhar_image', maxCount: 1 },
        { name: 'pan_image', maxCount: 1 }
    ]), 
    franchiseUploadError,
    franchiseCtrl.addfranchise
);
router.post(
    '/updatefranchise', 
    authMiddleware, 
    uploadFranchiseImages.fields([
        { name: 'bank_image', maxCount: 1 },
        { name: 'aadhar_image', maxCount: 1 },
        { name: 'pan_image', maxCount: 1 }
    ]), 
    franchiseUploadError,
    franchiseCtrl.updatefranchise
);
router.post('/deletefranchise', authMiddleware, franchiseCtrl.deletefranchise);
router.post('/updatefranchiseloginstatus', authMiddleware, franchiseCtrl.updatefranchiseloginstatus);
router.post('/updatefranchiseactivestatus', authMiddleware, franchiseCtrl.updatefranchiseactivestatus);

router.get('/getfranchisesettlements', authMiddleware, franchiseCtrl.getfranchisesettlements);
router.get('/getfranchisesettlementhistory', authMiddleware, franchiseCtrl.getfranchisesettlementhistory);

// Dashboard
router.get('/getDashboard', authMiddleware, mainCtrl.getDashboard);
// Shop Items
router.post('/deleteshopitem', authMiddleware, mainCtrl.deleteshopitem);
router.get('/getshopitems', authMiddleware, mainCtrl.getshopitems);

router.delete(
    '/deletewebsitebanner/:id',
    authMiddleware,
    mainCtrl.deletewebsitebanner
);
router.put('/updatewebsitebanner/:id', authMiddleware, mainCtrl.updatewebsitebanner);
// Locations
// Locations
router.post(
    '/addlocation',
    authMiddleware,
    uploadLocationImage.single('location_image'),
    mainCtrl.addlocation
);

router.get(
    '/getlocation',
    authMiddleware,
    mainCtrl.getlocation
);

router.post(
    '/updatelocation',
    authMiddleware,
    uploadLocationImage.single('location_image'),
    mainCtrl.updatelocation
);

router.post(
    '/deletelocation',
    authMiddleware,
    mainCtrl.deletelocation
);

router.post(
    '/updatelocationactivestatus',
    authMiddleware,
    mainCtrl.updatelocationactivestatus
);

// Categories
router.post(
    '/addcategory',
    authMiddleware,
    uploadCategoryImage.single('category_image'),
    mainCtrl.addcategory
);

router.get(
    '/getcategory',
    authMiddleware,
    mainCtrl.getcategory
);

router.get(
    '/getmainfilter',
    authMiddleware,
    mainCtrl.getmainfilter
);

router.delete(
    '/deletemainfilter/:id',
    authMiddleware,
    mainCtrl.deletemainfilter
);

router.post(
    '/updatemainfilter',
    authMiddleware,
    mainCtrl.updatemainfilter
);

router.post(
    '/addmainfilter',
    authMiddleware,
    mainCtrl.addmainfilter
);

router.post(
    '/updatecategory',
    authMiddleware,
    uploadCategoryImage.single('category_image'),
    mainCtrl.updatecategory
);

router.post(
    '/updatecategoryactivestatus',
    authMiddleware,
    mainCtrl.updatecategoryactivestatus
);

router.post(
    '/deletecategory',
    authMiddleware,
    mainCtrl.deletecategory
);

router.post(
    '/addsubcategory',
    authMiddleware,
    uploadCategoryImage.single('category_image'),
    mainCtrl.addsubcategory
);

router.get(
    '/getsubcategory',
    authMiddleware,
    mainCtrl.getsubcategory
);

router.post(
    '/updatesubcategory',
    authMiddleware,
    uploadCategoryImage.single('category_image'),
    mainCtrl.updatesubcategory
);

router.post(
    '/deletesubcategory',
    authMiddleware,
    mainCtrl.deletesubcategory
);

router.get(
    '/getcategoryimage/:id',
    mainCtrl.getcategoryimage
);

router.post(
    '/addshopitem',
    authMiddleware,
    uploadShopItemImage.single('shop_image'),
    mainCtrl.addshopitem
);

router.post(
  '/updateshopitem',
  authMiddleware,
  uploadShopItemImage.single('shop_image'),
  mainCtrl.updateshopitem
);

router.post('/getpayments', authMiddleware, mainCtrl.getpayments);
router.post(
    '/getdeliveryboypayments',
    authMiddleware,
    mainCtrl.getdeliveryboypayments
);

router.post(
    '/getdeliveryboypaymenthistory',
    authMiddleware,
    mainCtrl.getdeliveryboypaymenthistory
);
router.post(
    '/submitproductassignment',
    authMiddleware,
    mainCtrl.submitproductassignment
);
router.post('/getproductassignment', authMiddleware, mainCtrl.getproductassignment);
// Vendors
router.get('/getvendors', authMiddleware, mainCtrl.getvendors);

router.post(
    '/addvendor',
    authMiddleware,
    uploadVendorImages.fields([
        { name: 'shop_image', maxCount: 1 },
        { name: 'shop_interior_image1', maxCount: 1 },
        { name: 'shop_interior_image2', maxCount: 1 },
        { name: 'agreement_copy', maxCount: 1 }
    ]),
    mainCtrl.addvendor
);

router.post(
    '/updatevendor',
    authMiddleware,
    uploadVendorImages.fields([
        { name: 'shop_image', maxCount: 1 },
        { name: 'shop_interior_image1', maxCount: 1 },
        { name: 'shop_interior_image2', maxCount: 1 },
        { name: 'agreement_copy', maxCount: 1 }
    ]),
    mainCtrl.updatevendor
);
router.post('/deletevendor', authMiddleware,  mainCtrl.deletevendor);
router.post('/updatevendoractivestatus', authMiddleware,  mainCtrl.updatevendoractivestatus);
router.post('/updatevendorloginstatus', authMiddleware,  mainCtrl.updatevendorloginstatus);

// Dev Support
router.get('/getdevsupport', authMiddleware, mainCtrl.getdevsupport);
router.post('/adddevsupport', authMiddleware, uploadDevSupportImage.single('image'), mainCtrl.adddevsupport);
router.post(
    '/updatedevsupport',
    authMiddleware,
    uploadDevSupportImage.single('image'),
    mainCtrl.updatedevsupport
);
router.post(
    '/deletedevsupport',
    authMiddleware,
    mainCtrl.deletedevsupport
);
router.post('/updatedevstatus', authMiddleware, mainCtrl.updatedevstatus);
router.post('/updateadminstatus', authMiddleware, mainCtrl.updateadminstatus);
router.post('/updatetickettype', authMiddleware, mainCtrl.updatetickettype);
router.post('/updateticketremarks', authMiddleware, mainCtrl.updateticketremarks);

// Tenant Settings
router.get('/gettenantsettings', authMiddleware, mainCtrl.gettenantsettings);
router.post('/updatetenantsettings', authMiddleware, mainCtrl.updatetenantsettings);
router.get('/getwebsitebanners', authMiddleware, mainCtrl.getwebsitebanners);
router.post('/savewebsitebanner', authMiddleware, mainCtrl.savewebsitebanner);
// Products
router.post('/addproduct', authMiddleware,  mainCtrl.addproduct);
router.get('/getproducts', authMiddleware,  mainCtrl.getproducts);
router.post('/updateproduct', authMiddleware,  mainCtrl.updateproduct);
router.post('/deleteproduct', authMiddleware, mainCtrl.deleteproduct);
router.post('/updateproductactivestatus', authMiddleware,  mainCtrl.updateproductactivestatus);

// Delivery Partners
// Delivery Partners
router.get(
    '/getdeliverypartners',
    authMiddleware,
    mainCtrl.getdeliverypartners
);

router.post(
    '/adddeliverypartner',
    authMiddleware,
    uploadDeliveryPartnerImages.fields([
        { name: 'aadhar_image', maxCount: 1 },
        { name: 'pan_image', maxCount: 1 },
        { name: 'bank_details_image', maxCount: 1 },
        { name: 'driving_license_image', maxCount: 1 }
    ]),
    deliveryPartnerUploadError,
    mainCtrl.adddeliverypartner
);

router.post(
    '/updatedeliverypartner',
    authMiddleware,
    uploadDeliveryPartnerImages.fields([
        { name: 'aadhar_image', maxCount: 1 },
        { name: 'pan_image', maxCount: 1 },
        { name: 'bank_details_image', maxCount: 1 },
        { name: 'driving_license_image', maxCount: 1 }
    ]),
    deliveryPartnerUploadError,
    mainCtrl.updatedeliverypartner
);

router.post(
    '/deletedeliverypartner',
    authMiddleware,
    mainCtrl.deletedeliverypartner
);

router.post(
    '/updatedeliverypartneractivestatus',
    authMiddleware,
    mainCtrl.updatedeliverypartneractivestatus
);

router.post(
    '/updatedeliverypartnerloginstatus',
    authMiddleware,
    mainCtrl.updatedeliverypartnerloginstatus
);


// Orders
router.post('/getorders', authMiddleware,  mainCtrl.getorders);
router.post('/getorderdetails', authMiddleware,  mainCtrl.getorderdetails);
router.post('/updateorderstatus', authMiddleware,  mainCtrl.updateorderstatus);

router.post('/getdriveractivity', authMiddleware, mainCtrl.getdriveractivity);

// Customers
router.get('/getcustomers', authMiddleware,  mainCtrl.getcustomers);
router.post('/getcustomerdetails', authMiddleware,  mainCtrl.getcustomerdetails);
router.post('/updatecustomeractivestatus', authMiddleware,  mainCtrl.updatecustomeractivestatus);

// Banners
router.post('/addbanner', authMiddleware, uploadBannerImage.single('banner_image'), mainCtrl.addbanner);
router.get('/getbanners', authMiddleware,  mainCtrl.getbanners);
router.post('/updatebanner', authMiddleware, uploadBannerImage.single('banner_image'), mainCtrl.updatebanner);
router.post('/deletebanner', authMiddleware,  mainCtrl.deletebanner);

// Coupons
router.post('/addcoupon', authMiddleware,  mainCtrl.addcoupon);
router.get('/getcoupons', authMiddleware,  mainCtrl.getcoupons);
router.post('/updatecoupon', authMiddleware,  mainCtrl.updatecoupon);
router.post('/deletecoupon', authMiddleware,  mainCtrl.deletecoupon);

// Notifications
// Notifications
router.post(
    '/addnotification',
    authMiddleware,
    mainCtrl.addnotification
);

router.post(
    '/updatenotification',
    authMiddleware,
    mainCtrl.updatenotification
);

router.get(
    '/getnotifications',
    authMiddleware,
    mainCtrl.getnotifications
);

router.post(
    '/deletenotification',
    authMiddleware,
    mainCtrl.deletenotification
);

// Vendor Settlements
router.get(
    '/getcodsettlements',
    authMiddleware,
    mainCtrl.getcodsettlements
);

router.post(
    '/paycodsettlement',
    authMiddleware,
    mainCtrl.paycodsettlement
);

router.get(
    '/getvendorsettlements',
    authMiddleware,
    mainCtrl.getvendorsettlements
);

router.post(
    '/createvendorsettlement',
    authMiddleware,
    mainCtrl.createvendorsettlement
);

router.post(
    '/submitvendorpayout',
    authMiddleware,
    mainCtrl.submitvendorpayout
);

// Website Management content
router.get(
    '/getwebsitehomesections',
    authMiddleware,
    mainCtrl.getwebsitehomesections
);

router.post(
    '/savewebsitehomesection',
    authMiddleware,
    mainCtrl.savewebsitehomesection
);

router.put(
    '/updatewebsitehomesection/:id',
    authMiddleware,
    mainCtrl.updatewebsitehomesection
);

router.delete(
    '/deletewebsitehomesection/:id',
    authMiddleware,
    mainCtrl.deletewebsitehomesection
);

router.get(
    '/getwebsitepromosections',
    authMiddleware,
    mainCtrl.getwebsitepromosections
);

router.post(
    '/savewebsitepromosection',
    authMiddleware,
    mainCtrl.savewebsitepromosection
);

router.put(
    '/updatewebsitepromosection/:id',
    authMiddleware,
    mainCtrl.updatewebsitepromosection
);

router.delete(
    '/deletewebsitepromosection/:id',
    authMiddleware,
    mainCtrl.deletewebsitepromosection
);

router.get(
    '/getwebsitetestimonials',
    authMiddleware,
    mainCtrl.getwebsitetestimonials
);

router.post(
    '/savewebsitetestimonial',
    authMiddleware,
    mainCtrl.savewebsitetestimonial
);

router.put(
    '/updatewebsitetestimonial/:id',
    authMiddleware,
    mainCtrl.updatewebsitetestimonial
);

router.delete(
    '/deletewebsitetestimonial/:id',
    authMiddleware,
    mainCtrl.deletewebsitetestimonial
);

router.get(
    '/getwebsitefootersettings',
    authMiddleware,
    mainCtrl.getwebsitefootersettings
);

router.post(
    '/updatewebsitefootersettings',
    authMiddleware,
    mainCtrl.updatewebsitefootersettings
);

router.get(
    '/getwebsitethemesettings',
    authMiddleware,
    mainCtrl.getwebsitethemesettings
);

router.post(
    '/updatewebsitethemesettings',
    authMiddleware,
    mainCtrl.updatewebsitethemesettings
);

// Charges & Payment Gateway
router.post(
    '/addcharges',
    authMiddleware,
    mainCtrl.addcharges
);

router.get(
    '/getcharges',
    authMiddleware,
    mainCtrl.getcharges
);

router.post(
    '/updatecharges',
    authMiddleware,
    mainCtrl.updatecharges
);

router.get(
    '/getpaymentgateway',
    authMiddleware,
    mainCtrl.getpaymentgateway
);

router.post(
    '/updatepaymentgateway',
    authMiddleware,
    mainCtrl.updatepaymentgateway
);

router.post(
    '/updatepaymentmodes',
    authMiddleware,
    appContentCtrl.updatePaymentModes
);

router.get('/getapponboardingslides', authMiddleware, appContentCtrl.getOnboarding);
router.post('/saveapponboardingslide', authMiddleware, appContentCtrl.saveOnboardingSlide);
router.delete('/deleteapponboardingslide/:id', authMiddleware, appContentCtrl.deleteOnboardingSlide);
router.post('/publishapponboarding', authMiddleware, appContentCtrl.publishOnboarding);
router.get('/getapphomecontent', authMiddleware, appContentCtrl.getHomeContent);
router.post('/saveapphomecontent', authMiddleware, appContentCtrl.saveHomeContent);
router.post('/publishapphomecontent', authMiddleware, appContentCtrl.publishHomeContent);
router.get('/getappcheckoutconfig', authMiddleware, appContentCtrl.getCheckoutConfig);
router.post('/saveappcheckoutconfig', authMiddleware, appContentCtrl.saveCheckoutConfig);
router.post('/publishappcheckoutconfig', authMiddleware, appContentCtrl.publishCheckoutConfig);
router.get('/getappupdates', authMiddleware, appContentCtrl.getAppUpdates);
router.post('/saveappupdates', authMiddleware, appContentCtrl.saveAppUpdates);
router.post('/publishappupdates', authMiddleware, appContentCtrl.publishAppUpdates);

module.exports = router;
