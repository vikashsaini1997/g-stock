const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../../models");
const { response, error, sendmails, singleFileRequest } = require("../../helper/helper");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;



module.exports = {
    coupan_add: async (req, res, next) => {
        try {
            const params = req.body;
            params.status = 1

            const check = await db.coupan.findOne({
                where: {
                    title: params.title
                }
            })

            if (check) {
                var message = "Title already use";
                return res.send(error({}, message))
            }

            const add = await db.coupan.create(params)

            message = "Coupon Added Successfully!"
            return res.send(response(add, message));

        } catch (error) {
            next(error)
        }
    },

    coupan_list: async (req, res, next) => {
        try {
            const params = req.body

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;

            const currentDate = new Date();
            const beforeDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
            
            const leftdataget = await db.coupan.findAll({
                where: {
                    expiry_date: {
                        [Op.lt]: beforeDate// less than current date
                    },
                    status: 1,
                }
            });
            
            //status change after due date left
            await Promise.all(
                leftdataget.map(async (item) => {
                  await db.coupan.update({ status: 0 }, { where: { id: item.id } });
                })
              );

            let whereCondition = {};
            if (params.searchtext) {
                whereCondition = {
                    title: {
                        [Op.like]: `%${params.searchtext}%`
                    }
                };
            }

            var totalCount = await db.coupan.count({
                where: whereCondition
            });

            const list = await db.coupan.findAll({
                where:whereCondition,
                order: [["createdAt", "DESC"]],
                offset: offset,
                limit: pageSize,
            })

            message = "List find successfully add"

            const data = {
                totalcount: totalCount,
                perpage_count: pageSize,
                list
              }
            return res.send(response(data, message));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },

    coupan_status_update: async (req, res, next) => {
        try {
            const params = req.body;

            const udpate = await db.coupan.update(params, {
                where: {
                    id: params.id
                }
            })

            if (params.status == 1) {
                message = "Coupon Activated Successfully!"
            } else if (params.status == 0) {
                message = "Coupon Deactivated Successfully!"
            }

            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    }
}