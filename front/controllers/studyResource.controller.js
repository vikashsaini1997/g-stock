const Sequelize = require('sequelize')
const Op = Sequelize.Op;
const formidable = require('formidable');
var fs = require('fs');
const db = require("../../models");
const { response, error, sendmails, singleFileRequest, multiplefilerequest } = require("../../helper/helper");
const CloudConvert = require("cloudconvert")
const cloudConvert = new CloudConvert(process.env.CLOUDKEY);
const path = require('path')
const https = require('https');
module.exports = {

    add_new_study_resource: async (req, res, next) => {
        try {
            const params = req.body;
            let message = "Added successfully";
            params.price = (params.isFree == 1) ? 0 : params.price
            params.sr_id = Math.floor(Math.random() * 90000000) + params.user_id;
            params.type = JSON.stringify(params.type)
            params.tags = JSON.stringify(params.tags)
            params.status = 1

            var plancheck = await db.user_plan.findOne({
                where: { user_id: params.user_id, status: 1 }
            })

            // if(!plancheck){
            //     return res.status(400).send(error(null, "You have not active plan please purchase membership plan"));
            // }

            const newData = await db.study_resources.create(params)

            if (newData) {
                params.skills.map(async (item) => {
                    await db.study_resource_skill.create({
                        study_res_id: newData.id,
                        skill_id: item
                    })
                })

                // params.tags.map(async(item)=>{
                //     await db.study_resource_tag.create({
                //         study_res_id:newData.id,
                //         tag_id:item
                //     })
                // })

                params.doc_url.map(async (item) => {
                    await db.study_resource_doc.create({
                        study_res_id: newData.id,
                        doc_url: item.doc,
                    })
                })
            }

            res.send(response(newData, message));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    user_study_resource_list: async (req, res, next) => {
        try {
            const params = req.body;
            var subscription = ""

            var plancheck = await db.user_plan.findOne({
                where: { user_id: req.user.id, status: 1 }
            })


            if (plancheck) {
                subscription = 1
            } else {
                subscription = 0
            }

            const study_list = await db.study_resources.findAll({
                attributes: ["id","title", "rating", "price",
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description']
                ],
                where: {
                    user_id: req.user.id,
                },
                order: [["createdAt", "DESC"]]
            });


            const data = {
                active_subscription: subscription,
                study_list
            }
            res.send(response(data, "List find successfully"));
        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    study_resource_detail: async (req, res, next) => {
        try {
            const params = req.body;
            let responseData = {
                study_resources_detail: {},
                //related_material: [],
                more_from_this_member: [],
            }
            responseData.study_resources_detail = await db.study_resources.findOne({
                attributes: ["price", "id", "sr_id", "title", "rating", "description", "user_id"],
                where: {
                    id: params.id,
                }, include: [
                    { model: db.User, attributes: ["id", "firstName", "lastName", "profile_image", "createdAt", "country_id"], include: [{ model: db.country, attributes: ["country_name"] }] },
                    { model: db.school, attributes: ["school_name"] },
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.subject, attributes: ["subject_name"] },
                    { model: db.course, attributes: ["course_name"] },
                    {
                        model: db.skill, attributes: ["id", "skill_name"],
                        through: {
                            model: db.study_resource_skill,
                            attributes: []
                        }
                    },
                    {
                        model: db.admin_tag, attributes: ["id", "tag_name"],
                        through: {
                            model: db.study_resource_tag,
                            attributes: []
                        }
                    },
                    {
                        model: db.study_resource_doc,
                        attributes: ["id", "doc_url"],

                    },
                ],
            });
            // responseData.related_material = await db.study_resources.findAll({
            //     // attributes: [""],
            //     where: {
            //         user_id: { [Op.not]: responseData.study_resources_detail.user_id },
            //         status: 1,
            //     }, include: [
            //         { model: db.User, attributes: ["firstName", "lastName", "profile_image"] },
            //         { model: db.school, attributes: ["school_name"] },

            //     ]

            // });
            responseData.more_from_this_member = await db.study_resources.findAll({
                attributes: ["title", "rating", "price",
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description']],
                where: {
                    id: { [Op.not]: responseData.study_resources_detail.id },
                    user_id: responseData.study_resources_detail.user_id,
                    status: 1,
                },
                // include: [
                //     { model: db.User, attributes: ["firstName", "lastName", "profile_image"] },
                //     { model: db.school, attributes: ["school_name"] }
                // ]

            });
            res.send(response(responseData, ""));
        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    study_resource_delete: async (req, res, next) => {
        try {
            const params = req.body;
            let message = "Study Resource delete successfully";

            const Delete = await db.study_resources.destroy({
                where: {
                    id: params.study_res_id
                }
            })

            await db.study_resource_skill.destroy({
                where: {
                    study_res_id: params.study_res_id
                }
            })

            res.send(response({}, message));

        } catch (error) {
            next(error)
        }
    },
    user_update_study_resource: async (req, res, next) => {
        try {
            const params = req.body;
            // console.log(params)
            let updatevalue = {
                title: params.title,
                description: params.description,
                school: params.school,
                course_id: params.course_id,
                subject: params.subject,
                tag: params.tag,
                country: params.country,
                state: params.state,
                price: (params.isFree) ? 0 : params.price,
                isFree: params.isFree,
                status: params.status
            };
            const findData = await db.study_resources.update(updatevalue, {
                where: {
                    sr_id: params.sr_id,
                    user_id: req.user.id
                }
            });
            let message = "Something went wrong.";
            //console.log(findData[0]);
            if (findData[0]) {
                message = "Successfully Updated"
            }
            res.send(response(findData, message));
        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    study_resource_list: async (req, res, next) => {
        try {
            const headers = req.headers;
            const params = req.body;
            let whereQuery = {
                status: 1
            };
            let limit = 10;
            let offset = (params.offset) ? params.offset * limit : 0;
            let sort = [["createdAt", (params.sort) ? params.sort : "DESC"]];
            if (params.searchKeyword && params.searchKeyword != "") {
                whereQuery.title = {
                    [Op.like]: '%' + params.searchKeyword + '%'
                };
            }
            let findData = await db.study_resources.findAll({
                // attributes: ["*"],
                where: whereQuery,
                offset: offset, limit: limit,
                order: sort,
                raw: true
            });
            // findData = findData.map((item) => {
            //     return item.toJSON()
            // })
            if (req.user) {
                await Promise.all(findData.map(async (item) => {

                    console.log(item);
                    item['isFavorites'] = false;
                    let getData = await db.favorites.findOne({
                        where: { user_id: req.user.id, sr_id: item.sr_id },
                    });
                    console.log("getData", getData);
                    if (getData) {
                        item['isFavorites'] = true;
                    }
                }))
            }
            res.send(response(findData, ""));
        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    add_favorites_study_resource: async (req, res, next) => {
        try {
            console.log("==> ", req.user);
            const headers = req.headers;
            let message = "Added successfully";
            let newData = { isFavorites: false };

            const params = req.body;

            let saveData = {
                sr_id: params.sr_id,
                user_id: req.user.id,

            }
            let getData = await db.favorites.findOne({
                where: saveData,
            });
            // console.log("saveData ",saveData);
            if (!getData) {
                await db.favorites.create(saveData);
                newData.isFavorites = true;
            } else {
                await db.favorites.destroy({ where: saveData });
                message = "Removed successfully";

            }
            //console.log(newData);
            res.send(response(newData, message));


        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    upload_flash_card: async (req, res, next) => {
        try {
            const params = req.body;
            let message = "Added successfully";
            params.price = (params.isFree == 1) ? 0 : params.price
            params.type = JSON.stringify(params.type)
            params.terms = JSON.stringify(params.terms)
            params.tags = JSON.stringify(params.tags)
            params.status = 1

            const newData = await db.flash_card.create(params)

            if (newData) {
                params.skills.map(async (item) => {
                    await db.flash_card_skill.create({
                        flash_card_id: newData.id,
                        skill_id: item
                    })
                })

            }

            res.send(response(newData, message));

        } catch (error) {
            next(error)
        }
    },
    flash_card_update: async (req, res, next) => {
        try {
            const params = req.body;
            let message = "Flash card update successfully";
            params.price = (params.isFree == 1) ? 0 : params.price
            params.type = JSON.stringify(params.type)
            params.terms = JSON.stringify(params.terms)
            params.tags = JSON.stringify(params.tags)

            const newData = await db.flash_card.update(params, {
                where: {
                    id: params.flash_card_id
                }
            })

            if (params.skills) {

                await db.flash_card_skill.destroy({
                    where: {
                        flash_card_id: params.flash_card_id
                    }
                })
                params.skills.map(async (item) => {
                    await db.flash_card_skill.create({
                        flash_card_id: params.flash_card_id,
                        skill_id: item
                    })
                })

            }

            res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },
    flash_card_delete: async (req, res, next) => {
        try {
            const params = req.body;
            let message = "Flash card delete successfully";

            const Delete = await db.flash_card.destroy({
                where: {
                    id: params.flash_card_id
                }
            })

            await db.flash_card_skill.destroy({
                where: {
                    flash_card_id: params.flash_card_id
                }
            })

            res.send(response({}, message));

        } catch (error) {
            next(error)
        }
    },
    user_flash_card_list: async (req, res, next) => {
        try {
            const params = req.body;
            var subscription = ""

            var plancheck = await db.user_plan.findOne({
                where: { user_id: req.user.id, status: 1 }
            })


            if (plancheck) {
                subscription = 1
            } else {
                subscription = 0
            }

            const page = parseInt(params.page) || 1; // Current page number (default: 1)
            const limit = parseInt(params.limit) || 3; // Number of records per page (default: 10)
            const offset = (page - 1) * limit; // Offset calculation based on current page and limit


            const flash_card_list = await db.flash_card.findAll({
                attributes: ["id", "title", "price", "terms_count", "rating", "tags",
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description']
                ],
                where: {
                    user_id: req.user.id,
                },
                order: [["createdAt", "DESC"]],
                limit,
                offset,
            });

            const data = {
                active_subscription: subscription,
                flash_card_list
            }
            res.send(response(data, "List find successfully"));
        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    user_flash_card_view: async (req, res, next) => {
        try {
            const params = req.body;

            const flash_card_detail = await db.flash_card.findOne({
                //attributes: ["price","id","title","rating","description","user_id","terms_count","terms","tags"],
                where: {
                    id: params.id,
                }, include: [
                    { model: db.User, attributes: ["id", "firstName", "lastName", "profile_image", "createdAt", "country_id"], include: [{ model: db.country, attributes: ["country_name"] }] },
                    { model: db.school, attributes: ["school_name"] },
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.subject, attributes: ["subject_name"] },
                    { model: db.course, attributes: ["course_name"] },
                    {
                        model: db.skill, attributes: ["id", "skill_name"],
                        through: {
                            model: db.flash_card_skill,
                            attributes: []
                        }
                    },
                ],
            });

            res.send(response(flash_card_detail, "Detail view successfully"));
        } catch (error) {
            next(error)
        }
    },
    flash_card_detail: async (req, res, next) => {
        try {
            const params = req.body;
            let responseData = {
                flash_card_detail: {},
                more_from_this_member: [],
            }

            const page = parseInt(params.page) || 1; // Current page number (default: 1)
            const limit = parseInt(params.limit) || 3; // Number of records per page (default: 10)
            const offset = (page - 1) * limit; // Offset calculation based on current page and limit


            responseData.flash_card_detail = await db.flash_card.findOne({
                attributes: ["price", "id", "title", "rating", "description", "user_id", "terms_count", "terms", "tags"],
                where: {
                    id: params.id,
                }, include: [
                    { model: db.User, attributes: ["id", "firstName", "lastName", "profile_image", "createdAt", "country_id"], include: [{ model: db.country, attributes: ["country_name"] }] },
                    { model: db.school, attributes: ["school_name"] },
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.subject, attributes: ["subject_name"] },
                    { model: db.course, attributes: ["course_name"] },
                    {
                        model: db.skill, attributes: ["id", "skill_name"],
                        through: {
                            model: db.flash_card_skill,
                            attributes: []
                        }
                    },
                    {
                        model: db.admin_tag, attributes: ["id", "tag_name"],
                        through: {
                            model: db.flash_card_tag,
                            attributes: []
                        }
                    },
                ],
            });
            responseData.more_from_this_member = await db.flash_card.findAll({
                attributes: ["id", "title", "rating", "price", "terms_count"],
                where: {
                    id: { [Op.not]: responseData.flash_card_detail.id },
                    user_id: responseData.flash_card_detail.user_id,
                    status: 1,
                },
                order: [["createdAt", "DESC"]],
                limit,
                offset,
            });
            res.send(response(responseData, "Detail view successfully"));
        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    public_flash_card_list: async (req, res, next) => {
        try {

            const params = req.body
            const token = req.user
            const userId = params.user_id || 0;
            let doc_type = 3

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
            };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            var conditonarray = []


            const page = parseInt(params.page) || 0; // Current page number
            const pageSize = parseInt(params.pageSize) || 8;
            const offset = (page) * pageSize;


            for (const key in params) {
                if (key !== "searchtext" && key !== "filter" && key !== "isfree" && key !== "paid" && key !== "budget" && key !== "sort" && key !== "user_id") {
                    conditonarray.push({ [key]: params[key] })
                }
            }

            const wherenew = {
                status: 1,
                [Op.and]: conditonarray,
            };

            if (params.searchtext) {
                const likeConditions = [
                    Sequelize.literal(
                        "`school`.`school_name` LIKE '%" + params.searchtext + "%'"
                    ),
                    Sequelize.literal(
                        "`course`.`course_name` LIKE '%" + params.searchtext + "%'"
                    ),
                    Sequelize.literal(
                        "`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"
                    ),
                    Sequelize.literal("`flash_card`.`title` LIKE '%" + params.searchtext + "%'"),
                ];
                wherenew[Op.or] = likeConditions;
            }

            if (params.budget) {
                wherenew.budget = {
                    [Op.between]: params.budget,
                };
            }


            if (params.isfree == 1) {
                wherenew.isFree = 1;
            } else if (params.isfree == 0) {
                wherenew.isFree = 0;
            } else {
                wherenew.isFree = [1, 0];
            }

            // if (params.free == 1 && params.searchtext) {
            //     console.log("1st conditon>>>>")
            //     if (params.budget) {
            //         wherenew = {
            //             status: 1,
            //             isFree: 1,
            //             price: {
            //                 [Op.between]: params.budget,
            //             },
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`flash_card`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 //  Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //                 //  Sequelize.literal("`skills`.`skill_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     } else {
            //         wherenew = {
            //             status: 1,
            //             isFree: 1,  
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`flash_card`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`skills`.`skill_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     }

            // } else if (params.paid == 1 && params.searchtext) {
            //     console.log("2nd conditon>>>>")
            //     if (params.budget) {
            //         wherenew = {
            //             status: 1,
            //             isFree: 0,
            //             price: {
            //                 [Op.between]: params.budget,
            //             },
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`flash_card`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`skills`.`skill_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     } else {
            //         wherenew = {
            //             status: 1,
            //             isFree: 0,
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`flash_card`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`skills`.`skill_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     }
            // } else if (params.free == 1) {
            //     console.log("3rd conditon>>>>")
            //     wherenew = {
            //         isFree: 1,
            //         status: 1
            //     }
            // } else if (params.paid == 1) {
            //     console.log("3rd conditon>>>>")
            //     wherenew = {
            //         isFree: 0,
            //         status: 1
            //     }
            // }else if (params.searchtext) {
            //     console.log("4th conditon>>>>")
            //     if (params.budget) {
            //         wherenew = {
            //             status: 1,
            //             price: {
            //                 [Op.between]: params.budget,
            //             },
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`flash_card`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`skills`.`skill_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     } else {
            //         wherenew = {
            //             status: 1,
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`flash_card`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //                 // Sequelize.literal("`skills`.`skill_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     }

            // } else if (params.filter == 1) {
            //     console.log("6th conditon>>>>")
            //     if (params.budget) {
            //         wherenew = {
            //             status: 1,
            //             price: {
            //                 [Op.between]: params.budget,
            //             },
            //             [Op.and]: [conditonarray],
            //             //[Op.and]: [searchconditon]
            //         }
            //     } else {
            //         wherenew = {
            //             status: 1,
            //             [Op.and]: [conditonarray],
            //             //[Op.and]: [searchconditon]
            //         }
            //     }

            // } else {
            //     console.log("final")
            //     wherenew = {
            //         status: 1,
            //     }
            // }

            const list = await db.flash_card.findAll({
                attributes: [
                    "id", "title", "category_id", "school_id", "course_id", "subject_id", "price", "user_id", "country_id", "state_id", "createdAt", "terms_count", "tags",
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description'],
                    [
                        Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM favorites WHERE flash_card.id = favorites.doc_id AND favorites.doc_type = ${doc_type} AND favorites.user_id = ${userId}) THEN true ELSE false END`),
                        'isFavorite'
                    ]
                ],
                include: [
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.school, required: true, attributes: ["school_name"] },
                    { model: db.course, required: true, attributes: ["course_name"] },
                    { model: db.subject, required: true, attributes: ["subject_name"] },
                    { model: db.country, attributes: ["country_name"] },
                    { model: db.state, attributes: ["state_name"] },
                    // {model: db.admin_tag, attributes: ["id", "tag_name"],
                    //     through: {
                    //         model: db.flash_card_tag,
                    //         attributes: [],
                    //     },

                    // },
                    // {
                    //     model: db.skill, attributes: ["id", "skill_name"],
                    //     through: {
                    //         model: db.flash_card_skill,
                    //         attributes: [],
                    //     }
                    // },
                ],
                offset: offset,
                limit: pageSize,
                where: wherenew,
                order: [sort],
            });

            const totalCount = await db.flash_card.count({
                include: [
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.school, required: true, attributes: ["school_name"] },
                    { model: db.course, required: true, attributes: ["course_name"] },
                    { model: db.subject, required: true, attributes: ["subject_name"] },
                    { model: db.country, attributes: ["country_name"] },
                    { model: db.state, attributes: ["state_name"] },
                ],
                where: wherenew
            });

            const data = {
                total_result: totalCount,
                perpage_count: list.length,
                list
            };

            return res.send(response(data));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    public_flash_card_detail: async (req, res, next) => {
        try {
            const params = req.body;
            let doc_type = 3

            if (params.user_id) {
                userId = params.user_id
            } else {
                userId = 0
            }

            let responseData = {
                flash_card_detail: {},
                related_material: [],
                //more_from_this_member: [],
            }

            const page = parseInt(params.page) || 1; // Current page number (default: 1)
            const limit = parseInt(params.limit) || 4; // Number of records per page (default: 10)
            const offset = (page - 1) * limit; // Offset calculation based on current page and limit

            responseData.flash_card_detail = await db.flash_card.findOne({
                attributes: ["price", "id", "title", "rating", "description", "user_id", "terms_count", "terms", "type", "category_id", "isFree", "tags",
                    [
                        Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM favorites WHERE flash_card.id = favorites.doc_id AND favorites.doc_type = ${doc_type} AND favorites.user_id = ${userId}) THEN true ELSE false END`),
                        'isFavorite'
                    ],
                    [
                        Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM carts WHERE flash_card.id = carts.flash_card_id  AND carts.user_id = ${userId}) THEN true ELSE false END`),
                        'isCart'
                    ],
                ],
                where: {
                    id: params.id,
                }, include: [
                    { model: db.User, attributes: ["id", "firstName", "lastName", "profile_image", "user_name", "createdAt", "country_id"], include: [{ model: db.country, attributes: ["country_name"] }] },
                    { model: db.school, attributes: ["school_name"] },
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.subject, attributes: ["subject_name"] },
                    { model: db.course, attributes: ["course_name"] },
                    {
                        model: db.skill, attributes: ["id", "skill_name"],
                        through: {
                            model: db.flash_card_skill,
                            attributes: []
                        }
                    },
                    // {
                    //     model: db.admin_tag, attributes: ["id", "tag_name"],
                    //     through: {
                    //         model: db.flash_card_tag,
                    //         attributes: []
                    //     }
                    // },
                ],
            });

            // const firstTerm = JSON.parse(responseData.flash_card_detail.terms);
            // const firstTermObject = firstTerm[0];
            // responseData.flash_card_detail.terms = firstTermObject;

            responseData.related_material = await db.flash_card.findAll({
                attributes: ["id", "title", "rating", "terms_count", "price"],
                where: {
                    id: { [Op.not]: responseData.flash_card_detail.id },
                    category_id: responseData.flash_card_detail.category_id,
                    isFree: responseData.flash_card_detail.isFree,
                    status: 1,
                },
                order: [["createdAt", "DESC"]],
                limit,
                offset,

            });
            res.send(response(responseData, "Detail find successfully"));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    favourite_all_doc: async (req, res, next) => {
        try {
            const params = req.body;

            const fav_check = await db.favorites.findOne({
                where: {
                    user_id: params.user_id,
                    doc_type: params.doc_type,
                    doc_id: params.doc_id
                }
            })

            if (fav_check) {
                const update = await db.favorites.update({
                    status: params.status
                }, {
                    where: {
                        id: fav_check.id
                    }

                })
            } else {
                const add = await db.favorites.create(params)
            }

            if (params.status == 1) {
                message = "Favourite successfully"
            } else if (params.status == 0) {
                message = "Un-favourite successfully"
            }
            res.send(response({}, message));

        } catch (error) {
            next(error)
        }
    },
    document_preview: async (req, res, next) => {
        try {
            // const { url, page } = req.query; // Get the document URL and page number from the query parameters
            const url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            const page = 1

            let job = await cloudConvert.jobs.create({
                tasks: {
                    'import-my-file': {
                        operation: 'import/url',
                        url: url
                    },
                    'convert-my-file': {
                        operation: 'convert',
                        input: 'import-my-file',
                        output_format: 'pdf',
                        some_other_option: 'value'
                    },
                    'export-my-file': {
                        operation: 'export/url',
                        input: 'convert-my-file'
                    }
                }
            });

            const job1 = await cloudConvert.jobs.wait(job.id); // Wait for job completion
            const file = cloudConvert.jobs.getExportUrls(job1)[0];
            // const outputPath = path.join(__dirname, 'out'); // Output directory path
            // if (!fs.existsSync(outputPath)) {
            //     fs.mkdirSync(outputPath); // Create the output directory if it doesn't exist
            // }

            // const writeStream = fs.createWriteStream(path.join(outputPath, file.filename));
            https.get(file.url, function (responses) {
                if (responses.statusCode === 200) {
                    // response.pipe(writeStream);
                    // writeStream.on('finish', () => {
                    //     console.log('File download successful.');
                    //     writeStream.close();
                    // });
                    return res.send(response(file.url, "message"));
                } else {
                    console.error('Error:', response.statusMessage);
                }
            });
        } catch (err) {
            console.error('Error fetching document preview:', err);
            res.status(500).send('Internal Server Error');
        }
    },

    doc_convert_in_jpeg: async (req, res, next) => {
        try {
            // const { url, page } = req.query; // Get the document URL and page number from the query parameters
            const url = "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf"
            const page = 1

            let job = await cloudConvert.jobs.create({
                tasks: {
                    'import-my-file': {
                        operation: 'import/url',
                        url: url
                    },
                    'convert-to-jpeg': {
                        operation: 'convert',
                        input: 'import-my-file',
                        output_format: 'jpeg',
                        page_range: '1-1', // Specify the first page
                    },
                }
            });

            const job1 = await cloudConvert.jobs.wait(job.id); // Wait for job completion
            console.log(job1)
            const output = job1.tasks['convert-to-jpeg'].result;

            if (output && output.files && output.files.length > 0) {
                const imageUrl = output.files[0].url; // Get the URL of the converted image
                console.log(imageUrl);

                // Send the converted image URL as a response
                return res.send(response(imageUrl, "message"));
            } else {
                console.error('No converted files found.');
                res.status(500).send('No converted files found.');
            }
        } catch (err) {
            console.error('Error fetching document preview:', err);
            res.status(500).send('Internal Server Error');
        }
    },
    public_study_res_list: async (req, res, next) => {
        try {
            const params = req.body;
            const token = req.user
            var conditonarray = []

            let doc_type = 2 // study resource for fovorite

            const userId = params.user_id || 0;

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
            };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;

            for (const key in params) {
                if (key !== "searchtext" && key !== "filter" && key !== "isfree" && key !== "budget" && key !== "sort" && key !== "user_id" && key !== "page") {
                    conditonarray.push({ [key]: params[key] })
                }
            }

            const wherenew = {
                status: 1,
                [Op.and]: conditonarray,
            };

            if (params.searchtext) {
                const likeConditions = [
                    Sequelize.literal(
                        "`school`.`school_name` LIKE '%" + params.searchtext + "%'"
                    ),
                    Sequelize.literal(
                        "`course`.`course_name` LIKE '%" + params.searchtext + "%'"
                    ),
                    Sequelize.literal(
                        "`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"
                    ),
                    Sequelize.literal("`study_resources`.`title` LIKE '%" + params.searchtext + "%'"),
                ];
                wherenew[Op.or] = likeConditions;
            }

            if (params.budget) {
                wherenew.budget = {
                    [Op.between]: params.price,
                };
            }


            if (params.isfree == 1) {
                wherenew.isFree = 1;
            } else if (params.isfree == 0) {
                wherenew.isFree = 0;
            } else {
                wherenew.isFree = [1, 0];
            }

            const list = await db.study_resources.findAll({
                attributes: [
                    "id", "title", "isFree", "category_id", "school_id", "course_id", "subject_id", "type", "price", "status", "user_id", "country_id", "state_id", "createdAt",
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description'],
                    [Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM favorites WHERE study_resources.id = favorites.doc_id AND favorites.doc_type = ${doc_type} AND favorites.user_id = ${userId}) THEN true ELSE false END`),
                        'isFavorite'
                    ]
                ],
                include: [
                    { model: db.category, required: true, attributes: ["category_name"] },
                    //{ model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.school, required: true, attributes: ["school_name"] },
                    { model: db.course, required: true, attributes: ["course_name"] },
                    { model: db.subject, required: true, attributes: ["subject_name"] },
                    { model: db.country, required: true, attributes: ["country_name"] },
                    { model: db.state, required: false, attributes: ["state_name"] },
                ],
                offset: offset,
                limit: pageSize,
                where: wherenew,
                order: [sort],

            });


            const count = await db.study_resources.findAll({
                where: wherenew,
                include: [
                    { model: db.category, attributes: ["category_name"] },
                    //{ model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.school, required: true, attributes: ["school_name"] },
                    { model: db.course, required: true, attributes: ["course_name"] },
                    { model: db.subject, required: true, attributes: ["subject_name"] },
                    { model: db.country, required: true, attributes: ["country_name"] },
                    { model: db.state, required: false, attributes: ["state_name"] },
                ],
            })

            var data = {
                count: count.length,
                perpage_count: pageSize,
                list
            }

            return res.send(response(data));


        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    public_study_res_detail: async (req, res, next) => {
        console.log(req.headers)
        try {
            const params = req.body;
            const doc_type = 2
            const userId = params.user_id || 0;

            let responseData = {
                study_resources_detail: {},
                related_material: [],
                more_from_this_member: [],
            }
            responseData.study_resources_detail = await db.study_resources.findOne({
                attributes: ["price", "id", "sr_id", "title", "rating", "description", "user_id", "tags", "type", "category_id",
                    [Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM favorites WHERE study_resources.id = favorites.doc_id AND favorites.doc_type = ${doc_type} AND favorites.user_id = ${userId}) THEN true ELSE false END`),
                        'isFavorite'
                    ]
                ],
                where: {
                    id: params.id,
                }, include: [
                    { model: db.User, attributes: ["id", "firstName", "lastName", "profile_image", "createdAt", "country_id"], include: [{ model: db.country, attributes: ["country_name"] }] },
                    { model: db.school, attributes: ["school_name"] },
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.subject, attributes: ["subject_name"] },
                    { model: db.course, attributes: ["course_name"] },
                    { model: db.country, attributes: ["country_name"] },
                    { model: db.state, attributes: ["state_name"] },
                    {
                        model: db.skill, attributes: ["id", "skill_name"],
                        through: {
                            model: db.study_resource_skill,
                            attributes: []
                        }
                    },
                    {
                        model: db.study_resource_doc,
                        attributes: ["id", "doc_url"],

                    },
                ],
            });

            responseData.related_material = await db.study_resources.findAll({
                attributes: ["id", "title", "rating", "price",
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 10), 'description'],
                ],
                where: {
                    id: { [Op.not]: responseData.study_resources_detail.id },
                    category_id: responseData.study_resources_detail.category_id,
                    status: 1,
                },
                limit: 5
            });

            responseData.more_from_this_member = await db.study_resources.findAll({
                attributes: ["id", "title", "rating", "price",
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description']],
                where: {
                    id: { [Op.not]: responseData.study_resources_detail.id },
                    user_id: responseData.study_resources_detail.user_id,
                    status: 1,
                },
                limit: 8
            });


            res.send(response(responseData, "Detail find successfully"));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    all_favorite_study_res_list: async (req, res, next) => {
        try{
            const params = req.body;
            const userId = req.user.id

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
              };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;

            const wherenew = {
                user_id:userId,
                doc_type:2, // for post job
                status: 1,
              };

              if (params.searchtext ) {
                const likeConditions = [
                //   Sequelize.literal(
                //     "`school`.`school_name` LIKE '%" + params.searchtext + "%'"
                //   ),
                //   Sequelize.literal(
                //     "`course`.`course_name` LIKE '%" + params.searchtext + "%'"
                //   ),
                //   Sequelize.literal(
                //     "`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"
                //   ),
                  Sequelize.literal("`study_resources`.`title` LIKE '%" + params.searchtext + "%'"),
                ];
                wherenew[Op.or] = likeConditions;
            }
            const allfav_list =  await db.favorites.findAll({
                where:wherenew,
                include:[
                    {
                        model:db.study_resources,
                        attributes:["id","title","price","isFree",
                        [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description'],]
                    }
                ],
                offset: offset,
                limit: pageSize,
                order: [sort],
            })

            const count =  await db.favorites.count({
                where:wherenew,
                include:[
                    {
                        model:db.study_resources,
                    }
                ],
            })

            var data = {
                count: count,
                perpage_count:pageSize,
                allfav_list
            }

            return res.send(response(data,"Favorite list find successfully"));
            

        }catch(error){
            console.log(error)
            next(error)
        }
    },
    all_favorite_flash_card_list: async (req, res, next) => {
        try{
            const params = req.body;
            const userId = req.user.id

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
              };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;

            const wherenew = {
                user_id:userId,
                doc_type:3, // for post job
                status: 1,
              };

              if (params.searchtext ) {
                const likeConditions = [
                //   Sequelize.literal(
                //     "`school`.`school_name` LIKE '%" + params.searchtext + "%'"
                //   ),
                //   Sequelize.literal(
                //     "`course`.`course_name` LIKE '%" + params.searchtext + "%'"
                //   ),
                //   Sequelize.literal(
                //     "`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"
                //   ),
                  Sequelize.literal("`flash_card`.`title` LIKE '%" + params.searchtext + "%'"),
                ];
                wherenew[Op.or] = likeConditions;
            }
            const allfav_list =  await db.favorites.findAll({
                where:wherenew,
                include:[
                    {
                        model:db.flash_card,
                        attributes:["id","title","terms_count","isFree","price",
                        [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description'],]
                    }
                ],
                offset: offset,
                limit: pageSize,
                order: [sort],
            })

            const count =  await db.favorites.count({
                where:wherenew,
                include:[
                    {
                        model:db.flash_card,
                    }
                ],
            })

            var data = {
                count: count,
                perpage_count:pageSize,
                allfav_list
            }

            return res.send(response(data,"Favorite list find successfully"));
            

        }catch(error){
            console.log(error)
            next(error)
        }
    }
}