const express = require("express");
const bcrypt = require("bcryptjs");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;
const config = require("../../config/config.js")
const jwt = require("jsonwebtoken");
const randtoken = require("rand-token");
const db = require("../../models");
const moment = require('moment')
const { response, error, sendmails } = require("../../helper/helper");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);




module.exports = {

    login: async (req, res, next) => {
        try {
            const params = req.body;

            const user = await db.User.findOne({
                attributes: { exclude: ['auth_token', "about", "address", "category_id", "city_id", "country_id", "createdAt", "forgot_token", "language", "level", "occupation", "otp", "state_id", "sub_cat_id", "total_earning", "updatedAt", "zip_code", "membership_status"] },
                where: {
                    [Op.or]: [
                        {
                            email: params.email,
                            role_id: [2, 3]
                        }, {
                            user_name: params.email,
                            role_id: [2, 3]
                        }
                    ]
                },
                include: [
                    { model: db.user_plan, attributes: ["type", "status"] }
                ]
            })

            if (!user) {
                let message = "Please enter the correct Username or Email.";
                return res.status(400).send(error({}, message))
            }

            if (!(await bcrypt.compare(params.password, user.password))) {
                let message = "Please enter correct password";
                return res.status(400).send(error({}, message))
            }

            if (user.status == 2) { //inactive
                let message = "Your account is Inactive. Please contact to support team.";
                return res.status(400).send(error({}, message))
            }else if (user.status == 3) { //Rjected
                let message = "Your profile has been Rejected. Please contact to support team.";
                return res.status(400).send(error({}, message))
            }

            

            if (user.is_verify === 0) {
                var otp = Math.floor(1000 + Math.random() * 9000);
                params.otp = otp
                const update = await db.User.update({
                    otp: otp,
                }, {
                    where: {
                        [Op.or]: [
                            {
                                email: params.email
                            }, {
                                user_name: params.email
                            }
                        ]
                    },
                })

                const detail = { template_code: "OTP", otp: otp, username: user.user_name }
                sendmails(user.email, detail)

                successMessage = "Please verify your OTP."
                return res.send(response(user, successMessage))
            } else {

                const token = jwt.sign({
                    sub: user.id,
                    role_id: user.role_id
                }, config.secret, {
                    expiresIn: "1d",
                });

                var data = {
                    ...omitHash(user.get()),
                    token,
                };

                await db.User.update({
                    auth_token: token
                }, {
                    where: {
                        [Op.or]: [
                            {
                                email: params.email
                            }, {
                                user_name: params.email
                            }
                        ]
                    }
                })

                var message = ""
                if (user.complete_profile == 0) {
                    message = "Plese complete your profile first"
                } else {
                    message = "You are logged in successfully"
                }

                return res.send(response(data, message));
            }


        } catch (error) {
            next(error)
        }
    },

    register: async (req, res, next) => {
        try {
            const params = req.body;
            //params.role_id = 2
            //params.status = 1
            params.is_verify = false
            if (params.role_id == 2) {
                params.complete_profile = 1
            }
            params.password = await bcrypt.hash(params.password, 10);

            const emailfind = await db.User.findOne({
                where: { email: params.email }
            })

            if (emailfind) {
                let message = "Email id already use. Kindly use another email id ";
                return res.status(400).send(error({}, message))
            }

            const userName = await db.User.findOne({
                where: { user_name: params.user_name }
            })

            if (userName) {
                let message = "Username already use. Kindly use another username ";
                return res.status(400).send(error({}, message))
            }
            var otp = Math.floor(1000 + Math.random() * 9000);
            params.otp = otp

            const customer = await stripe.customers.create({
                email: params.email,
            });
            params.customerid = customer.id

            await db.User.create(params);

            const detail = { template_code: "OTP", otp: otp, username: params.user_name }
            sendmails(params.email, detail)

            successMessage = "Please verify your OTP."
            return res.send(response({}, successMessage))

        } catch (error) {
            console.log(error)
            next(error)
        }
    },

    verifyotp: async (req, res, next) => {
        try {
            const params = req.body;
            params.is_verify = true;

            const user = await db.User.findOne({
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                }
            });

            if (!user) {
                let message = "Account doesn't exist.";
                return res.status(400).json({ status: false, status_code: 400, message: message });
            }

            if (user.otp != params.otp) {
                let message = "Invalid OTP. Please try again.";
                return res.status(400).json({ status: false, status_code: 400, message: message });
            }

            const token = jwt.sign({
                sub: user.id,
                role_id: user.role_id
            }, config.secret, {
                expiresIn: "1d",
            });

            if (user.role_id == 2) {
                params.status = 1
            }

            if (user.role_id == 3) {
                params.status = 0
            }
            params.otp = 0;
            const update = await db.User.update({
                otp: 0,
                status: params.status,
                is_verify: true,
                auth_token: token
            }, {
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                },
            })
            const user_data = await db.User.findOne({
                attributes: { exclude: ['auth_token', "about", "address", "category_id", "city_id", "country_id", "createdAt", "forgot_token", "language", "level", "occupation", "otp", "state_id", "sub_cat_id", "total_earning", "updatedAt", "zip_code", "membership_status"] },
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                }
            });

            var data = {
                ...omitHash(user_data.get()),
                token,
            };
            const Registraion = { template_code: "REGISTRATION", username: user.user_name }
            sendmails(user_data.email, Registraion)

            let successMessage = ""
            if (user.complete_profile == 0) {
                successMessage = "please complete your profile first";
            } else {
                successMessage = "Your account registered successfully";
            }
            return res.send(response(data, successMessage));

        } catch (error) {
            next(error);
        }
    },

    resendotp: async (req, res, next) => {
        try {
            const params = req.body;


            const user = await db.User.findOne({
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                }
            });

            if (!user) {
                throw "Account doesn't exist."
            }

            var otp = Math.floor(1000 + Math.random() * 9000);
            params.otp = otp;

            await db.User.update({
                otp
            }, {
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                }
            });

            const detail = { template_code: "OTP", otp: otp, username: user.user_name }
            sendmails(user.email, detail)
            return res.send(response({}, "OTP has been resend successfully on your email."));
        } catch (error) {
            next(error);
        }
    },

    complet_profile: async (req, res, next) => {
        try {
            const params = req.body;

            const user = await db.User.findOne({
                where: { id: params.id }
            })

            if (!user) {
                throw "Account dose not exist"
            }



            if (params.step == 1) {

                const categoryupdate = await db.User.update({
                    category_id: params.category_id,
                    sub_cat_id: params.sub_cat_id,
                    complete_profile: 1
                }, {
                    where: { id: params.id }
                })
                //category skill update//
                const skill_check = await db.user_skill.findOne({
                    where: { user_id: params.id }
                })

                if (skill_check) {
                    await db.user_skill.destroy({
                        where: { user_id: params.id }
                    })

                    params.skills.map((item) => {
                        db.user_skill.create({
                            user_id: params.id,
                            category_id: params.category_id,
                            skill_id: item
                        })
                    })
                } else {
                    params.skills.map((item) => {
                        db.user_skill.create({
                            user_id: params.id,
                            category_id: params.category_id,
                            skill_id: item
                        })
                    })
                }
                return res.send(response({}, "Step 1 added successfully"));
            }
            if (params.step == 2) {
                //profile name update//
                const detail_add = await db.User.update({
                    profile_image: params.profile_image,
                    firstName: params.firstName,
                    lastName: params.lastName,
                    complete_profile: 2
                }, {
                    where: { id: params.id }
                })

                return res.send(response({}, " Step 2 added successfully"));
            }
            if (params.step == 3) {
                //experience and education update//
                const edu_check = await db.user_education.findOne({
                    where: { user_id: params.id }
                })

                const edu_docs = await db.education_doc.findOne({
                    where: { user_id: params.id }
                })

                //user table update//
                const detail_add = await db.User.update({
                    about: params.about,
                    experience: params.experience,
                    complete_profile: 3
                }, {
                    where: { id: params.id }
                })

                //education check//
                if (edu_check) {
                    await db.user_education.destroy({
                        where: { user_id: params.id }
                    })

                    params.education.map(async (item) => {
                        await db.user_education.create({
                            user_id: params.id,
                            education_id: item,
                        })
                    })
                } else {
                    params.education.map(async (item) => {
                        await db.user_education.create({
                            user_id: params.id,
                            education_id: item,
                        })
                    })
                }

                //education document check//
                //if(params.edu_docs){
                if (edu_docs) {
                    db.education_doc.destroy({
                        where: { user_id: params.id }
                    })
                }

                if (params.edu_docs) {
                    params.edu_docs.map((item) => {
                        db.education_doc.create({
                            user_id: params.id,
                            file_url: item.file_url,
                            name: item.name,
                            size: item.size
                        })
                    })
                }

                return res.send(response({}, " Step 3 added successfully"));
            }
            if (params.step == 4) {
                //add language and dob//
                const detail_add = await db.User.update({
                    language: params.language,
                    dob: params.dob,
                    country_id: params.country_id,
                    state_id: params.state_id,
                    city_id: params.city_id,
                    zip_code: params.zip_code,
                    address: params.address,
                    complete_profile: 4,
                }, {
                    where: { id: params.id }
                })

                const data = await db.User.findByPk(params.id, {
                    attributes: { exclude: ['auth_token', "about", "address", "category_id", "city_id", "country_id", "createdAt", "forgot_token", "language", "level", "occupation", "otp", "state_id", "sub_cat_id", "total_earning", "updatedAt", "zip_code", "membership_status"] },
                })
                return res.send(response(data, " Step 4 added successfully"));
            } else {
                let message = "Dose not exist";
                return res.status(400).json({ status: false, status_code: 400, message: message });
            }
        } catch (error) {
            next(error)
        }
    },

    resend_email: async (req, res, next) => {
        try {
            const params = req.body;


            const user = await db.User.findOne({
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                }
            });

            if (!user) {
                throw "Account doesn't exist."
            }

            // var otp = Math.floor(1000 + Math.random() * 9000);
            // params.otp = otp;

            var token = randtoken.generate(25);

            await db.User.update({
                forgot_token: token
            }, {
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                }
            });

            const detail = { template_code: "COMPLETE_PROFILE", verify_token: token, username: user.user_name }
            sendmails(user.email, detail)
            return res.send(response({}, "OTP has been resend successfully on your email."));
        } catch (error) {
            next(error);
        }
    },

    change_email: async (req, res, next) => {
        try {
            const params = req.body;

            const user = await db.User.findOne({
                where: { email: params.email }
            })

            if (user) {
                var message = "Email already use please use another email";
                return res.status(400).send(error({}, message))
            }

            var token = randtoken.generate(25);

            await db.User.update({
                email: params.email,
                forgot_token: token
            }, {
                where: { id: params.id }
            })

            const data = await db.User.findByPk(params.id)

            const detail = { template_code: "COMPLETE_PROFILE", verify_token: token, username: user.user_name }
            sendmails(params.email, detail)

            successMessage = "Email update successfully please check your email"
            return res.send(response(data, successMessage))

        } catch (error) {
            next(error)
        }
    },

    user_data_get: async (req, res, next) => {
        try {
            const params = req.body;
            const userId = req.user.id

            const data = await db.User.findOne({
                attributes: ["id", "firstName", "lastName", "role_id", "email", "profile_image", "address", "status", "is_verify", "complete_profile", "about", "experience", "language", "dob", "category_id", "sub_cat_id", "country_id", "state_id", "city_id", "zip_code"],
                where: { id: userId },
                include: [
                    {
                        model: db.user_skill,
                        attributes: ["category_id", 'skill_id'],
                        include: [
                            {
                                model: db.skill,
                                attributes: ["skill_name"]
                            },
                            {
                                model: db.category,
                                attributes: ["category_name"]
                            },
                        ]
                    },
                    {
                        model: db.subcategory,
                        attributes: ["sub_cat_name"]
                    },
                    {
                        model: db.user_education,
                        attributes: ["education_id"],
                        include: [
                            {
                                model: db.education,
                                attributes: ["edu_name"]
                            }
                        ]
                    },
                    {
                        model: db.education_doc,
                        attributes: ["file_url", "name", "size"]
                    },
                    {
                        model: db.country,
                        attributes: ["country_name"]
                    },
                    {
                        model: db.state,
                        attributes: ["state_name"]
                    },
                ],
            })

            successMessage = "success"
            return res.send(response(data, successMessage))

        } catch (error) {
            next(error)
        }
    },

    verify_user: async (req, res, next) => {
        try {
            const params = req.body
            const user = await db.User.findOne({
                where: {
                    forgot_token: params.token
                }
            })
            if (!user) {
                var message = "Link expired resend again";
                return res.status(400).send(error({}, message))
            }

            await db.User.update({
                forgot_token: ""
            }, {
                where: {
                    forgot_token: params.token,
                }
            });
            var message = "User verify successfully"
            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },

    forgotpassword: async (req, res, next) => {
        try {
            const params = req.body


            const user = await db.User.findOne({
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                }
            })
            if (!user) {
                var message = "Your Email is not registered with us";
                return res.status(400).send(error({}, message))
            }
            var token = randtoken.generate(25);
            var forgottoken = token
            const detail = { template_code: "FORGOT PASSWORD", token: forgottoken, username: user.user_name }
            sendmails(user.email, detail)

            const update = await db.User.update({
                forgot_token: forgottoken
            }, {
                where: {
                    [Op.or]: [
                        {
                            email: params.email
                        }, {
                            user_name: params.email
                        }
                    ]
                }
            })

            successMessage = "Mail sent sucessfully"
            return res.send(response({}, successMessage))

        } catch (error) {
            next(error)
        }
    },

    updatepassword: async (req, res, next) => {
        try {
            params = req.body
            const user = await db.User.findOne({
                where: {
                    forgot_token: params.token
                }
            })
            if (!user) {
                var message = "Link expired resend again";
                return res.status(400).send(error({}, message))
            }

            if (params.password != params.confirm_password) {
                var message = "Password and confirm password does not match";
                return res.status(400).send(error({}, message))
            }

            const oldpassword_check = await bcrypt.compare(params.password, user.password)
            if (oldpassword_check) {
                let message = "The new password you entered is the same as your old password. Enter a different password.";
                return res.send(error({}, message))
            }

            params.password = await bcrypt.hash(params.password, 10);

            await db.User.update({
                password: params.password,
                forgot_token: ""
            }, {
                where: {
                    forgot_token: params.token,
                }
            });
            var message = "Password update successfully"
            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },

    changePassword: async (req, res, next) => {
        try {
            const { id } = req.user;
            const params = req.body;

            const user = await db.User.findOne({
                where: { id: id }
            })

            if (!user)
                throw "Account doesn't exist.";

            if (!(await bcrypt.compare(params.current_password, user.password))) {
                var message = "Current password is incorrect.";
                return res.status(400).send(error({}, message))
            }
            if (params.password != params.confirm_password) {
                var message = "New password and confirm password does not match";
                return res.status(400).send(error({}, message))
            }
            params.password = await bcrypt.hash(params.password, 10);

            Object.assign(user, params);
            await user.save();
            return res.send(response({}, "Password changed successfully."));
        } catch (error) {
            next(error)

        }
    },

    logout: async (req, res, next) => {
        try {
            const authHeader = req.headers["authorization"];
            jwt.sign(authHeader, "", { expiresIn: 1 }, (logout, err) => {
                if (logout) {
                    res.send({ message: 'You have been Logged Out' });
                } else {
                    res.send({ message: 'Error' });
                }
            });
        } catch (error) {
            next(error)
        }
    },

    sociallogin: async (req, res, next) => {
        try {
            const params = req.body;
            var whereNew = ""

            if (params.role_id) {
                if (params.role_id == 2) {
                    params.status = 1
                }
            } else {
                params.role_id = 2
                params.status = 1
            }


            if (params.google_id) {
                whereNew = {
                    google_id: params.google_id
                }
            }

            if (params.facebook_id) {
                whereNew = {
                    facebook_id: params.facebook_id
                }
            }

            var user = await db.User.findOne({
                attributes: { exclude: ['auth_token'] },
                where: whereNew
            })
            console.log("test")

            if (user) {
                if (user.is_verify == 1) {
                    const token = jwt.sign({
                        sub: user.id,
                        role_id: user.role_id
                    }, config.secret, {
                        expiresIn: "1d",
                    });

                    var data = {
                        ...omitHash(user.get()),
                        token,
                    };

                    // const data = { user, token }

                    message = "You are logged in successfully"
                    return res.send(response(data, message));
                } else {
                    //token generate//
                    message = "Please complete your profile"
                    return res.send(response(user, message));
                }
            } else {
                if (params.email) {
                    console.log("1st>>>>>>")
                    params.is_verify = true
                    const usercreate = await db.User.create(params)

                    if (usercreate) {
                        var token = jwt.sign({
                            sub: usercreate.id,
                            role_id: usercreate.role_id
                        }, config.secret, {
                            expiresIn: "1d",
                        });

                        if (token) {
                            var update = await db.User.update({
                                auth_token: token
                            }, {
                                where: {
                                    id: usercreate.id
                                },
                            })
                        }
                    }
                    var user = await db.User.findOne({
                        attributes: { exclude: ['auth_token'] },
                        where: { email: params.email }
                    })
                    // const data = { user, token }

                    var data = {
                        ...omitHash(user.get()),
                        token,
                    };

                    message = "You are logged in successfully"
                    return res.send(response(data, message));

                } else {
                    console.log("2nd>>>")
                    const usercreate = await db.User.create(params)

                    message = "Please complete your profile"
                    return res.send(response(usercreate, message));
                }

            }

        } catch (error) {
            console.log(error)
            next(error)
        }
    },

    social_email_verify: async (req, res, next) => {
        try {
            const params = req.body;
            var otp = Math.floor(1000 + Math.random() * 9000);
            params.otp = otp
            var whereUpdate = ""

            if (params.google_id) {
                whereUpdate = {
                    google_id: params.google_id
                }
            }
            if (params.facebook_id) {
                whereUpdate = {
                    facebook_id: params.facebook_id
                }
            }

            const emailcheck = await db.User.findOne({
                where: {
                    email: params.email
                }
            })

            if (emailcheck) {
                let message = "Email id already use. Kindly use another email id ";
                return res.status(400).send(error({}, message))
            }

            const user_check = await db.User.findOne({
                where: whereUpdate
            })

            if (!user_check) {
                let message = "Account doesn't exist.";
                return res.status(400).send(error({}, message))
            }

            const update = await db.User.update({
                email: params.email,
                otp: params.otp
            }, {
                where: whereUpdate
            })

            const detail = { template_code: "OTP", otp: otp, username: user_check.firstName }
            sendmails(params.email, detail)

            successMessage = "Please verify your OTP."
            return res.send(response({}, successMessage))

        } catch (error) {
            next(error)
        }
    },

    getallcategory: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.category.findAll({
                where: {
                    status: 1
                },
                attributes: { exclude: ['createdAt', "updatedAt"] },
            })

            return res.send(response(list));

        } catch (error) {
            next(error)
        }
    },

    getsubcategory: async (req, res, next) => {
        try {
            const params = req.body

            const list = await db.subcategory.findAll({
                attributes: { exclude: ['createdAt', "updatedAt"] },
                where: { cat_id: params.id ,status:1}
            })

            return res.send(response(list));

        } catch (error) {
            next(error)
        }
    },

    school_list: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.school.findAll()

            return res.send(response(list));

        } catch (error) {
            next(error)
        }
    },

    course_list: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.course.findAll()

            return res.send(response(list));

        } catch (error) {
            next(error)
        }
    },

    subject_list: async (req, res, next) => {
        try {
            const params = req.body

            const list = await db.subject.findAll({
                where: { course_id: params.id }
            })

            return res.send(response(list));

        } catch (error) {
            next(error)
        }
    },

    country_list: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.country.findAll()

            return res.send(response(list));

        } catch (error) {
            next(error)
        }
    },

    state_list: async (req, res, next) => {
        try {
            const params = req.body

            const list = await db.state.findAll({
                where: { country_id: params.id }
            })

            return res.send(response(list));

        } catch (error) {
            next(error)
        }
    },

    city_listing: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.city.findAll({
                where: { state_id: params.state_id },
                order: [["createdAt", "DESC"]]
            });

            return res.send(response(list, "City list get successfully"));
        } catch (error) {
            next(error)
        }
    },

    banner_listing: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.admin_banner.findAll({
                attributes: { exclude: ['createdAt', "updatedAt", "status"] },
                where: { status: 1 },
                order: [["createdAt", "DESC"]]
            });

            return res.send(response(list, "Banner list get successfully"));
        } catch (error) {
            next(error)
        }
    },

    skills_listing: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.skill.findAll({
                where: { status: 1, sub_cat_id: params.sub_cat_id },
                order: [["createdAt", "DESC"]]
            });

            return res.send(response(list, "Skills list get successfully"));
        } catch (error) {
            next(error)
        }
    },

    cmspageview: async (req, res, next) => {
        try {
            const slug = req.params.slug
            const data = await db.cms.findOne({
                where: {
                    slug: slug,
                }
            });

            if(!data){
                return res.status(400).send(error({}, "Slug not found"))  
            }
            return res.send(response(data, "CMS list view"));

        } catch (error) {
            next(error)
        }
    },

    faq_list: async (req, res, next) => {
        try{
            const params = req.body;

            const list = await db.faq.findAll()

            return res.send(response(list, "Faq list get successfully"));

        }catch(error){
            next(error)
        }
    },

    tags_listing: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.admin_tag.findAll({
                where: { status: 1, category_id: params.category_id },
                order: [["createdAt", "DESC"]]
            });

            return res.send(response(list, "Tags list get successfully"));
        } catch (error) {
            next(error)
        }
    },

    all_tags_listing: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.admin_tag.findAll({
                where: { status: 1 },
                order: [["tag_name", "ASC"]]
            });

            return res.send(response(list, "Tags list get successfully"));
        } catch (error) {
            next(error)
        }
    },

    education_listing: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.education.findAll({
                attributes: ["id", "edu_name"],
                order: [["createdAt", "DESC"]]
            });

            return res.send(response(list, "Education list get successfully"));

        } catch (error) {
            next(error)
        }
    },

    card_add: async (req, res, next) => {
        try {
            const { cardNumber, expMonth, expYear, cvc, customerId, cardHoldername } = req.body

            // const customer = await stripe.customers.create({
            //     email: params.email,
            //   });
            //   console.log(customer)

            const cardToken = await stripe.tokens.create({
                card: {
                    number: cardNumber,
                    exp_month: expMonth,
                    exp_year: expYear,
                    cvc: cvc,
                    name: cardHoldername
                },
            });

            const paymentMethod = await stripe.customers.createSource(customerId,
                { source: cardToken.id }
            );

            //for default method//
            // const customer = await stripe.customers.update("cus_Ni7Twamy6xaltf", {
            //     invoice_settings: {
            //       default_payment_method: "card_1MwhdWDT9oMl24ASZEsAZiGY",
            //     },
            //   });

            return res.send(response({}, "Card add successfully"));

        } catch (err) {
            return res.status(400).send(error({}, "Invalid card details Please try again"))
        }
    },

    all_card_list: async (req, res, next) => {
        try {
            const { customerId } = req.body

            //all cards get//
            const cards = await stripe.customers.listSources(customerId,
                { object: 'card', limit: 3 }
            );

            return res.send(response(cards, "Card list get successfully"));

        } catch (err) {
            return res.status(400).send(error({}, err.message))
        }
    },

    delete_card: async (req, res, next) => {
        try {
            const { customerId, cardId } = req.body

            const deleted = await stripe.customers.deleteSource(
                customerId, cardId
            );

            return res.send(response(deleted, "Card delete successfully"));

        } catch (err) {
            return res.status(400).send(error({}, err.message))
        }
    },

    update_card: async (req, res, next) => {
        try {
            const { cardId, customerId, cardHoldername, expiry_year, expiry_month } = req.body;

            const card = await stripe.customers.updateSource(
                customerId, cardId,
                {
                    name: cardHoldername,
                    exp_year: expiry_year,
                    exp_month: expiry_month
                }
            );

            return res.send(response(card, "Card update successfully"));

        } catch (err) {
            return res.status(400).send(error({}, err.message))
            next(error)
        }

    },

    payment: async (req, res, next) => {
        try {
            const { user_id, plan_id, amount, paymentSourceId, paymentSourceType, customerId } = req.body

            const plancheck = await db.membership_plan.findOne({
                where: { id: plan_id }
            })

            if (!plancheck) {
                return res.status(400).send(error({}, "Please enter valid plan"))
            }

            var check = await db.user_plan.findOne({
                where: { user_id: user_id }
            })

            const days = plancheck.duration * 30
            let currentDate = moment().format('yyyy-MM-DD');
            var end_date = moment().add({ days }).format('yyyy-MM-DD')

            const user_plan = {
                user_id: user_id,
                plan_id: plan_id,
                start_date: currentDate,
                end_date: end_date,
                type: plancheck.plan_type == "Free" ? "free" : "paid",
                status: 1,
                bid: plancheck.plan_type == "Free" ? 15 : 0,
            }

            if (plancheck.plan_type == "Free") {
                if (check) {
                    await db.user_plan.update(user_plan, {
                        where: { user_id: user_id }
                    })
                } else {
                    await db.user_plan.create(user_plan)
                }

                const detail_add = await db.User.update({
                    complete_profile: 6,
                }, {
                    where: { id: user_id }
                })

                return res.send(response({}, "success"));
            } else {
                const charge = await stripe.charges.create({
                    amount: amount,
                    currency: 'usd',
                    source: paymentSourceId,
                    customer: customerId,
                    // description: description,
                }).then(async (chargedetail) =>  {
                    // Handle the resolved value (bankAccount) here
                    if (chargedetail.status == "succeeded") {
                        if (check) {
                            await db.user_plan.update(user_plan, {
                                where: { user_id: user_id }
                            })
                        } else {
                            await db.user_plan.create(user_plan)
                        }
    
                        const detail_add = await db.User.update({
                            complete_profile: 6,
                        }, {
                            where: { id: user_id }
                        })
    
                        return res.send(response(chargedetail, "success"));
                    }else if(chargedetail.status == "pending"){
                        return res.send(response(chargedetail, "Payment is pending"));
                    } else {
                        return res.status(400).send(error({}, "Please try again"))
                    }
                })
                .catch((err) => {
                    console.log('error');
                    // Handle any errors that occur during verification
                    return res.status(400).send(error({}, "Please try again"))
                });
            }

        } catch (err) {
            return res.status(400).send(error({}, err.message))
        }
    },

    plan_listing: async (req, res, next) => {
        try {
            const userId = req.user.id

            const list = await db.membership_plan.findAll({
                attributes: { exclude: ['createdAt', "updatedAt"] },
                where: { status: 1 },
            });

            const userselectedplan = await db.user_plan.findOne({
                attributes:["id","user_id","plan_id","start_date","end_date","type","status"],
                where:{
                    user_id:userId,
                    status:1
                },
                include:[
                    {
                        model:db.membership_plan,
                        attributes: { exclude: ['createdAt', "updatedAt"] },
                    }
                ]
            })

            const data = {
                list,userselectedplan
            }
            var message = "Plan list get successfully"
            return res.send(response(data, message));

        } catch (error) {
            next(error)
        }
    },

    plan_status_update: async (req, res, next) => {
        try {
            const currentDate = new Date();
            const beforeDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000); // Get the date before the current date
            console.log(currentDate)
            console.log(beforeDate)
            const plan_check = await db.user_plan.findAll({
                where: {
                    status: 1,
                    end_date: { [Op.lt]: beforeDate }
                }
            })

            plan_check.map(async (item) => {
                console.log(item.dataValues)
                await db.user_plan.update({
                    status: 0
                }, {
                    where: {
                        user_id: item.user_id
                    }
                })

            })

        } catch (error) {
            next(error)
        }
    },

    payout: async (req, res, next) => {
        try {
            //const params = req.body;
            console.log("test")

            //User account create//
            // const bankAccount = await stripe.customers.createSource(
            //     'acct_1ND4qAQe6FgVcAy7',
            //    { source:{
            //         object:"bank_account",
            //         country:"US",
            //         currency:"usd",
            //         account_number:"000999999991",
            //         routing_number:"111000000",
            //         account_holder_name:"test",
            //         account_holder_type:"individual"

            //     }
            // });

            // console.log(bankAccount)

            //stripe balance check//
            const balance = await stripe.balance.retrieve();
            // console.log(balance)


            // const token = await stripe.tokens.create({
            //     bank_account: {
            //       country: 'US',
            //       currency: 'usd',
            //       account_holder_name: 'Jenny Rosen',
            //       account_holder_type: 'individual',
            //       routing_number: '110000000',
            //       account_number: '000123456789',
            //     },
            //   });

            //   console.log(token)
            //acct account check//
            // const account = await stripe.accounts.retrieve('acct_1ND2FOQjoOyZArsw');
            // console.log(account)

            //stripe acct account create api//
            // const account = await stripe.accounts.create({
            //     country: 'US',
            //     type: 'custom',
            //     capabilities: {
            //       card_payments: {
            //         requested: true,
            //       },
            //       transfers: {
            //         requested: true,
            //       },
            //     },
            //   });

            //   console.log(account)

            //stripe top up create//
            // const topup = await stripe.topups.create({
            //     amount: 200,
            //     currency: 'usd',
            //     description: 'Top-up for week of May 31',
            //   });

            //    console.log(topup)


            //    const transfer = await stripe.transfers.create({
            //     amount: 400,
            //     currency: 'usd',
            //     destination: 'acct_1ND2FOQjoOyZArsw',
            //     transfer_group: 'ORDER_95',
            //   });

            //   console.log(transfer)

            // const payout = await stripe.payouts.create({
            //     amount: 1,
            //     currency: 'usd',
            //     destination:"ba_1NBuvBHIXLdlaW9ynzYbxdJs",
            //     method:"instant",
            //      source_type:"bank_account"
            //   });

            // console.log(payout)

            //    const token = await stripe.tokens.create({
            //     bank_account: {
            //       country: 'US',
            //       currency: 'usd',
            //       account_holder_name: 'vikash saini',
            //       account_holder_type: 'individual',
            //       routing_number: '111000000',
            //       account_number: '000123456789',
            //     },
            //   });

            //   console.log(token)

            //   const bankAccount = await stripe.customers.verifySource(
            //     'cus_Nq39r5CMdpPPI4',
            //     'ba_1NI53aHIXLdlaW9yYmJCZEnT',
            //     {amounts: [32, 45]}
            //   );

            //   console.log(bankAccount)

            //      const source = await stripe.customers.createSource(
            //     'cus_Ni7Twamy6xaltf', // Customer ID
            //     {source: token.id} // Token ID
            //   );
            try {
                var payout = await stripe.payouts.create({
                    amount: 1,
                    currency: 'usd',
                    destination: 'ba_1NJFngQigGsyv2XRi1wFPpTk',
                },
                    {
                        stripeAccount: "acct_1NItS8QigGsyv2XR",
                    });
            } catch (error) {
                console.log(error)
                return res.send(response(error, "message"));

            }
            console.log(payout)

            //    const bankAccount = await stripe.accounts.createExternalAccount(
            //         'acct_1NIrN5H2gsxSXFno',
            //         {
            //           external_account:
            //           {
            //             object:"bank_account",
            //             country:"US",
            //             currency:"usd",
            //             account_holder_name:"test",
            //             account_holder_type:"individual",
            //             routing_number:"110000000",
            //             account_number:"000111111113"
            //           },
            //         });

            //    console.log(bankAccount) 
            // const paymentIntent = await stripe.paymentIntents.create(
            //     {
            //       amount: 1,
            //       currency: 'usd',
            //       customer: 'ba_1NGjAIHIXLdlaW9y2WpTjKNh',
            //     },
            //     {
            //       stripeAccount: 'acct_1NH01aHBwgF7eIMd'
            //   ,
            //     }
            //   );
            //console.log(payout)

            //   const payout = await stripe.payouts.create({
            //     amount: 1000,  // Amount in cents (e.g., $10.00)
            //     currency: 'usd',
            //     method: 'standard',  // Standard payout method
            //     destination: 'ba_1NBuvBHIXLdlaW9ynzYbxdJs'  // Bank account ID
            //   });

            // const account = await stripe.accounts.update(
            //     'acct_1NItS8QigGsyv2XR'
            //   ,
            //     {
            //       tos_acceptance: {
            //         date: 1609798905,
            //         ip: '192.168.2.196',
            //       },
            //     }
            //   );
            return res.send(response(payout, "message"));
        } catch (error) {
            next(error)
        }
    },
    payoutwebhook: async (req, res, next) => {
        try {
            console.log(req.body)
        } catch (error) {
            next(error)
        }
    },

    bankaccountadd: async (req, res, next) => {
        try {
            const { customerId, user_id, account_holder_name, routing_number, account_number } = req.body;
            const token = await stripe.tokens.create({
                bank_account: {
                    country: 'US',
                    currency: 'usd',
                    account_holder_name: account_holder_name,
                    account_holder_type: 'individual',
                    routing_number: routing_number,
                    account_number: account_number,
                },
            });

            const source = await stripe.customers.createSource(
                customerId, // Customer ID
                { source: token.id } // Token ID
            );

            console.log('source ', source.id);
            // Verify Bank Account
            // const bankAccount = stripe.customers.verifySource(
            //     customerId, // Customer ID
            //     source.id,
            //     {
            //       amounts: [32, 45],
            //     }
            // );

            // console.log('bankAccount ', bankAccount);

            return res.send(response(source, "Bank account add successfully"));
        } catch (err) {
            return res.send(error({}, 'Invalid detail please try again'));
            next(err)
        }
    },

    bankaccountverify: async (req, res, next) => {
        try {
            const { customerId, bankAccountId, amount_1, amount_2 } = req.body;
            
            // Verify Bank Account
            const bankAccount = stripe.customers.verifySource(
                customerId, // Customer ID
                bankAccountId,
                {
                  amounts: [amount_1, amount_2],
                }
            ).then((bankAccount) => {
                // Handle the resolved value (bankAccount) here
                console.log('Bank account verification successful:', bankAccount);
                return res.send(response(bankAccount, "Bank account verified successfully"));
            })
            .catch((err) => {
                console.log('error');
                // Handle any errors that occur during verification
                return res.status(400).send(error({}, "Bank account verification failed"))
            });
        } catch (err) {
            return res.send(error({}, err.message));
            next(err)
        }
    },

    updatebankaccount: async (req, res, next) => {
        try {
            const { customerId, bank_account_id, user_id, account_holder_name, routing_number, account_number } = req.body;

            const bankAccount = await stripe.customers.updateSource(
                customerId, bank_account_id,
                {
                    metadata: {
                        account_holder_name: account_holder_name,
                        routing_number: routing_number,
                        account_number: account_number
                    }
                }
            );

            return res.send(response(bankAccount, "Bank account update successfully"));

        } catch (error) {
            next(error)
        }
    },

    bankAccountList: async (req, res, next) => {
        try {
            const { customerId, user_id } = req.body;

            const bankAccounts = await stripe.customers.listSources(
                customerId,
                { object: 'bank_account', limit: 5 }
            );

            return res.send(response(bankAccounts, "Bank account list get successfully"));

        } catch (error) {
            next(error)
        }
    },

    bankAccountDelete: async (req, res, next) => {
        try {
            const { customerId, bank_account_id } = req.body

            const deleted = await stripe.customers.deleteSource(
                customerId, bank_account_id
            );

            return res.send(response(deleted, "Bank Account delete successfully"));

        } catch (err) {
            return res.status(400).send(error({}, err.message))
        }
    },

}

function omitHash(user, token = "") {
    if (token) {
        user.token = token;
    }
    const {
        password,
        ...userWithoutHash
    } = user;
    return userWithoutHash;
}