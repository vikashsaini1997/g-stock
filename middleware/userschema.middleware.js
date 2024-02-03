const Joi = require('joi');
const { validation, validateAllFieldsRequests } = require("./validate.middleware")
var formidable = require('formidable');


module.exports = {
    loginschema(req, res, next) {
        const schema = Joi.object({
            email: Joi.string().required(),
            // .email({
            //     minDomainSegments: 2,
            //     tlds: {
            //        allow: ["com", "net", "in", "co"],
            //     },
            // }),
            password: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },
    registerschema(req, res, next) {
        const schema = Joi.object({
            role_id: Joi.number().required(),
            user_name: Joi.string().regex(/^[a-zA-Z]+([a-zA-Z0-9_]*[.-]?[a-zA-Z0-9_]*)*[a-zA-Z0-9]+$/).message(`Username should allow A-Z, a-z,0 to 9 and Special character Dot(.), Hyphen(-), and Underscore(_) and it should be of 3 - 55 characters.`).min(3).max(30).required(),
            email: Joi.string().required().email({
                minDomainSegments: 2,
                tlds: {
                    allow: ["com", "net", "in", "co"],
                },
            }),
            password: Joi.string().required().min(6)
                .max(16)
                .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{6,16}$/,
                    'password').message("Password should be between 6 to 16 characters including 1 uppercase, 1 lowercase, 1 special character, and 1 digit."),

        });
        validation(res, req, next, schema);
    },
    verifyotpschema(req, res, next) {
        const schema = Joi.object({
            email: Joi.string().required(),
            otp: Joi.string().required().messages({
                'string.base': ` OTP should not be empty.`,
                'string.empty': `OTP should not be empty.`,
                'any.required': `OTP is required`
            }),
        });
        validation(res, req, next, schema);
    },
    resendotpschema(req, res, next) {
        const schema = Joi.object({
            email: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },
    socialloginschema(req, res, next) {
        const schema = Joi.object({
            socialtype: Joi.number().required().valid(1, 2),
            role_id: Joi.number().optional(),
            email: Joi.string().optional(),
            firstName: Joi.string().optional(),
            lastName: Joi.string().optional(),
            profile_image: Joi.string().optional(),
        }).when(Joi.object({ socialtype: Joi.number().valid(1) }).unknown(), {
            then: Joi.object({
                google_id: Joi.string().required(),
            })
        }).when(Joi.object({ socialtype: Joi.number().valid(2) }).unknown(), {
            then: Joi.object({
                facebook_id: Joi.string().required(),
            })
        })
        validation(res, req, next, schema);
    },

    socialemailverify(req, res, next) {
        const schema = Joi.object({
            email: Joi.string().required(),
            google_id: Joi.string().optional(),
            facebook_id: Joi.string().optional(),
        });
        validation(res, req, next, schema);
    },
    completeprofile(req, res, next) {
        const schema = Joi.object({
            step: Joi.number().required().valid(1, 2, 3, 4, 5),
            id: Joi.number().required(),
        }).when(Joi.object({ step: Joi.number().valid(1) }).unknown(), {
            then: Joi.object({
                category_id: Joi.number().required(),
                sub_cat_id: Joi.number().required(),
                skills: Joi.array().required(),
            })
        }).when(Joi.object({ step: Joi.number().valid(2) }).unknown(), {
            then: Joi.object({
                profile_image: Joi.string().optional(),
                firstName: Joi.string().required(),
                lastName: Joi.string().required()
            })
        }).when(Joi.object({ step: Joi.number().valid(3) }).unknown(), {
            then: Joi.object({
                about: Joi.string().required(),
                experience: Joi.string().required(),
                education: Joi.array().required(),
                edu_docs: Joi.array().required(),
            })
        }).when(Joi.object({ step: Joi.number().valid(4) }).unknown(), {
            then: Joi.object({
                language: Joi.string().required(),
                dob: Joi.string().required(),
                country_id: Joi.number().required(),
                state_id: Joi.number().empty("").optional(),
                city_id: Joi.number().empty("").optional(),
                zip_code: Joi.number().required(),
                address: Joi.string().required(),
            })
        }).when(Joi.object({ step: Joi.number().valid(5) }).unknown(), {
            then: Joi.object({
                country_id: Joi.number().required(),
                state_id: Joi.number().optional(),
                city_id: Joi.number().optional(),
                zip_code: Joi.number().required(),
                address: Joi.string().required(),
            })
        })
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

    doc_upload: async (req, res, next) => {
        var form = new formidable.IncomingForm();
        form.multiples = true;
        var data = form.on('file', function (field, files) {
            return files.toJSON()
        })
        await form.parse(req, async function (err, fields, files) {
            let schema = Joi.object({
                file: Joi.string(),
            })
            req.files = data.openedFiles;
            req.body = validateAllFieldsRequests(res, { "body": fields }, next, schema);
            next()
        })
    },

    sub_category_list(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    subject_list(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    state_list(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    city_list(req, res, next) {
        const schema = Joi.object({
            state_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    jobpost_add(req, res, next) {
        const schema = Joi.object({
            userid: Joi.number().required(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            categoryid: Joi.number().required(),
            sub_cat_id: Joi.number().required(),
            school_id: Joi.number().required(),
            course_id: Joi.number().required(),
            subject_id: Joi.number().required(),
            tags: Joi.array().required(),
            due_date: Joi.string().required(),
            budget: Joi.number().required(),
            country_id: Joi.number().required(),
            state_id: Joi.number().empty("").optional(),
            writingservice: Joi.number().required(),
            docs: Joi.array().optional(),
        });
        validation(res, req, next, schema);

    },
    jobview(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
            user_id: Joi.number().optional()
        });
        validation(res, req, next, schema);
    },

    simmilarjob(req, res, next) {
        const schema = Joi.object({
            category_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    cancelbid(req, res, next) {
        const schema = Joi.object({
            jobbid_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    postedjobcancel(req, res, next) {
        const schema = Joi.object({
            job_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    postedjobview(req, res, next) {
        const schema = Joi.object({
            job_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    postedjob_bidlist(req, res, next) {
        const schema = Joi.object({
            job_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    reject_hire_bid(req, res, next) {
        const schema = Joi.object({
            job_id: Joi.number().required(),
            bid_id: Joi.number().required(),
            status: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },


    jobbid_add(req, res, next) {
        const schema = Joi.object({
            userid: Joi.number().required(),
            jobid: Joi.number().required(),
            bidamount: Joi.number().required(),
            deliverydate: Joi.string().required(),
            proposal: Joi.string().required(),
            docs: Joi.array().optional(),
        });
        validation(res, req, next, schema);
    },

    bid_view(req, res, next) {
        const schema = Joi.object({
            id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    skill_list(req, res, next) {
        const schema = Joi.object({
            sub_cat_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    tags_list(req, res, next) {
        const schema = Joi.object({
            category_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    card_add(req, res, next) {
        const schema = Joi.object({
            cardNumber: Joi.number().required(),
            expMonth: Joi.number().required(),
            expYear: Joi.number().required(),
            cvc: Joi.number().required(),
            customerId: Joi.string().required(),
            cardHoldername: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    getallcard(req, res, next) {
        const schema = Joi.object({
            customerId: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    deletecard(req, res, next) {
        const schema = Joi.object({
            customerId: Joi.string().required(),
            cardId: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    cardupdate(req, res, next) {
        const schema = Joi.object({
            customerId: Joi.string().required(),
            cardId: Joi.string().required(),
            cardHoldername: Joi.string().optional().allow(""),
            expiry_year: Joi.number().optional().allow(""),
            expiry_month: Joi.number().optional().allow(""),
        });

        validation(res, req, next, schema);
    },

    payment(req, res, next) {
        const schema = Joi.object({
            // plan_type: Joi.string().valid('free', 'paid').required(),
            user_id: Joi.number().required(),
            plan_id: Joi.number().required(),
            amount: Joi.number().required(),
            // cardId: Joi.string().required().when('plan_type', { is: 'paid', then: Joi.required() }),
            paymentSourceId: Joi.string().optional(),
            paymentSourceType: Joi.string().valid('card', 'bank').optional(),
            customerId: Joi.string().optional()
            // description: Joi.string().optional(),
        });
        validation(res, req, next, schema);
    },

    bankaccountadd(req, res, next) {
        const schema = Joi.object({
            customerId: Joi.string().required(),
            user_id: Joi.number().required(),
            account_holder_name: Joi.string().required(),
            routing_number: Joi.string().required(),
            account_number: Joi.string().required()
        });
        validation(res, req, next, schema);
    },

    bankaccountupdate(req, res, next) {
        const schema = Joi.object({
            customerId: Joi.string().required(),
            bank_account_id: Joi.string().required(),
            user_id: Joi.number().required(),
            account_holder_name: Joi.string().required(),
            routing_number: Joi.string().required(),
            account_number: Joi.string().required()
        });
        validation(res, req, next, schema);
    },

    bankaccountverify(req, res, next) {
        const schema = Joi.object({
            customerId: Joi.string().required(),
            bankAccountId: Joi.string().required(),
            amount_1: Joi.string().required(),
            amount_2: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    bankaccountlist(req, res, next) {
        const schema = Joi.object({
            customerId: Joi.string().required(),
            user_id: Joi.number().required(),
        });
        validation(res, req, next, schema);
    },

    bankaccountdelete(req, res, next) {
        const schema = Joi.object({
            customerId: Joi.string().required(),
            bank_account_id: Joi.string().required(),
        });
        validation(res, req, next, schema);
    },

    study_resource_upload: async (req, res, next) => {
        let schema = Joi.object({
            user_id: Joi.number().required(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            category_id: Joi.number().required(),
            sub_cat_id: Joi.number().required(),
            skills: Joi.array().required(),
            tags: Joi.array().required(),
            type: Joi.array().required(),
            school_id: Joi.number().required(),
            course_id: Joi.number().required(),
            subject_id: Joi.number().required(),
            country_id: Joi.number().required(),
            state_id: Joi.number().optional(),
            price: Joi.number().optional(),
            isFree: Joi.number().required(),
            doc_url: Joi.array().required(),
        })
        validation(res, req, next, schema);
    },

    flash_card_upload: async (req, res, next) => {
        let schema = Joi.object({
            user_id: Joi.number().required(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            terms: Joi.array().required(),
            terms_count: Joi.number().required(),
            category_id: Joi.number().required(),
            sub_cat_id: Joi.number().required(),
            skills: Joi.array().required(),
            tags: Joi.array().required(),
            type: Joi.array().required(),
            school_id: Joi.number().required(),
            course_id: Joi.number().required(),
            subject_id: Joi.number().required(),
            country_id: Joi.number().required(),
            state_id: Joi.number().allow("").optional(),
            price: Joi.number().optional(),
            isFree: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    flash_card_update: async (req, res, next) => {
        let schema = Joi.object({
            flash_card_id: Joi.number().required(),
            //user_id: Joi.number().optional(),
            title: Joi.string().required(),
            description: Joi.string().required(),
            terms: Joi.array().required(),
            terms_count: Joi.number().required(),
            category_id: Joi.number().required(),
            sub_cat_id: Joi.number().required(),
            skills: Joi.array().required(),
            tags: Joi.array().required(),
            type: Joi.array().required(),
            school_id: Joi.number().required(),
            course_id: Joi.number().required(),
            subject_id: Joi.number().required(),
            country_id: Joi.number().required(),
            state_id: Joi.number().allow("").optional(),
            price: Joi.number().optional(),
            isFree: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    flash_card_delete: async (req, res, next) => {
        let schema = Joi.object({
            flash_card_id: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    study_res_delete: async (req, res, next) => {
        let schema = Joi.object({
            study_res_id: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    addcart(req, res, next) {
        const schema = Joi.object({
            doc_type: Joi.number().required().valid(2, 3),
            user_id: Joi.number().required(),
        }).when(Joi.object({ doc_type: Joi.number().valid(3) }).unknown(), {
            then: Joi.object({
                flash_card_id: Joi.number().required(),
            })
        }).when(Joi.object({ doc_type: Joi.number().valid(2) }).unknown(), {
            then: Joi.object({
                study_res_id: Joi.number().required(),
            })
        })
        validation(res, req, next, schema);
    },

    cartdelete: async (req, res, next) => {
        let schema = Joi.object({
            cart_id: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    addressadd: async (req, res, next) => {
        let schema = Joi.object({
            full_name: Joi.string().required(),
            phone_code: Joi.string().optional(),
            phone_no: Joi.string().optional(),
            address: Joi.string().required(),
            country_id: Joi.number().required(),
            state_id: Joi.number().allow("").optional(),
            city_id: Joi.number().allow("").optional(),
            zip_code: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    address_update: async (req, res, next) => {
        let schema = Joi.object({
            user_id: Joi.number().required(),
            address_id: Joi.number().required(),
            full_name: Joi.string().required(),
            phone_code: Joi.string().optional(),
            phone_no: Joi.string().optional(),
            address: Joi.string().required(),
            country_id: Joi.number().required(),
            state_id: Joi.number().optional(),
            city_id: Joi.number().optional(),
            zip_code: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    address_delete: async (req, res, next) => {
        let schema = Joi.object({
            address_id: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    favourite_schema: async (req, res, next) => {
        let schema = Joi.object({
            user_id: Joi.number().required(),
            doc_type: Joi.number().required(),
            doc_id: Joi.number().required(),
            status: Joi.number().required(),
        })
        validation(res, req, next, schema);
    },

    cart_payment: async (req, res, next) => {
        let schema = Joi.object({
            amount: Joi.number().required(),
            cardId: Joi.string().optional(),
            bankId: Joi.string().optional(),
            customerId: Joi.string().required(),
            //description: Joi.number().required(),          
        })
        validation(res, req, next, schema);
    },



}