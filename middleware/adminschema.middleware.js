const Joi = require('joi');
const {validation,validateAllFieldsRequests} = require("./validate.middleware")
var formidable = require('formidable');

module.exports = {

     loginschema(req, res, next) {
        const schema = Joi.object({
            email: Joi.string().required().email({
                    minDomainSegments: 2,
                    tlds: {
                       allow: ["com", "net", "in", "co"],
                    },
                }),
            password: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

     forgotschema(req, res, next) {
        const schema = Joi.object({
            email: Joi.string().required().email({
                minDomainSegments: 2,
                tlds: {
                   allow: ["com", "net", "in", "co"],
                },
            }),
        });
        validation(res, req, next, schema);
    },
    
     udatepasswordschema(req, res, next) {
        const schema = Joi.object({
            token: Joi.string().required(),
            password: Joi.string().required(),
            confirm_password: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },
    
     changepassword(req, res, next) {
        const schema = Joi.object({
            current_password: Joi.string().required(),
            password: Joi.string().required(),
            confirm_password: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    categoryaddschema:async (req, res, next) =>{
        var form = new formidable.IncomingForm();
        form.multiples = true;
        await form.parse(req, async function (err, fields, files) {
        const schema = Joi.object({
            category_name: Joi.string().required(),
        });
        req.files = files;
        req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
                next()
    })
    },

    category_update:async (req, res, next) =>{
        var form = new formidable.IncomingForm();
        form.multiples = true;
        await form.parse(req, async function (err, fields, files) {
        const schema = Joi.object({
            id: Joi.number().required(),
            category_name: Joi.string().optional(),
        });
        req.files = files;
        req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
                next()
    })
    },

    category_status_update:async (req, res, next) =>{
        const schema = Joi.object({
            id: Joi.number().required(),
            status: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },
    
    sub_cataddschema:async (req, res, next) =>{
        var form = new formidable.IncomingForm();
        form.multiples = true;
        await form.parse(req, async function (err, fields, files) {
        const schema = Joi.object({
            cat_id: Joi.number().required(),
            sub_cat_name: Joi.string().required(),
        });
        req.files = files;
        req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
                next()
    })
    },

    subcategory_list(req, res, next) {
        const schema = Joi.object({
            cat_id: Joi.number().required(),
            page: Joi.number().optional(),
            searchtext: Joi.string().optional(),
        });
        validation(res, req, next, schema);
    },

    subcategory_status_update(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
            status: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },


    school_addschema(req, res, next) {
        const schema = Joi.object({
            school_name: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    school_updateschema(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
            school_name: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    course_addschema(req, res, next) {
        const schema = Joi.object({
            course_name: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    course_updateschema(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
            course_name: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    subject_addschema(req, res, next) {
        const schema = Joi.object({
            course_id: Joi.number().required(),
            subject_name:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },
    subject_update(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
            course_id: Joi.number().required(),
            subject_name:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    country_addschema(req, res, next) {
        const schema = Joi.object({
            country_name:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    country_status_updateschema(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    state_addschema(req, res, next) {
        const schema = Joi.object({
            country_id:Joi.number().required(),
            state_name:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    state_status_update_schema(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    city_addschema(req, res, next) {
        const schema = Joi.object({
            state_id:Joi.number().required(),
            city_name:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    city_listschema(req, res, next) {
        const schema = Joi.object({
            state_id:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    banner_add:async (req, res, next) =>{
        var form = new formidable.IncomingForm();
        form.multiples = true;
        await form.parse(req, async function (err, fields, files) {
        const schema = Joi.object({
            title: Joi.string().max(60).required(),
            sub_title: Joi.string().max(300).required(),
            //image: Joi.string().required(),
        });
        req.files = files;
        req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
                next()
    })
    },
    banner_update:async (req, res, next) =>{
        var form = new formidable.IncomingForm();
        form.multiples = true;
        await form.parse(req, async function (err, fields, files) {
        const schema = Joi.object({
            id: Joi.number().required(),
            title: Joi.string().optional(),
            sub_title: Joi.string().optional(),
            //image: Joi.string().required(),
        });
        req.files = files;
        req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
                next()
    })
    },

    banner_status_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    blog_add:async (req, res, next) =>{
        var form = new formidable.IncomingForm();
        form.multiples = true;
        await form.parse(req, async function (err, fields, files) {
        const schema = Joi.object({
            category_id:Joi.number().optional(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            //image: Joi.string().required(),
        });
        req.files = files;
        req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
                next()
    })
    },
    blog_update:async (req, res, next) =>{
        var form = new formidable.IncomingForm();
        form.multiples = true;
        await form.parse(req, async function (err, fields, files) {
        const schema = Joi.object({
            id: Joi.number().required(),
            category_id: Joi.number().optional(),
            title: Joi.string().optional(),
            description: Joi.string().optional(),
            //image: Joi.string().required(),
        });
        req.files = files;
        req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
                next()
    })
    },

    blog_view_schema(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    blog_status_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),

        });
        validation(res, req, next, schema);
    },


    skill_add:async (req, res, next) =>{
        var form = new formidable.IncomingForm();
        form.multiples = true;
        await form.parse(req, async function (err, fields, files) {
        const schema = Joi.object({
            sub_cat_id: Joi.number().required(),
            skill_name: Joi.string().required(),
        });
        req.files = files;
        req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
                next()
    })
    },
    skill_list(req, res, next) {
        const schema = Joi.object({
            sub_cat_id:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    skill_status_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    cms_create(req, res, next) {
        const schema = Joi.object({
            title:Joi.string().required(),
            slug:Joi.string().required(),
            description:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    cms_view(req, res, next) {
        const schema = Joi.object({
            cms_id:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },
    cms_update(req, res, next) {
        const schema = Joi.object({
            cms_id:Joi.number().required(),
            title:Joi.string().optional(),
            description:Joi.string().optional(),
        });
        validation(res, req, next, schema);
    },

    faq_create(req, res, next) {
        const schema = Joi.object({
            detail:Joi.array().required(),
        });
        validation(res, req, next, schema);
    },

    faq_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            question:Joi.string().required(),
            answer:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },
    faq_delete(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    tag_add(req, res, next) {
        const schema = Joi.object({
            category_id:Joi.number().required(),
            tag_name:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },
    tag_list(req, res, next) {
        const schema = Joi.object({
            category_id:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    tag_status_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    education_add(req, res, next) {
        const schema = Joi.object({
            edu_name:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    education_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            edu_name:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },


    plan_add(req, res, next) {
        const schema = Joi.object({
            name:Joi.string().required(),
            plan_type:Joi.string().valid('Free', 'Paid').required(),
            total_price:Joi.number().required(),
            description:Joi.array().required(),
            duration:Joi.number().min(1).max(12).required(),
        });
        validation(res, req, next, schema);
    },

    plan_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            name:Joi.string().required(),
            plan_type:Joi.string().valid('Free', 'Paid').required(),
            total_price:Joi.number().required(),
            description:Joi.array().required(),
            duration:Joi.number().min(1).max(12).required(),
        });
        validation(res, req, next, schema);
    },

    neq_request_approve(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required().valid(1, 3),
        }).when(Joi.object({status: Joi.number().valid(3)}).unknown(), {
            then: Joi.object({
              reason: Joi.string().required(),
            })
          })
        validation(res, req, next, schema);
    },

    export_report_schema(req, res, next) {
        const schema = Joi.object({
            report:Joi.number().required(),
            startDate:Joi.string().required(),
            endDate:Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    expert_buyer_status(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },


    coupan_add(req, res, next) {
        const schema = Joi.object({
            title:Joi.string().required(),
            description:Joi.string().required(),
            expiry_date:Joi.string().required(),
            discount:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    coupan_status_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    admin_flash_status_update(req, res, next) {
        const schema = Joi.object({
            id:Joi.number().required(),
            status:Joi.number().required(),
        });
        validation(res, req, next, schema);
    },
}