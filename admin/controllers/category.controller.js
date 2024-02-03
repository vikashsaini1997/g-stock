const express = require("express");
const db = require("../../models");
const { response, error, sendmails, singleFileRequest } = require("../../helper/helper");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;




module.exports = {
    categoryadd: async (req, res, next) => {
        try {

            const params = req.body
            let files = req.files
            params.status = 1

            const cat_check = await db.category.findOne({
                where: { category_name: params.category_name }
            })
            if (cat_check) {
                message = "Category already add"
                return res.status(400).send(error({}, message));
            }

            if (Object.keys(files).length > 0) {
                let files_detail = { files: files.cat_image, img_name: files.originalFilename, folder_name: "category_image/" }
                var file_name = await singleFileRequest(files_detail);
            } else {
                var message = "Category image required";
                return res.status(400).send(error({}, message))
            }

            params.cat_image = file_name.Location;


            const add = await db.category.create(params)

            message = " Category Added Successfully!"
            return res.send(response(add, message));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },

    categoryList: async (req, res, next) => {
        try {
            const params = req.body

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;

            if(params.page == 0){
                const list = await db.category.findAll()
                return res.send(response(list));
            }else{

            let whereCondition = {};
            if (params.searchtext) {
                whereCondition = {
                    category_name: {
                        [Op.like]: `%${params.searchtext}%`
                    }
                };
            }

            const totalCount = await db.category.count({
                where: whereCondition
            });
            const list = await db.category.findAll({
                where: whereCondition,
                order: [["createdAt", "DESC"]],
                offset: offset,
                limit: pageSize,
            })

            const data = {
                totalcount: totalCount,
                perpage_count: pageSize,
                list
            }
            return res.send(response(data));
        }

        } catch (error) {
            next(error)
        }
    },

    categoryUpdate: async (req, res, next) => {
        try {
            const params = req.body
            const files = req.files

            const cat_check = await db.category.findOne({
                where: { category_name: params.category_name }
            })
            if (cat_check) {
                message = "Category already add"
                return res.status(400).send(error({}, message));
            }
            if (Object.keys(files).length > 0) {
                let files_detail = { files: files.cat_image, img_name: files.originalFilename, folder_name: "category_image/" }
                var file_name = await singleFileRequest(files_detail);

                params.cat_image = file_name.Location;
            }
            const cat = await db.category.update(params, {
                where: { id: params.id }
            })

            message = "Category update succesfully"
            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },

    category_view: async (req, res, next) => {
        try {
            const params = req.body;

            const view = await db.category.findOne({
                where: {
                    id: params.id
                }
            })
            message = "Category view successfully"
            return res.send(response(view, message));
        } catch (error) {
            next(error)
        }
    },
    category_status_update: async (req, res, next) => {
        try {
            const params = req.body;

            const view = await db.category.update(params, {
                where: {
                    id: params.id
                }
            })

            if (params.status == 0) {
                message = "Category Deactivated Successfully!  "
            } else if (params.status = 1) {
                message = "Category Activated Successfully!"
            }
            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },


    subCategoryadd: async (req, res, next) => {
        try {
            const params = req.body
            const files = req.files
            params.status = 1

            const cat_check = await db.category.findOne({
                where: { id: params.cat_id }
            })

            if (!cat_check) {
                var message = "Category not available";
                return res.send(error({}, message))
            }

            const check = await db.subcategory.findOne({
                where: { cat_id: params.cat_id, sub_cat_name: params.sub_cat_name }
            })
            if (check) {
                message = "Sub category is already added"
                return res.status(400).send(error({}, message));
            }


            if (Object.keys(files).length > 0) {
                let files_detail = { files: files.sub_cat_image, img_name: files.originalFilename, folder_name: "sub_cat_image/" }
                var file_name = await singleFileRequest(files_detail);
            } else {
                var message = "Sub-category image required";
                return res.status(400).send(error({}, message))
            }

            params.sub_cat_image = file_name.Location;

            const subCat = await db.subcategory.create(params)

            message = "Sub Category Added Successfully!"
            return res.send(response(subCat, message));
        } catch (error) {
            next(error)
        }
    },

    catSubcatList: async (req, res, next) => {
        try {
            const params = req.body

            const page = parseInt(params.page) || 1; // Current page number
            const pageSize = parseInt(params.pageSize) || 15;
            const offset = (page - 1) * pageSize;



            if (params.cat_id == 0) {
                var list = await db.subcategory.findAll({
                    order: [["createdAt", "DESC"]],
                });
            } else {

                let whereCondition = {};
                if (params.searchtext) {
                    whereCondition = {
                        cat_id: params.cat_id,
                        sub_cat_name: {
                            [Op.like]: `%${params.searchtext}%`
                        }
                    };
                } else {
                    whereCondition = {
                        cat_id: params.cat_id
                    }
                }

                var totalCount = await db.subcategory.count({
                    where: whereCondition
                });
                var list = await db.subcategory.findAll({
                    order: [["createdAt", "DESC"]],
                    where: whereCondition,
                    include: [
                        { model: db.category, attributes: ["category_name"] }
                    ],
                    offset: offset,
                    limit: pageSize,
                });
            }

            const data = {
                totalcount: totalCount,
                perpage_count: pageSize,
                list
            }
            return res.send(response(data));

        } catch (error) {
            next(error)
        }
    },

    subcategory_status_update: async (req, res, next) => {
        try {
            const params = req.body;

            const view = await db.subcategory.update(params, {
                where: {
                    id: params.id
                }
            })

            if (params.status == 0) {
                message = "Sub Category Deactivated Successfully!  "
            } else if (params.status = 1) {
                message = "Sub Category Activated Successfully!"
            }
            return res.send(response({}, message));
        } catch (error) {
            next(error)
        }
    },

    category_doc_count: async (req, res, next) => {
        try {
            const params = req.body;

            const count = await db.category.findAll({
                attributes: ["category_name", [Sequelize.fn("COUNT", Sequelize.col("postjob_docs.category_id")), "doc_count"]],
                include: [
                    { model: db.postjob_docs, attributes: [] }
                ],
                group: ["category.id"]
            })

            return res.send(response(count));
        } catch (error) {
            next(error)
        }
    }

}