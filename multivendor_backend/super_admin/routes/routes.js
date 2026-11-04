var express = require('express');
var router = express.Router();
var mainCtrl = require('../controllers/mainCtrl');
var enquiryCtrl = require('../controllers/enquiryCtrl');
var platformCtrl = require('../controllers/platformCtrl');
var franchiseCtrl = require('../controllers/franchiseCtrl');
var authMiddleware = require('../middleware/auth');
var moduleAccess = require('../middleware/moduleAccess');

// Public route (no JWT required)
router.post('/getUserData', mainCtrl.getUserData);
router.post('/submitenquiry', enquiryCtrl.submitenquiry); // marketing website enquiry form

// Protected routes (JWT required)
router.post('/getmodulelistdetails', authMiddleware, mainCtrl.getmodulelistdetails);
router.post('/submituserslogin', authMiddleware, mainCtrl.submituserslogin);
router.get('/getuserlist', authMiddleware, mainCtrl.getuserlist);
router.post('/getupdatemodules', authMiddleware, mainCtrl.getupdatemodules);
router.post('/deleteuser', authMiddleware, mainCtrl.deleteuser);
router.post('/postusermenulist', authMiddleware, mainCtrl.postusermenulist);
router.get('/getDashboard', authMiddleware, platformCtrl.getDashboard);
router.get('/getdevsupport', authMiddleware, mainCtrl.getdevsupport);
router.post('/adddevsupport', authMiddleware, mainCtrl.adddevsupport);
router.post('/updatedevstatus', authMiddleware, mainCtrl.updatedevstatus);
router.post('/updateadminstatus', authMiddleware, mainCtrl.updateadminstatus);
router.post('/updatetickettype', authMiddleware, mainCtrl.updatetickettype);
router.post('/updateticketremarks', authMiddleware, mainCtrl.updateticketremarks);
router.post('/getusersprofile', authMiddleware, mainCtrl.getusersprofile);
router.post('/updatetheme', authMiddleware, mainCtrl.updatetheme);
router.post('/updateuserpassword', authMiddleware, mainCtrl.updateuserpassword);
router.get('/getmasterdata1', authMiddleware, mainCtrl.getmasterdata1);

// Shared dropdown data
router.get('/getlookups', authMiddleware, platformCtrl.getlookups);

// Tenants
var TENANTS = '/masters/tenants';
router.get('/gettenants', authMiddleware, moduleAccess(TENANTS), platformCtrl.gettenants);
router.post('/gettenantdetails', authMiddleware, moduleAccess(TENANTS), platformCtrl.gettenantdetails);
router.post('/addtenant', authMiddleware, moduleAccess(TENANTS, 'add'), platformCtrl.addtenant);
router.post('/updatetenant', authMiddleware, moduleAccess(TENANTS, 'edit'), platformCtrl.updatetenant);
router.post('/updatetenantstatus', authMiddleware, moduleAccess(TENANTS, 'edit'), platformCtrl.updatetenantstatus);
router.post('/updateprovisioningstep', authMiddleware, moduleAccess(TENANTS, 'edit'), platformCtrl.updateprovisioningstep);
router.post('/updatetenantpaymentmodes', authMiddleware, moduleAccess(TENANTS, 'edit'), platformCtrl.updatetenantpaymentmodes);
router.post('/gettenantentitlements', authMiddleware, moduleAccess(TENANTS), platformCtrl.gettenantentitlements);
router.post('/savetenantentitlement', authMiddleware, moduleAccess(TENANTS, 'edit'), platformCtrl.savetenantentitlement);
router.post('/deletetenant', authMiddleware, moduleAccess(TENANTS, 'delete'), platformCtrl.deletetenant);

// Business Types (master used by the tenant form)
var BUSINESS_TYPES = '/masters/business-types';
router.get('/getbusinesstypes', authMiddleware, moduleAccess(BUSINESS_TYPES), platformCtrl.getbusinesstypes);
// One endpoint creates and updates, so it is gated on 'edit'. sa_user_permissions
// grants all four flags together (see PermissionService), so this is not a gap.
router.post('/savebusinesstype', authMiddleware, moduleAccess(BUSINESS_TYPES, 'edit'), platformCtrl.savebusinesstype);
router.post('/updatebusinesstypestatus', authMiddleware, moduleAccess(BUSINESS_TYPES, 'edit'), platformCtrl.updatebusinesstypestatus);
router.post('/deletebusinesstype', authMiddleware, moduleAccess(BUSINESS_TYPES, 'delete'), platformCtrl.deletebusinesstype);

// Partners
var PARTNERS = '/masters/partners';
router.get('/getpartners', authMiddleware, moduleAccess(PARTNERS), platformCtrl.getpartners);
router.post('/getpartnerdetails', authMiddleware, moduleAccess(PARTNERS), platformCtrl.getpartnerdetails);
router.post('/addpartner', authMiddleware, moduleAccess(PARTNERS, 'add'), platformCtrl.addpartner);
router.post('/updatepartner', authMiddleware, moduleAccess(PARTNERS, 'edit'), platformCtrl.updatepartner);
router.post('/updatepartnerstatus', authMiddleware, moduleAccess(PARTNERS, 'edit'), platformCtrl.updatepartnerstatus);
router.post('/deletepartner', authMiddleware, moduleAccess(PARTNERS, 'delete'), platformCtrl.deletepartner);

var FRANCHISE = '/masters/franchise';
router.get('/getfranchises', authMiddleware, moduleAccess(FRANCHISE), franchiseCtrl.getfranchises);
router.post('/addfranchise', authMiddleware, moduleAccess(FRANCHISE, 'add'), franchiseCtrl.addfranchise);
router.post('/updatefranchise', authMiddleware, moduleAccess(FRANCHISE, 'edit'), franchiseCtrl.updatefranchise);
router.post('/deletefranchise', authMiddleware, moduleAccess(FRANCHISE, 'delete'), franchiseCtrl.deletefranchise);
router.post('/updatefranchiseloginstatus', authMiddleware, moduleAccess(FRANCHISE, 'edit'), franchiseCtrl.updatefranchiseloginstatus);
router.post('/updatefranchiseactivestatus', authMiddleware, moduleAccess(FRANCHISE, 'edit'), franchiseCtrl.updatefranchiseactivestatus);
// Plans
var PLANS = '/masters/plans';
router.get('/getplans', authMiddleware, moduleAccess(PLANS), platformCtrl.getplans);
router.post('/addplan', authMiddleware, moduleAccess(PLANS, 'add'), platformCtrl.addplan);
router.post('/updateplan', authMiddleware, moduleAccess(PLANS, 'edit'), platformCtrl.updateplan);
router.post('/updateplanstatus', authMiddleware, moduleAccess(PLANS, 'edit'), platformCtrl.updateplanstatus);
router.post('/deleteplan', authMiddleware, moduleAccess(PLANS, 'delete'), platformCtrl.deleteplan);

// Subscriptions
var SUBSCRIPTIONS = '/masters/subscriptions';
router.get('/getsubscriptions', authMiddleware, moduleAccess(SUBSCRIPTIONS), platformCtrl.getsubscriptions);
router.post('/addsubscription', authMiddleware, moduleAccess(SUBSCRIPTIONS, 'add'), platformCtrl.addsubscription);
router.post('/renewsubscription', authMiddleware, moduleAccess(SUBSCRIPTIONS, 'edit'), platformCtrl.renewsubscription);
router.post('/updatesubscriptionstatus', authMiddleware, moduleAccess(SUBSCRIPTIONS, 'edit'), platformCtrl.updatesubscriptionstatus);
router.post('/recordpayment', authMiddleware, moduleAccess(SUBSCRIPTIONS, 'add'), platformCtrl.recordpayment);

// Billing & Invoices
var BILLING = '/masters/billing';
router.get('/getbillingtransactions', authMiddleware, moduleAccess(BILLING), platformCtrl.getbillingtransactions);
router.post('/updatebillingstatus', authMiddleware, moduleAccess(BILLING, 'edit'), platformCtrl.updatebillingstatus);

// Features (package building blocks)
router.get('/getfeatures', authMiddleware, moduleAccess(PLANS), platformCtrl.getfeatures);
router.post('/savefeature', authMiddleware, moduleAccess(PLANS, 'edit'), platformCtrl.savefeature);
router.post('/deletefeature', authMiddleware, moduleAccess(PLANS, 'delete'), platformCtrl.deletefeature);

// Website enquiries
var ENQUIRIES = '/masters/enquiries';
router.get('/getenquiries', authMiddleware, moduleAccess(ENQUIRIES), platformCtrl.getenquiries);
router.post('/addenquiry', authMiddleware, moduleAccess(ENQUIRIES, 'add'), platformCtrl.addenquiry);
router.post('/updateenquiry', authMiddleware, moduleAccess(ENQUIRIES, 'edit'), platformCtrl.updateenquiry);
router.post('/deleteenquiry', authMiddleware, moduleAccess(ENQUIRIES, 'delete'), platformCtrl.deleteenquiry);

// Reports & audit
router.post('/getreports', authMiddleware, moduleAccess('/masters/reports'), platformCtrl.getreports);
router.post('/getactivitylogs', authMiddleware, moduleAccess('/masters/activitylog'), platformCtrl.getactivitylogs);

module.exports = router;
