const express = require("express");
const db = require("../../models");
const { response, error, sendmails, saveAsFile } = require("../../helper/helper");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;




module.exports = {
    jobadd: async (req, res, next) => {
        try {
            const params = req.body
            let file = req.file
            console.log(file)

            // check if user exist 
            const user = await db.User.findByPk(params.userid);
            if (!user) {
                return res.status(400).send(error(null, "please enter valid userid"));
            }

            if (req.file.path) {
                params.document = req.file.path
            }

            // upload file to folder
            // const fileSavePath = saveAsFile(file,"uploads/documents/");
            // if(fileSavePath.length>0)
            // params.document = fileSavePath;

            params.status = 1;
            console.log(params)
            const add = await db.jobpost.create(params);

            message = "Job add succesfully"
            return res.send(response(add, message));


        } catch (error) {
            console.log(error)
            next(error)
        }
    },

    alljob_list: async (req, res, next) => {
        try{
            const params = req.body;
            var status = [0,1,3,4]

            if(params.type == 1) { //only active job
                status = [1]
            }else if (params.type == 2) { //expect active all other
                status = [0,3,4]
            }

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;

            const sortOptions = {
                1: ["createdAt", "DESC"],
                2: ["createdAt", "ASC"],
              };
            const sort = sortOptions[params.sort] || ["createdAt", "DESC"];

            const searchName = params.searchtext || '';

            const whereCondition = {
                status:status
            };
      
            if (searchName) {
              whereCondition.title = {
                [db.Sequelize.Op.like]: `%${searchName}%`
              };
            }


            const joblist = await db.jobposts.findAll({
                attributes:["id","title","description","due_date","status",'budget',"userid","writingservice",
                    [Sequelize.literal(`(SELECT COUNT(jobbids.jobid)FROM jobbids WHERE jobbids.jobid = jobposts.id)`), 'bidcount'],
                    [Sequelize.fn('LEFT', Sequelize.col('description'), 150), 'description'],
                ],
                where:whereCondition,
                offset: offset,
                limit: pageSize,
                order: [sort],
            })

            const alljobcount = await db.jobposts.count({
                where:whereCondition,
            })

            var data = {
                count: alljobcount,
                perpage_count:pageSize,
                joblist
            }

            var message = "Job list get successfully"
            return res.send(response(data, message));

        }catch(error){
            console.log(error)
            next(error)
        }
    }

}