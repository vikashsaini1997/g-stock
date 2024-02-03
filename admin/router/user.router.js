const express = require('express')
const router = express.Router()
const Joi = require('joi');
const multer = require('multer')
const path = require('path')
const authorize = require("../../middleware/authorize.middleware")
const validation = require("../../middleware/validate.middleware")
const userController = require('../../admin/controllers/user.controller')
const categoryController = require('../../admin/controllers/category.controller')
const jobController = require('../../admin/controllers/jobpost.controller')
const blogController = require('../../admin/controllers/blog.controller')
const cmsController = require('../../admin/controllers/cms.controller')
const planController = require('../../admin/controllers/plan.controller')
const coupanController = require('../../admin/controllers/coupan.controller')
const schema = require('../../middleware/adminschema.middleware')

const storage = multer.diskStorage({
    destination: './uploads',
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname))
    },
})

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5000000
    },
})

//admin routes//
router.post('/login', schema.loginschema, userController.Login);
router.post('/forgot-password', schema.forgotschema, userController.forgotpassword);
router.post('/update-password', schema.udatepasswordschema, userController.updatepassword);
router.post('/change-password', authorize, schema.changepassword, userController.changePassword);
router.post('/logout', authorize, userController.logout);

//category//
router.post('/category-add', authorize, schema.categoryaddschema, categoryController.categoryadd);
router.post('/category-list', authorize, categoryController.categoryList);
router.post('/category-edit', authorize, schema.category_update, categoryController.categoryUpdate);
router.post('/category-status-update', authorize, schema.category_status_update, categoryController.category_status_update);
router.post('/subcategory-add', authorize, schema.sub_cataddschema, categoryController.subCategoryadd);
router.post('/subcategory-list', authorize, schema.subcategory_list, categoryController.catSubcatList);
router.post('/subcategory-status-update', authorize, schema.subcategory_status_update, categoryController.subcategory_status_update);
router.get('/category-doc-count', authorize, categoryController.category_doc_count);

//jobpost//
router.post('/job-add', authorize, upload.single('document'), jobController.jobadd);
router.post('/alljob-list', authorize, jobController.alljob_list);


//school//
router.post('/school-add', authorize, schema.school_addschema, userController.school_add);
router.post('/school-list', authorize, userController.school_list);
router.post('/school-update', authorize, schema.school_updateschema, userController.school_update);

//course//
router.post('/course-add', authorize, schema.course_addschema, userController.course_add);
router.post('/course-list', authorize, userController.course_list);
router.post('/course-update', authorize, schema.course_updateschema, userController.course_update);


//subject//
router.post('/subject-add', authorize, schema.subject_addschema, userController.subject_add);
router.post('/subject-list', authorize, userController.subject_list);
router.post('/subject-update', authorize, schema.subject_update, userController.subject_update);

//country//
router.post('/country-add', authorize, schema.country_addschema, userController.country_add);
router.get('/country-list', authorize, userController.country_list);
router.post('/country-update', authorize, schema.country_status_updateschema, userController.country_status_update);

//state//
router.post('/state-add', authorize, schema.state_addschema, userController.state_add);
router.get('/state-list', authorize, userController.state_list);
router.post('/state-update', authorize, schema.state_status_update_schema, userController.state_status_update);

//city//
router.post('/city-add', authorize, schema.city_addschema, userController.city_add);
router.post('/city-list', authorize, schema.city_listschema, userController.city_list);

//home-page banner//
router.post('/banner-add', authorize, schema.banner_add, userController.banner_add);
router.post('/banner-update', authorize, schema.banner_update, userController.banner_update);
router.post('/banner-status-update', authorize, schema.banner_status_update, userController.banner_status_update);
router.get('/banner-list', authorize, userController.banner_list);

//blog controller routes//
router.post('/blog-add', authorize, schema.blog_add, blogController.blog_add);
router.post('/blog-update', authorize, schema.blog_update, blogController.blog_update);
router.post('/blog-status-update', authorize, schema.blog_status_update, blogController.blog_status_update);
router.post('/blog-list', authorize, blogController.blog_list);
router.post('/blog-view', schema.blog_view_schema,authorize, blogController.blow_view);

//skill//
router.post('/skill-add', authorize, schema.skill_add, userController.skills_add);
router.post('/skill-list', authorize, userController.skills_list);
router.post('/skill-status-update', authorize, schema.skill_status_update, userController.skill_status_update);

//cms pages//
router.post('/cms-create', authorize, schema.cms_create, cmsController.create_cms);
router.post('/cms-view', authorize, schema.cms_view, cmsController.view_cms);
router.get('/cms-list', authorize, cmsController.cms_list);
router.post('/cms-update', authorize, schema.cms_update,cmsController.cms_update);

//faqs//
router.post('/faq-add', authorize, schema.faq_create,cmsController.faq_add);
router.get('/faq-list', authorize, cmsController.faq_list);
router.post('/faq-update', authorize, schema.faq_update,cmsController.faq_update);
router.post('/faq-delete', authorize, schema.faq_delete,cmsController.faq_delete);

//tags//
router.post('/tag-add', authorize, schema.tag_add, userController.tags_add);
router.post('/tags-list', authorize, userController.tag_list);
router.post('/tags-status-update', authorize, schema.tag_status_update, userController.tag_status_update);

//education//
router.post('/education-add', authorize, schema.education_add, userController.education_add);
router.post('/education-list', authorize, userController.education_list);
router.post('/education-update', authorize, schema.education_update, userController.education_update);

//plan//
router.post('/plan-add', authorize, schema.plan_add, planController.add_plan);
router.post('/plan-update', authorize, schema.plan_update, planController.plan_update);
router.get('/plan-update-status/:planid', authorize, planController.plan_update_status);
router.get('/plan-list', authorize, planController.plan_list);
router.post('/userplan-list', authorize, planController.user_plan_list);

//user management//
router.post('/buyer-user-list', authorize, userController.buyer_user_list)
router.post('/expert-user-list', authorize, userController.approve_expert_user_list)
router.post('/newrequest-expert-list', authorize, userController.newrequest_expert_list)
router.post('/rejected-expert-list', authorize, userController.rejected_expert_list)
router.post('/expert-request-approve', authorize, schema.neq_request_approve, userController.expert_request_approve)
router.post('/expert-view-detail', authorize, userController.expert_view_detail)
router.post('/reportdownload',authorize, schema.export_report_schema, userController.expert_user_list_report_download)
router.post('/buyer_expert_status_update',authorize, schema.expert_buyer_status, userController.expert_buyer_status_update)

router.post('/reportdownload/:slug',authorize, userController.reportdownloadcommon)


//coupan management//
router.post('/coupan-add', authorize, schema.coupan_add, coupanController.coupan_add)
router.post('/coupan-list', authorize, coupanController.coupan_list)
router.post('/coupan-status-update', authorize, schema.coupan_status_update, coupanController.coupan_status_update)

//flash card//
router.post('/admin-flashcard-list', authorize, userController.flash_card_list)
router.post('/admin-flashcard-status-update', authorize, schema.admin_flash_status_update, userController.admin_flash_card_status_update)

//dashboard//
router.get('/dashboard',authorize, userController.dashboard)

module.exports = router