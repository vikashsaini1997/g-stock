const express = require("express");
const db = require("../../models");
const { response, error, sendmails, singleFileRequest } = require("../../helper/helper");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;



module.exports = {
    add_plan: async (req, res, next) => {
        try {
            const params = req.body;
            params.status = 1
            params.description = JSON.stringify(params.description)

            const check = await db.membership_plan.findOne({
                where: { name: params.name }
            })

            if (check) {
                return res.status(400).send(error(null, "Plan with same name already exist"));
            }
            // Also check if free membership plan already exist
            const checkFreePlan = await db.membership_plan.findOne({
                where: { plan_type: "Free" }
            })
            
            if(checkFreePlan !== null){
            if (checkFreePlan.plan_type == params.plan_type) {
                return res.status(400).send(error(null, "Free plan already exist"));
            }
        }
            const activeplancheck = await db.membership_plan.count({
                where:{
                    status:1
                }
            })

            if(activeplancheck >= 4){
                params.status = 0
            }else{
                params.status = 1
            }
            params.monthly_price = params.total_price / params.duration

            const add = await db.membership_plan.create(params)

            var message = "Plan add successfully"
            return res.send(response(add, message));

        } catch (error) {
            next(error)
        }
    },

    plan_update: async (req, res, next) => {
        try {
            const params = req.body;
            params.description = JSON.stringify(params.description)

            const check = await db.membership_plan.findOne({
                where: { id: params.id }
            })

            if (check.name == params.name) {
                params.name = check.name
            } else {
                if (params.name) {
                    if (await db.membership_plan.findOne({
                        where: {
                            name: params.name
                        }
                    })) {
                        return res.status(400).send(error(null, "Plan with same name already exist"));
                    }
                }
            }

            // Also check if free membership plan already exist
            if(params.plan_type == "Free"){
                const checkFreePlan = await db.membership_plan.findOne({
                    where: {
                        plan_type: 'Free',
                        id: {
                            [Op.ne]: params.id
                        },
                    }
                })
    
                if (checkFreePlan) {
                    return res.status(400).send(error(null, "Free plan already exist"));
                }
            }

            if (params.total_price && params.duration) {
                var month_price = params.total_price / params.duration
                params.monthly_price = month_price.toFixed(2)
            }

            const update = await db.membership_plan.update(params, {
                where: { id: params.id }
            })
            var message = "Plan update successfully"
            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },

    plan_update_status: async (req, res, next) => {
        try {
            const planId = req.params.planid;

            const checkPlan = await db.membership_plan.findOne({
                where: { id: planId }
            })

            if(checkPlan.status == 0){
            const activeplancheck = await db.membership_plan.count({
                where:{
                    status:1
                }
            })

            if(activeplancheck  == 4){
                var message = "You can active only four plans"
                return res.status(400).send(error({}, message))
            }

        }
            var updatedStatus = 0; // Inactive
            if (checkPlan.status == 0) {
                updatedStatus = 1 // Active
            }

            var paramObj = {
                status: updatedStatus
            }

            const update = await db.membership_plan.update(paramObj, {
                where: { id: planId }
            })
            var message = "Plan status updated successfully"
            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },

    plan_list: async (req, res, next) => {
        try {

            const list = await db.membership_plan.findAll();

            var message = "Plan list get successfully"
            return res.send(response(list, message));

        } catch (error) {
            next(error)
        }
    },

    user_plan_list: async (req, res, next) => {
        try{
            const params = req.body;

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;
            const searchName = params.searchtext || '';

            const list = await db.user_plan.findAll({
                include:[
                    {
                        model:db.User,
                        attributes:["firstName","lastName"],
                        
                    },
                    {
                        model:db.membership_plan,
                        //attributes:["firstName","lastName"]
                    }
                ],
                where: {
                    [Sequelize.Op.or]: [
                        {
                            '$User.firstName$': {
                                [Sequelize.Op.like]: `%${searchName}%`
                            }
                        },
                        {
                            '$User.lastName$': {
                                [Sequelize.Op.like]: `%${searchName}%`
                            }
                        }
                    ]
                },
                offset: offset,
                limit: pageSize,
            })

            const count = await db.user_plan.count({
                include:[
                    {
                        model:db.User,
                        attributes:["firstName","lastName"]
                    },
                    {
                        model:db.membership_plan,
                        //attributes:["firstName","lastName"]
                    }
                ]
            })

            var data = {
                totalcount: count,
                perpage_count:pageSize,
                list
            }


            message = "User plan list get successfully"
            return res.send(response(data, message));


        }catch(error){
            next(error)
        }
    }

}