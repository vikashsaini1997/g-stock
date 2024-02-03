const express = require("express");
const db = require("../../models");
const { response, error, sendmails, singleFileRequest } = require("../../helper/helper");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;

module.exports = {
    create_cms: async (req, res, next) => {
        try {
            const params = req.body
            params.status = 1
            if (await db.cms.findOne({
                where: {
                    title: params.title
                }
            })) {
                var message = "title is already taken.";
                return res.status(400).send(error({}, message))
            }

            await db.cms.create(params);


            return res.send(response({}, "Cms created successfully.!!!"))
        } catch (error) {
            next(error)
        }
    },
    view_cms: async (req, res, next) => {
        try {
            const params = req.body
            const cms_view = await db.cms.findOne({
                where: {
                    id: params.cms_id
                }
            })
            return res.send(response({
                cms_view
            }, "cms find succesfully !!!"))
        } catch (error) {
            next(error)
        }
    },
    cms_list: async (req, res, next) => {
        try {
            const cmsList = await db.cms.findAll({
                where: {
                  status: 1,
                },
                attributes: [
                  'id',
                  'title',
                  "slug",
                  "createdAt",
                  "updatedAt",
                  "status",
                  [Sequelize.literal(`LEFT(description, 200)`), 'description',],
                ],
              });

              const sanitizedCmsList = cmsList.map(item => {
                return {
                    id: item.id,
                    title: item.title,
                    slug:item.slug,
                    createdAt:item.createdAt,
                    updatedAt:item.updatedAt,
                    status:item.status,
                    description: item.description.replace(/<[^>]*>/g, ''),
                };
            });
            
              return res.send(response({ cmsList: sanitizedCmsList }, "CMS list found successfully !!!"));
        } catch (error) {
            console.log(error)
            next(error)
        }
    },
    cms_update: async (req, res, next) => {
        try {
            const params = req.body

            const check = await db.cms.findOne({
                where:{
                    id:params.cms_id
                }
            })
            
            if(check.title == params.title){
                params.title = check.title
            }else{
                if(params.title){
                    if (await db.cms.findOne({
                        where: {
                            title: params.title
                        }
                    })) {
                        var message = "title is already taken.";
                        return res.status(400).send(error({}, message))
                    }
                }
            }

            await db.cms.update(params, {
                where: {
                    id: params.cms_id
                }
            })
            return res.send(response({}, "cms updated succesfully !!!"))
        } catch (error) {
            next(error)
            console.log(error)
        }
    },
    cms_manager: async (req, res, next) => {
        try {
            const params = req.body
            const blogs = await db.Blog.findOne({
                where: {
                    id: params.blog_id
                }
            })
            if (!blogs)
                throw 'No data found.';
            await db.Blog.update({
                description: params.description
            }, {
                where: {
                    id: params.blog_id
                }
            });

            Object.assign(blogs, params);
            await blogs.save();
            return res.send(response({}, "blog  description updated successfully.!!!"))

        } catch (error) {
            next(error)

        }
    },
    faq_add: async (req, res, next) => {
        try{
            const params = req.body

            params.detail.map(async(item)=>{
                await db.faq.create({
                    question:item.question,
                    answer:item.answer,
                    status:1
                })
            })
            return res.send(response({}, "Faq add successfully"))

        }catch(error){
            next(error)
        }
    },
    faq_list: async (req, res, next) => {
        try{
            
            const list = await db.faq.findAll()

            return res.send(response(list, "Faq add successfully"))
        }catch(error){
            next(error)
        }
    },
    faq_update: async (req, res, next) => {
        try{
            const params = req.body

            await db.faq.update(params,{
                where:{
                    id:params.id
                }
            })
            return res.send(response({}, "Faq update successfully"))

        }catch(error){
            next(error)
        }
    },
    faq_delete: async (req, res, next) => {
        try{
            const params = req.body

            await db.faq.destroy({
                where:{
                    id:params.id
                }
            })
            return res.send(response({}, "Faq delete successfully"))

        }catch(error){
            next(error)
        }
    },
}