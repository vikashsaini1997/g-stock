const express = require('express')
const router = express.Router()
const Joi = require('joi')
const authorize = require("../../middleware/authorize.middleware")
const validation = require("../../middleware/validate.middleware")
const userController = require('../controllers/user.controller')
const jobController = require('../controllers/jobpost.controller')
const studyResourceController = require('../controllers/studyResource.controller')
const cartController = require('../controllers/cart.controller')
const schema = require('../../middleware/userschema.middleware')
const checkIsUsercompleteprofileActive = require("../../middleware/checkUsercompleteprofile_and_active");




//user//

router.post('/login', schema.loginschema, userController.login);
router.post('/register', schema.registerschema, userController.register)
router.post('/verify-otp', schema.verifyotpschema, userController.verifyotp)
router.post('/resend-otp', schema.resendotpschema, userController.resendotp)
router.post('/logout', userController.logout)
router.post('/forgot-password', schema.forgotschema, userController.forgotpassword)
router.post('/update-password', schema.udatepasswordschema, userController.updatepassword)
router.post('/change-password', authorize, schema.changepassword, userController.changePassword)
router.post('/social-login',schema.socialloginschema, userController.sociallogin)
router.post('/socialemail-verify',schema.socialemailverify, userController.social_email_verify)
router.post('/complete-profile',schema.completeprofile,userController.complet_profile)
router.post('/resend-email' ,userController.resend_email)
router.post('/change-email' ,userController.change_email)
router.get('/get-user-data' ,authorize,userController.user_data_get)
//category//
router.get('/getcategory-list',userController.getallcategory)

//sub-category//
router.post('/subcategory-list',schema.sub_category_list, userController.getsubcategory)

//school//
router.get('/school-list', userController.school_list)

//course//
router.get('/course-list', userController.course_list)

//subject//
router.post('/subject-list',schema.subject_list, userController.subject_list)

//country//
router.get('/country-list', userController.country_list)

//state//
router.post('/state-list',schema.state_list, userController.state_list)

//city//
router.post('/city-listing',authorize,schema.city_list,userController.city_listing);

//jobpost//
router.post('/job-list',jobController.joblist);
router.post('/job-addbid',authorize,checkIsUsercompleteprofileActive,schema.jobbid_add,jobController.jobaddbid);
router.post('/bid-view',authorize,checkIsUsercompleteprofileActive,schema.bid_view,jobController.bid_view);
router.get('/job-bids-list/:id',authorize,checkIsUsercompleteprofileActive,jobController.jobbidslist);
router.post('/add-job-post',authorize,checkIsUsercompleteprofileActive,schema.jobpost_add,jobController.job_add)
router.post('/job-view',schema.jobview,jobController.job_view)
router.post('/similarjob-list',authorize,schema.simmilarjob,jobController.simmilar_job_list)
router.post('/cancel-bid',authorize,checkIsUsercompleteprofileActive,schema.cancelbid,jobController.cancel_bid)

//my posted job//
router.post('/myposted-joblist',authorize,checkIsUsercompleteprofileActive,jobController.my_posted_jobs_list)
router.post('/myposted-job-cancel',authorize,checkIsUsercompleteprofileActive,schema.postedjobcancel, jobController.cancel_posted_job)
router.post('/myposted-job-view',authorize,checkIsUsercompleteprofileActive,schema.postedjobview, jobController.posted_job_view)
router.post('/myposted-job-bidlist',authorize,checkIsUsercompleteprofileActive,schema.postedjob_bidlist, jobController.postjob_all_bids_list)
router.post('/myposted_job_reject_hire',authorize,checkIsUsercompleteprofileActive,schema.reject_hire_bid, jobController.bid_reject_hireexpert)
router.post('/myfavorite_joblist',authorize,checkIsUsercompleteprofileActive,jobController.all_favorite_joblist)

//doc-upload//
router.post('/doc_upload',schema.doc_upload, jobController.document_upload)

//banner//
router.get('/banner-listing',userController.banner_listing);

//skills//
router.post('/skill-listing',schema.skill_list,userController.skills_listing);

//cms//
router.get('/cmspage-view/:slug',userController.cmspageview)
router.get('/faq-listing',userController.faq_list)


//tags //
router.post('/tags-listing',schema.tags_list,userController.tags_listing);
router.post('/all_tags_listing',userController.all_tags_listing);

//education//
router.get('/education-listing',userController.education_listing);

//stripe payment gateway//
router.post('/card-add',authorize,schema.card_add,userController.card_add);
router.post('/getall-card',authorize,schema.getallcard,userController.all_card_list);
router.post('/delete-card',authorize,schema.deletecard,userController.delete_card);
router.post('/card-update',authorize,schema.cardupdate,userController.update_card);
router.post('/payment',authorize,schema.payment,userController.payment);
router.post('/bankaccount-add',authorize,schema.bankaccountadd,userController.bankaccountadd);
router.post('/bankaccount-update',authorize,schema.bankaccountupdate,userController.updatebankaccount);
router.post('/bankaccount-list',authorize,schema.bankaccountlist,userController.bankAccountList);
router.post('/bankaccount-delete',authorize,schema.bankaccountdelete,userController.bankAccountDelete);
router.post('/bankaccount-verify',authorize,schema.bankaccountverify,userController.bankaccountverify);


//plan//+
router.get('/plan-listing',authorize,userController.plan_listing);

//study resource//
router.post('/new_study_resource',authorize,checkIsUsercompleteprofileActive,schema.study_resource_upload,studyResourceController.add_new_study_resource);
router.get('/user_study_resource_list',authorize,checkIsUsercompleteprofileActive,studyResourceController.user_study_resource_list);
router.post('/user_update_study_resource',authorize,checkIsUsercompleteprofileActive,studyResourceController.user_update_study_resource);
router.post('/study_resource_list',authorize,checkIsUsercompleteprofileActive,studyResourceController.study_resource_list);
router.post('/study_resource_detail',authorize,checkIsUsercompleteprofileActive,studyResourceController.study_resource_detail);
router.post('/delete_study_resource',authorize,checkIsUsercompleteprofileActive,schema.study_res_delete,studyResourceController.study_resource_delete);
router.post('/add_favorites_study_resource',authorize,checkIsUsercompleteprofileActive,studyResourceController.add_favorites_study_resource);
router.post('/study_res_listing_public',studyResourceController.public_study_res_list);
router.post('/study_res_detail_public',studyResourceController.public_study_res_detail);
router.post('/all_fav_study_res_list',authorize,checkIsUsercompleteprofileActive,studyResourceController.all_favorite_study_res_list);

//flash card//
router.post('/upload_flash_card',authorize,checkIsUsercompleteprofileActive,schema.flash_card_upload,studyResourceController.upload_flash_card);
router.post('/update_flash_card',authorize,checkIsUsercompleteprofileActive,schema.flash_card_update,studyResourceController.flash_card_update);
router.post('/delete_flash_card',authorize,checkIsUsercompleteprofileActive,schema.flash_card_delete,studyResourceController.flash_card_delete);
router.post('/user_flash_card_view',authorize,checkIsUsercompleteprofileActive,studyResourceController.user_flash_card_view);
router.get('/user_flash_card_list',authorize,checkIsUsercompleteprofileActive,studyResourceController.user_flash_card_list);
router.post('/user_flash_card_detail',authorize,checkIsUsercompleteprofileActive,studyResourceController.flash_card_detail);
router.post('/all_fav_flash_card_list',authorize,checkIsUsercompleteprofileActive,studyResourceController.all_favorite_flash_card_list);

router.post('/flash_card_listing_public',studyResourceController.public_flash_card_list);
router.post('/flash_card_detail_public',studyResourceController.public_flash_card_detail);

//cart//
router.post('/add-cart',authorize,checkIsUsercompleteprofileActive,schema.addcart,cartController.add_cart);
router.post('/cart-list',cartController.cart_list);
router.post('/cart-item-delete',authorize,checkIsUsercompleteprofileActive,schema.cartdelete,cartController.cart_item_delete);
router.post('/address-add',authorize,checkIsUsercompleteprofileActive,schema.addressadd,cartController.add_new_address);
router.post('/address-update',authorize,checkIsUsercompleteprofileActive,schema.address_update,cartController.update_address);
router.post('/address-delete',authorize,checkIsUsercompleteprofileActive,schema.address_delete,cartController.delete_address);
router.get('/address-list',authorize,checkIsUsercompleteprofileActive,cartController.address_list);
router.get('/coupan-list',authorize,checkIsUsercompleteprofileActive,cartController.coupan_list);
router.post('/cart-payment',authorize,checkIsUsercompleteprofileActive,schema.cart_payment,cartController.cart_payment);

//favourite//
router.post('/favorite',authorize,checkIsUsercompleteprofileActive,schema.favourite_schema,studyResourceController.favourite_all_doc);


router.post('/payout',userController.payout);
router.post('/payoutwebhook',userController.payoutwebhook);

router.post('/doc_preview',studyResourceController.document_preview);
router.post('/doc_jpeg',studyResourceController.doc_convert_in_jpeg);
module.exports = router;