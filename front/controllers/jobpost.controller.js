const express = require("express");
const bcrypt = require("bcryptjs");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;
const config = require("../../config/config.js")
const jwt = require("jsonwebtoken");
const randtoken = require("rand-token");
const moment = require('moment');
const db = require("../../models");
const { response, error, sendmails, singleFileRequest, multiplefilerequest } = require("../../helper/helper");
const axios = require('axios');
const fs = require('fs');
const CloudConvert = require("cloudconvert")
const cloudConvert = new CloudConvert(process.env.CLOUDKEY);
const FormData = require('form-data');
const https = require('https');
const path = require('path')

module.exports = {
    document_upload: async (req, res, next) => {
        try {
            const params = req.body;
            let files = req.files
            const file = files.map((item) => {
                return item.toJSON()
            })

            if (file.length > 5) {
                return res.status(400).send(error(null, "Maximum five file upload"));
            }

            if (Object.keys(file).length > 0) {
                let files_detail = { files: file, folder_name: "document" }
                var file_name = await multiplefilerequest(files_detail);
            }
            var data = []
            file_name.forEach((item) => {
                data.push({
                    file_url: item.Location,
                    name: item.originalFilename,
                    size: item.fileSizeInBytes
                })
            })
            return res.send(response(data, "File upload successfully"));

        } catch (error) {
            next(error)
        }
    },

    // document_upload: async (req, res, next) => {
    //     try {
    //         const params = req.body;
    //         let files = req.files
    //         const file = files.map((item) => {
    //             return item.toJSON()
    //         })

    //         if (Object.keys(file).length > 0) {
    //             await Promise.all(file.map(async (item) => {
    //                 console.log(item.mimetype)
    //                 if (item.mimetype == 'image/jpeg' || item.mimetype == 'image/png' || item.mimetype == 'image/jpg' || item.mimetype == 'application/pdf') {
    //                     var file_name = '';
    //                     if (item.mimetype == 'application/pdf') {
    //                         file_name = Date.now() + "/" + item.originalFilename;
    //                     } else if (item.mimetype == 'image/png') {
    //                         file_name = Date.now() + "/" + item.originalFilename;
    //                     } else {
    //                         file_name = Date.now() + "/" + item.originalFilename;
    //                     }

    //                     return new Promise((resolve, reject) => {
    //                         const s3 = new AWS.S3({
    //                             region: `us-east-2`,
    //                             accessKeyId: `AKIAQK3NHO4VNYLYF2V2`,
    //                             secretAccessKey: `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`,
    //                             s3BucketEndpoint: false,

    //                         });

    //                         const uploadParams = {
    //                             Bucket: `gradstock-production`, Key: '', Body: '',
    //                             ACL: 'public-read',
    //                             ContentType: item.mimetype
    //                         };

    //                         const filename = file_name;
    //                         let fileStream = fs.createReadStream(item.filepath);

    //                         fileStream.on('error', (err) => {
    //                         });
    //                         uploadParams.Body = fileStream;
    //                         uploadParams.Key = "document" + filename;

    //                         s3.upload(uploadParams, (err, data) => {
    //                             if (err) {
    //                                 reject(err)
    //                             } else if (data) {
    //                                 resolve(data);
    //                             }
    //                         });
    //                     });
    //                 } else {
    //                     throw "Doc Format is not correct";
    //                 }

    //             })
    //             ).then((data) => {
    //                 return res.send(response(data, "File upload successfully"));
    //             })
    //         }
    //     } catch (error) {
    //         next(error)
    //     }
    // },
    job_add: async (req, res, next) => {
        try {
            const params = req.body;
            // params.tags = JSON.stringify(params.tags)
            params.status = 1
            const id = Math.floor(Math.random() * 90000000) + 10000000;
            params.random_id = id
            params.tags = JSON.stringify(params.tags)

            const jobadd = await db.jobposts.create(params)

            if (jobadd) {
                if (params.docs) {
                    params.docs.map(item => {
                        db.postjob_docs.create({
                            //category_id: params.categoryid,
                            jobpost_id: jobadd.id,
                            doc_url: item.file_url,
                            file_name: item.name,
                            size: item.size,
                            extension: item.extension
                        })
                    })
                }
            }
            return res.send(response(jobadd, "Job post successfully"));
        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    joblist: async (req, res, next) => {
        try {
            const params = req.body
            const token = req.user
            var conditonarray = []

            let doc_type = 1
            let fav_status = 1 //

            const userId = params.user_id || 0;

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
              };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            const currentDate = new Date();

            const leftdataget = await db.jobposts.findAll({
                where: {
                    due_date: {
                        [Op.lt]: currentDate// less than current date
                    },
                    status: 1,
                }
            });
            //status change after due date left
            await Promise.all(
                leftdataget.map(async (item) => {
                    await db.jobposts.update({ status: 0 }, { where: { id: item.id } });
                })
            );



            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;

            for (const key in params) {
                if (key !== "searchtext" && key !== "filter" && key !== "writingservice" && key !== "budget" && key !== "sort" && key !== "user_id" && key !== "page") {
                    conditonarray.push({ [key]: params[key] })
                }
            }

            const wherenew = {
                status: 1,
                [Op.and]: conditonarray,
              };
          
              if (params.searchtext ) {
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
                  Sequelize.literal("`jobposts`.`title` LIKE '%" + params.searchtext + "%'"),
                ];
                wherenew[Op.or] = likeConditions;
            }
               
                if (params.budget) {
                  wherenew.budget = {
                    [Op.between]: params.budget,
                  };
                }
                
                  // writing service data get
                if (params.writingservice == 1) {
                  wherenew.writingservice = 1;
                  //question data get
                } else if (params.writingservice == 2) {
                  wherenew.writingservice = 2;
                  //all data get
                }else if (params.writingservice == 0){
                    wherenew.writingservice = [1,2];
                }
          
              
            //   else if (params.writingservice == 1 || params.writingservice == 2) {
            //     wherenew.writingservice = params.writingservice;
            //   }

            // if (params.writingservice == 1 && params.searchtext) {
            //     console.log("1st conditon>>>>")
            //     if (params.budget) {
            //         wherenew = {
            //             status: 1,
            //             writingservice: 1,
            //             budget: {
            //                 [Op.between]: params.budget,
            //             },
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`jobposts`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 //Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     } else {
            //         wherenew = {
            //             status: 1,
            //             writingservice: 1,
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`jobposts`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 //Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     }

            // } else if (params.writingservice == 2 && params.searchtext) {
            //     console.log("2nd conditon>>>>")
            //     if (params.budget) {
            //         wherenew = {
            //             status: 1,
            //             writingservice: 2,
            //             budget: {
            //                 [Op.between]: params.budget,
            //             },
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`jobposts`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 //Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray],
            //             //[Op.and]: [searchconditon]
            //         }
            //     } else {
            //         wherenew = {
            //             status: 1,
            //             writingservice: 2,
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`jobposts`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 //Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray],
            //             //[Op.and]: [searchconditon]
            //         }
            //     }
            // } else if (params.writingservice == 1) {
            //     console.log("00rd conditon>>>>")
            //     wherenew = {
            //         writingservice: 1,
            //         status: 1
            //     }
            // } else if (params.writingservice == 2) {
            //     console.log("3rd conditon>>>>")
            //     wherenew = {
            //         writingservice: 2,
            //         status: 1
            //     }
            // } else if (params.searchtext) {
            //     console.log("4th conditon>>>>")
            //     if (params.budget) {
            //         wherenew = {
            //             status: 1,
            //             budget: {
            //                 [Op.between]: params.budget,
            //             },
            //             [Op.or]: [
            //                 Sequelize.literal("`school`.`school_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`course`.`course_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`subject`.`subject_name` LIKE '%" + params.searchtext + "%'"),
            //                 Sequelize.literal("`jobposts`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 //Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
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
            //                 Sequelize.literal("`jobposts`.`title` LIKE '%" + params.searchtext + "%'"),
            //                 //Sequelize.literal("`admin_tags`.`tag_name` LIKE '%" + params.searchtext + "%'"),
            //             ],
            //             [Op.and]: [conditonarray]
            //         };
            //     }

            // } else if (params.filter == 1) {
            //     console.log("6th conditon>>>>")
            //     if (params.budget) {
            //         wherenew = {
            //             status: 1,
            //             budget: {
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
        
            const list = await db.jobposts.findAll({
                attributes: [
                    "id", "title","writingservice", "categoryid", "sub_cat_id", "school_id", "course_id", "subject_id", "due_date", "budget", "status", "userid", "country_id", "state_id", "tags","createdAt",
                    [Sequelize.literal(`(SELECT COUNT(jobbids.jobid)FROM jobbids WHERE jobbids.jobid = jobposts.id)`), 'bidcount'],
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description'],
                    [Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM favorites WHERE jobposts.id = favorites.doc_id AND favorites.doc_type = ${doc_type} AND favorites.user_id = ${userId} AND favorites.status = ${fav_status}) THEN true ELSE false END`),
                        'isFavorite'
                    ]
                ],
                include: [
                    { model: db.category,required: true, attributes: ["category_name"] },
                    //{ model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.school, required: true, attributes: ["school_name"] },
                    { model: db.course, required: true, attributes: ["course_name"] },
                    { model: db.subject, required: true, attributes: ["subject_name"] },
                    { model: db.country, required: true, attributes: ["country_name"] },
                    { model: db.state, required: false, attributes: ["state_name"] },
                    { model: db.jobbids, required: false, attributes: [] },
                ],
                offset: offset,
                limit: pageSize,
                where: wherenew,
                order: [sort],

            });

            const count = await db.jobposts.findAll({
                where: wherenew,
                include: [
                    { model: db.category, attributes: ["category_name"] },
                    //{ model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.school, required: true, attributes: ["school_name"] },
                    { model: db.course, required: true, attributes: ["course_name"] },
                    { model: db.subject, required: true, attributes: ["subject_name"] },
                    { model: db.country, required: true, attributes: ["country_name"] },
                    { model: db.state, required: false, attributes: ["state_name"] },
                    { model: db.jobbids, required: false, attributes: [] },
                ],
            })

            var data = {
                count: count.length,
                perpage_count:pageSize,
                list
            }

            return res.send(response(data));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    jobaddbid: async (req, res, next) => {
        try {

            const params = req.body

            // check if user exist 
            const user = await db.User.findOne({
                where: { id: params.userid }
            })
            if (!user) {
                return res.status(400).send(error(null, "please enter valid userid"));
            }

            // check if job exist 
            const job = await db.jobposts.findOne({
                where: { id: params.jobid }
            })
            if (!job) {
                return res.status(400).send(error(null, "please enter valid jobid"));
            }

            if(job.userid == params.userid){
                return res.status(400).send(error(null, "Expert can not bid on there own job"));
            }

            var plancheck = await db.user_plan.findOne({
                where: { user_id: params.userid, status: 1 }
            })
            if (plancheck) {
                if (plancheck.type == "free" && plancheck.bid == 0) {
                    return res.status(400).send(error(null, "Yor free plan 15 bid finish please purchase membership plan"));
                }
            } else {
                return res.status(400).send(error(null, "please buy membership plan"));
            }

            const bidalreadycheck = await db.jobbids.findOne({
                where:{
                    userid:params.userid,
                    jobid :params.jobid,
                    status:1
                }
            })

            if(bidalreadycheck){
                return res.status(400).send(error(null, "You have already submited one bid"));
            }

            params.status = 1;
            const bidadd = await db.jobbids.create(params);

            if (bidadd) {
                if (plancheck.type == "free") {
                    await db.user_plan.update({
                        bid: plancheck.bid - 1
                    }, {
                        where: { user_id: params.userid }
                    })
                }
                if (params.docs) {
                    params.docs.map(item => {
                        db.jobbid_doc.create({
                            jobbid_id: bidadd.id,
                            doc_url: item.file_url,
                            file_name: item.name,
                            size: item.size,
                            extension:item.extension
                        })
                    })
                }
            }

            if (bidadd) {
                var biddataget = await db.jobbids.findOne({
                    attributes: ["id", "proposal", "jobid", 'createdAt', "bidamount", "deliverydate"],
                    where: { id: bidadd.id },
                    include: [
                        {
                            model: db.jobbid_doc,
                            attributes: ["doc_url","file_name","size","extension"]
                        },
                        {
                            model: await db.jobposts,
                            attributes: ["id", "title", "random_id", "budget", "createdAt", "tags", "description"],
                            include: [
                                { model: await db.category, attributes: ["id", "category_name"] },
                                { model: await db.school, attributes: ["id", "school_name"] },
                                { model: await db.subject, attributes: ["id", "subject_name"] },
                                { model: await db.course, attributes: ["id", "course_name"] },
                                { model: await db.country, attributes: ["id", "country_name"] },
                                { model: await db.state, attributes: ["id", "state_name"] },
                                { model: await db.User, attributes: ["id", "profile_image", "firstName", "lastName", "user_name", "createdAt"], include: [{ model: await db.country, attributes: ["country_name"] }] },
                            ]
                        }
                    ]
                })
            }

            message = "Job bid succesfully"
            return res.send(response(biddataget, message));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    bid_view: async (req, res, next) => {
        try {
            const params = req.body

            var biddata = await db.jobbids.findOne({
                attributes: ["id", "proposal", "jobid", 'createdAt', "bidamount", "deliverydate"],
                where: { id: params.id },
                include: [
                    {
                        model: db.jobbid_doc,
                        attributes: ["doc_url","file_name","extension","size"]
                    },
                    {
                        model: await db.jobposts,
                        attributes: ["id", "title"],
                        include: [{
                            model: await db.admin_tag, attributes: ["id", "tag_name"],
                            through: {
                                model: await db.postjob_tags,
                                attributes: []
                            }
                        }]
                    }
                ]
            })

            message = "Bid view successfully"
            return res.send(response(biddata, message));

        } catch (error) {
            next(error)
        }
    },
    jobbidslist: async (req, res, next) => {
        try {
            const params = req.body
            const jobid = req.params.id;
            const currentDate = new Date();

            // check if job exist 
            const job = await db.jobposts.findByPk(jobid)
            if (!job) {
                return res.status(400).send(error(null, "please enter valid job id"));
            }

            const leftdataget = await db.jobbids.findAll({
                where: {
                    status: 1,
                    deliverydate: {
                        [Op.lte]: currentDate // less than current date
                    },
                }
            });

            //status change after due date left//
            await Promise.all(
                leftdataget.map(async (item) => {
                    await db.jobbids.update({
                        status: 0,
                    }, {
                        where: { id: item.id }
                    })
                })
            );

            const bids = await db.jobbids.findAll({
                attributes: { exclude: ['createdAt', "updatedAt"] },
                where: { jobid: jobid, status: 1 },
                order: [["createdAt", "DESC"]],
                include: [
                    {
                    model: db.User, as: 'users',
                    //   where:{ status:1 },
                    attributes: ['firstName', 'lastName', 'user_name', 'email', 'profile_image'],
                    required: false,
                    include: [
                        { model: db.country, attributes: ["country_name"] }
                    ]
                },
                {
                    model:db.jobbid_doc,
                    attributes:["doc_url","file_name","extension","size"]
                }
            ]
            });

            message = "Job bid list get successfully"
            return res.send(response(bids, message));

        } catch (error) {
            next(error)
        }
    },
    job_view: async (req, res, next) => {
        try {
            const params = req.body;
            let doc_type = 1
            const userId = (params.user_id) ? params.user_id : 0

            let responseData = {
                job_detail: {},
                related_jobs: [],
                related_bids: [],
            }

            const page = parseInt(params.page) || 1; // Current page number (default: 1)
            const limit = parseInt(params.limit) || 4; // Number of records per page (default: 10)
            const offset = (page - 1) * limit; // Offset calculation based on current page and limit

            responseData.job_detail = await db.jobposts.findOne({
                attributes: [
                    "id", "random_id", "categoryid", "title", "description", "due_date", "budget", "status", "userid", "tags", "createdAt", "userid", "writingservice","sub_cat_id",
                    [Sequelize.literal(`(SELECT COUNT(jobbids.jobid)FROM jobbids WHERE jobbids.jobid = jobposts.id)`), 'bidcount'],
                    [Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM favorites WHERE jobposts.id = favorites.doc_id AND favorites.doc_type = ${doc_type} AND favorites.user_id = ${userId}) THEN true ELSE false END`),
                        'isFavorite'
                    ]
                ],
                where: { id: params.id },
                include: [
                    { model: db.jobbids, attributes: [] },
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.school, attributes: ["school_name"] },  
                    { model: db.subject, attributes: ["subject_name"] },
                    { model: db.course, attributes: ["course_name"] },
                    { model: db.country, attributes: ["country_name"] },
                    { model: db.state, attributes: ["state_name"] },
                    {
                        model: db.User,
                        attributes: ['firstName', 'lastName', 'user_name', 'profile_image', "createdAt"],
                        include: [
                            { model: db.country, attributes: ["country_name"] }
                        ]
                    },
                    { model: db.postjob_docs, attributes: ["jobpost_id","doc_url","file_name","extension","size"] },
                ],
            })
            responseData.related_jobs = await db.jobposts.findAll({
                attributes: ["id", "categoryid", "title", "description", "due_date", "budget", "status", "userid", "createdAt",
                    [Sequelize.literal(`(SELECT COUNT(jobbids.jobid)FROM jobbids WHERE jobbids.jobid = jobposts.id)`), 'bidcount'],
                ],
                where: {
                    id: { [Op.not]: responseData.job_detail.id },
                    categoryid: responseData.job_detail.categoryid,
                    writingservice: responseData.job_detail.writingservice,
                    status: 1,
                },
                include: [
                    { model: db.jobbids, attributes: [] },
                ],
                order: [["createdAt", "DESC"]],
                limit,
                offset,

            });

            responseData.related_bids = await db.jobbids.findAll({
                attributes: { exclude: ['createdAt', "updatedAt"] },
                where: { jobid: params.id, status: [1,3,4], userid:userId},
                order: [["createdAt", "DESC"]],
                include: [
                    {
                    model: db.User, as: 'users',
                    //   where:{ status:1 },
                    attributes: ['firstName', 'lastName', 'user_name', 'email', 'profile_image'],
                    required: false,
                    include: [
                        { model: db.country, attributes: ["country_name"] }
                    ]
                },
                {
                    model:db.jobbid_doc,
                    attributes:["doc_url","file_name","extension","size"]
                }
            ]
            });

            return res.send(response(responseData));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    simmilar_job_list: async (req, res, next) => {
        try {
            const params = req.body;

            const list = await db.jobposts.findAll({
                attributes: ["id", "title", "budget"],
                where: {
                    status: 1,
                    categoryid: params.category_id
                }
            })

            return res.send(response(list));
        } catch (error) {
            next(error)
        }
    },
    cancel_bid: async (req, res, next) => {
        try {
            const params = req.body;

            const bidcancel = await db.jobbids.update({
                status: 2,
            }, {
                where: { id: params.jobbid_id }
            })
            var message = "Bid cancel successfully"

            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },
    my_posted_jobs_list: async (req, res, next) => {
        try{
            const params = req.body;
            const userId =  req.user.id;
            var status = ""

            if(params.type == 0){ //expired list
                status = 0 
            }else if (params.type == 2){ // cancel list
                status = 2
            }else if(params.type == 3){ // current job list (assign to expert)
                status = 3
            }else if(params.type == 4){ // complete and cancel job list (past list)
                status = [2,4]
            }else{ // my posted job
                status = 1
            }

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
              };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;
            const list = await db.jobposts.findAll({
                attributes: [
                    "id", "title","writingservice", "due_date", "budget", "status", "userid", "tags","createdAt",
                    [Sequelize.literal(`(SELECT COUNT(jobbids.jobid)FROM jobbids WHERE jobbids.jobid = jobposts.id)`), 'bidcount'],
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 250), 'description'],
                ],
                where:{
                    userid:userId,
                    status:status
                },
                include: [
                    { model: db.jobbids, required: false, attributes: [] },
                ],
                offset: offset,
                limit: pageSize,
                order: [sort],

            });

            const count = await db.jobposts.count({
                where:{
                    userid:userId,
                    status:status
                },
                include: [
                    { model: db.jobbids, required: false, attributes: [] },
                ],
            })

            var data = {
                count: count,
                perpage_count:pageSize,
                list
            }

            return res.send(response(data,"My posted job get successfully"));

        }catch(error){
            next(error)
        }
    },
    cancel_posted_job: async (req, res, next) => {
        try{
            const params = req.body;

            const jobcheck = await db.jobbids.findOne({
                where:{
                    jobid:params.job_id,
                    status:1
                }
            })

            if(jobcheck){
                return res.status(400).send(error(null, "Bid is ongoing you don't cancel the job"));
            }

            const alreadycancelcheck =  await db.jobposts.findOne({
                where:{
                    id:params.job_id
                }
            })

            if(alreadycancelcheck.status == 2){
                return res.status(400).send(error(null, "Job already canceled"));
            }

            const statusupdate = await db.jobposts.update({
                    status:2, // for cancel the job
                    },{
                        where:{
                            id:params.job_id
                        }
                    })

            return res.send(response({},"Job Cancelled Successfully"));

        }catch(error){
            next(error)
        }
    },
    posted_job_view: async (req, res, next) => {
        try{
            const params = req.body;
            const userId = req.user.id

            let responseData = {
                job_detail: {},
                more_jobs: [],
                all_bids: [],
            }

            const page = parseInt(params.page) || 1; // Current page number (default: 1)
            const limit = parseInt(params.limit) || 4; // Number of records per page (default: 10)
            const offset = (page - 1) * limit; // Offset calculation based on current page and limit

            responseData.job_detail = await db.jobposts.findOne({
                attributes: [
                    "id", "random_id", "categoryid", "title", "description", "due_date", "budget", "status", "userid", "tags", "createdAt", "userid", "writingservice","sub_cat_id",
                    [Sequelize.literal(`(SELECT COUNT(jobbids.jobid)FROM jobbids WHERE jobbids.jobid = jobposts.id)`), 'bidcount'],
                ],
                where: { id: params.job_id },
                include: [
                    { model: db.jobbids, attributes: [] },
                    { model: db.category, attributes: ["category_name"] },
                    { model: db.subcategory, attributes: ["sub_cat_name"] },
                    { model: db.school, attributes: ["school_name"] },  
                    { model: db.subject, attributes: ["subject_name"] },
                    { model: db.course, attributes: ["course_name"] },
                    { model: db.country, attributes: ["country_name"] },
                    { model: db.state, attributes: ["state_name"] },
                    {
                        model: db.User,
                        attributes: ['firstName', 'lastName', 'user_name', 'profile_image', "createdAt"],
                        include: [
                            { model: db.country, attributes: ["country_name"] }
                        ]
                    },
                    { model: db.postjob_docs, attributes: ["jobpost_id","doc_url","file_name","extension","size"] },
                ],
            })
            responseData.more_jobs = await db.jobposts.findAll({
                attributes: ["id", "title", "description", "due_date", "budget", "status", "userid", "createdAt",
                    [Sequelize.literal(`(SELECT COUNT(jobbids.jobid)FROM jobbids WHERE jobbids.jobid = jobposts.id)`), 'bidcount'],
                ],
                where: {
                    id: { [Op.not]: responseData.job_detail.id },
                    userid:userId,
                    status: 1,
                },
                include: [
                    { model: db.jobbids, attributes: [] },
                ],
                order: [["createdAt", "DESC"]],
                limit,
                offset,

            });

            responseData.all_bids = await db.jobbids.findAll({
                attributes: { exclude: ['createdAt', "updatedAt"] },
                where: { jobid: params.job_id,status:[1,3,4]},
                order: [["createdAt", "DESC"]],
                limit,
                offset,
                include: [
                    {
                    model: db.User, as: 'users',
                    //   where:{ status:1 },
                    attributes: ['firstName', 'lastName', 'user_name', 'email', 'profile_image'],
                    required: false,
                    include: [
                        { model: db.country, attributes: ["country_name"] }
                    ]
                },
                // {
                //     model:db.jobbid_doc,
                //     attributes:["doc_url","file_name","extension","size"]
                // }
            ]
            });

            return res.send(response(responseData));

        }catch(error){
            next(error)
        }
    },
    postjob_all_bids_list: async (req, res, next) => {
        try{
            const params = req.body;

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
              };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            
            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;
            
            const allbids =  await db.jobbids.findAll({
                where:{
                    jobid:params.job_id,
                    status: [1,3,4]
                },
                include: [
                    {
                    model: db.User, as: 'users',
                    //   where:{ status:1 },
                    attributes: ['firstName', 'lastName', 'user_name', 'email', 'profile_image'],
                    required: false,
                    include: [
                        { model: db.country, attributes: ["country_name"] }
                    ]
                },
            ],
                offset: offset,
                limit: pageSize,
                order: [sort],
            })

             const jobdetail = await db.jobposts.findOne({
                attributes:["id","title","random_id","status"],
                where:{
                    id:params.job_id
                }
             })

             const count = await db.jobbids.count({
                where:{
                    jobid:params.job_id
                }
             })

             var data = {
                count: count,
                perpage_count:pageSize,
                jobdetail,
                allbids
            }

            return res.send(response(data));

        }catch(error){
            console.log(error)
            next(error)
        }
    },
    bid_reject_hireexpert: async (req, res, next) => {
        try{
            const params = req.body;

            const jobcheck = await db.jobposts.findOne({
                where:{
                    id:params.job_id
                }
            })

            if(jobcheck.status == 0){ // Job expire
                return res.status(400).send(error({}, "Job expire  please try again"));
            }else if(jobcheck.status == 2){ //job cancel
                return res.status(400).send(error({}, "Job cancel please try again"));
            }else if(jobcheck.status == 3){ // Assign to expert
                return res.status(400).send(error({}, "Job already assign to expert"));
            }else if(jobcheck.status == 4){ // complete job
                return res.status(400).send(error({}, "Job complete you don't action perform"));
            }

            const update =  await db.jobbids.update({
                status:params.status, // 3-Reject , 4-hire expert
            },{
                where:{
                    id:params.bid_id
                }
            })

            if(params.status == 4){
                const jobupdate =  await db.jobposts.update({
                    status:3, // Hire expert
                },{
                    where:{id:params.job_id}
                })
            }

            if(params.status == 3){
                message = "Bid Rejected Successfully"
            }else if(params.status = 4){
                message = "Hire expert successfully"
            }

            return res.send(response({},message));

        }catch(error){
            next(error)
        }
    },
    all_favorite_joblist: async (req, res, next) => {
        try{
            const params = req.body;
            const userId = req.user.id

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
              };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            const type = params.type || 1;  // 1-writing servie , 2-question

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;

            const wherenew = {
                user_id:userId,
                doc_type:1, // for post job
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
                  Sequelize.literal("`jobpost`.`title` LIKE '%" + params.searchtext + "%'"),
                ];
                wherenew[Op.or] = likeConditions;
            }
            const allfav_list =  await db.favorites.findAll({
                where:wherenew,
                include:[
                    {
                        model:db.jobposts,
                        where:{
                            writingservice:type
                        },
                        attributes:["id","title","due_date","tags","budget",
                        [Sequelize.literal(`(SELECT COUNT(jobbids.jobid)FROM jobbids WHERE jobbids.jobid = jobpost.id)`), 'bidcount'],
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
                        model:db.jobposts,
                        where:{
                            writingservice:type
                        },
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