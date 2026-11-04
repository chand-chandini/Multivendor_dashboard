var express = require('express');
var router = express.Router();

var auth = require('../middleware/auth');
var authCtrl = require('../controllers/authCtrl');
var vendorCtrl = require('../controllers/vendorCtrl');
var deliveryCtrl = require('../controllers/deliveryCtrl');
var franchiseCtrl = require('../controllers/franchiseCtrl');
var deviceCtrl = require('../controllers/deviceCtrl');
var supportCtrl = require('../controllers/supportCtrl');
var uploadCtrl = require('../controllers/uploadCtrl');
var upload = require('../middleware/upload');
var newOrderAlert = require('../lib/newOrderAlert');

// Partner App routes (vendor + delivery partner mobile app)

// Sign-in
router.post('/login', authCtrl.login);
router.post('/sendotp', authCtrl.sendotp);
router.post('/verifyotp', authCtrl.verifyotp);
router.post('/resetpassword', authCtrl.resetpassword);
router.get('/getbranding', authCtrl.getbranding);
// Product photos are public like the old /uploads files: an <Image> cannot send the auth header.
router.get('/productimage/:id', vendorCtrl.productimage);
router.get('/getaccount', auth.requireAuth(), authCtrl.getaccount);
router.post('/switchrole', auth.requireAuth(), authCtrl.switchrole);
router.post('/updatebankaccount', auth.requireAuth(), authCtrl.updatebankaccount);

// Support, policy links and account requests - either workspace.
router.get('/getsupport', auth.requireAuth(), supportCtrl.getsupport);
router.post('/raiseticket', auth.requireAuth(), supportCtrl.raiseticket);
router.get('/getaccountrequests', auth.requireAuth(), supportCtrl.getaccountrequests);
router.post('/requestaccountdeletion', auth.requireAuth(), supportCtrl.requestaccountdeletion);
router.post('/requestdataexport', auth.requireAuth(), supportCtrl.requestdataexport);

// General image upload, either workspace; returns the stored URL.
router.post('/uploadimage', auth.requireAuth(), upload.single('photo'), uploadCtrl.uploadimage);

// Push notifications: either workspace registers the phone it is signed in on.
router.post('/registerdevice', auth.requireAuth(), deviceCtrl.registerdevice);
router.post('/unregisterdevice', auth.requireAuth(), deviceCtrl.unregisterdevice);

// Vendor workspace
var vendor = auth.requireAuth('vendor');
router.get('/getvendorstate', vendor, vendorCtrl.getvendorstate);
router.get('/getvendorhistory', vendor, vendorCtrl.getvendorhistory);
router.post('/updatestoreonline', vendor, vendorCtrl.updatestoreonline);
router.post('/updatestorebusy', vendor, vendorCtrl.updatestorebusy);
router.post('/updateweeklyholiday', vendor, vendorCtrl.updateweeklyholiday);
router.post('/updatestorehours', vendor, vendorCtrl.updatestorehours);
router.post('/acceptorder', vendor, vendorCtrl.acceptorder);
router.post('/rejectorder', vendor, vendorCtrl.rejectorder);
router.post('/extendpreptime', vendor, vendorCtrl.extendpreptime);
router.post('/markorderready', vendor, vendorCtrl.markorderready);
router.post('/confirmhandover', vendor, vendorCtrl.confirmhandover);
router.post('/updateproductavailability', vendor, vendorCtrl.updateproductavailability);
router.post('/saveproduct', vendor, vendorCtrl.saveproduct);
router.post('/deleteproduct', vendor, vendorCtrl.deleteproduct);
router.post('/publishrates', vendor, vendorCtrl.publishrates);
router.post('/updatesubstitution', vendor, vendorCtrl.updatesubstitution);
router.post('/updatedaypart', vendor, vendorCtrl.updatedaypart);
router.post('/uploadproductimage', vendor, upload.single('photo'), vendorCtrl.uploadproductimage);
router.post('/savecoupon', vendor, vendorCtrl.savecoupon);
router.post('/togglecoupon', vendor, vendorCtrl.togglecoupon);
router.post('/vendor/updatepreferences', vendor, vendorCtrl.updatepreferences);
router.post('/vendor/readnotifications', vendor, vendorCtrl.readnotifications);

// Delivery workspace
var delivery = auth.requireAuth('delivery');
router.get('/getpartnerstate', delivery, deliveryCtrl.getpartnerstate);
router.post('/updateonline', delivery, deliveryCtrl.updateonline);
router.post('/acceptrequest', delivery, deliveryCtrl.acceptrequest);
router.post('/rejectrequest', delivery, deliveryCtrl.rejectrequest);
router.post('/reachedstore', delivery, deliveryCtrl.reachedstore);
router.post('/confirmpickup', delivery, deliveryCtrl.confirmpickup);
router.post('/arrivedcustomer', delivery, deliveryCtrl.arrivedcustomer);
router.post('/completedelivery', delivery, deliveryCtrl.completedelivery);
router.post('/faildelivery', delivery, deliveryCtrl.faildelivery);
router.post('/ratehandover', delivery, deliveryCtrl.ratehandover);
router.post('/uploadproof', delivery, upload.single('photo'), deliveryCtrl.uploadproof);
router.post('/updatepreferences', delivery, deliveryCtrl.updatepreferences);
router.post('/delivery/readnotifications', delivery, deliveryCtrl.readnotifications);

// Franchise workspace
var franchise = auth.requireAuth('franchise');
router.get('/getfranchisestate', franchise, franchiseCtrl.getfranchisestate);
router.get('/franchise/vendorreport', franchise, franchiseCtrl.vendorreport);
router.get('/franchise/vendor', franchise, franchiseCtrl.vendordetail);
router.get('/franchise/partner', franchise, franchiseCtrl.partnerdetail);
router.post('/franchise/setvendorblocked', franchise, franchiseCtrl.setvendorblocked);
router.post('/franchise/setpartnerblocked', franchise, franchiseCtrl.setpartnerblocked);

// Watches for orders created outside this API (see lib/newOrderAlert.js).
newOrderAlert.startWatching();

module.exports = router;
