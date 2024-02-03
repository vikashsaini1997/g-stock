const express = require("express");
const db = require("../../models");
const { response, error, sendmails, singleFileRequest } = require("../../helper/helper");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;


module.exports = {
  blog_add: async (req, res, next) => {
    try {
      const params = req.body;
      params.status = 1
      let files = req.files;

      const check = await db.blog.findOne({
        where: { title: params.title }
      })

      if (check) {
        var message = "Title already add";
        return res.status(400).send(error({}, message))
      }

      if (Object.keys(files).length > 0) {
        let files_detail = { files: files.image, img_name: files.originalFilename, folder_name: "blog_image/" }
        var file_name = await singleFileRequest(files_detail);
      } else {
        var message = "Blog image required";
        return res.status(400).send(error({}, message))
      }

      params.image = file_name.Location;

      const add = await db.blog.create(params);

      return res.send(response(add, "Blog add successfully"));

    } catch (error) {
      console.log(error)
      next(error)
    }
  },
  blog_update: async (req, res, next) => {
    try {
      const params = req.body;
      let files = req.files;

      // const check = await db.blog.findOne({
      //   where: { title: params.title }
      // })

      // if (check) {
      //   var message = "Title already add";
      //   return res.status(400).send(error({}, message))
      // }

      if (Object.keys(files).length > 0) {
        let files_detail = { files: files.image, img_name: files.originalFilename, folder_name: "banner_image/" }
        var file_name = await singleFileRequest(files_detail);

        params.image = file_name.Location;
      }

      const add = await db.blog.update(params, {
        where: { id: params.id }
      });

      return res.send(response({}, "Blog update successfully"));

    } catch (error) {
      next(error)
    }
  },

  blog_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page -1) * pageSize;
      const searchName = params.searchtext || '';

      const whereCondition = {
        // status:1
      };

      if (searchName) {
        whereCondition.title = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }


      const totalCount = await db.blog.count({
        where: whereCondition
    });

      const list = await db.blog.findAll({
        attributes: ["id","category_id","title","status","image","createdAt","updatedAt",
                 [Sequelize.fn('LEFT', Sequelize.col('description'), 50), 'description']
                ],
        where: whereCondition,
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: pageSize,
      });

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        list
    }


      return res.send(response(data, "Blog list get successfully"));
    } catch (error) {
      console.log(error)
      next(error)
    }
  },

  blow_view: async (req, res, next) => {
    try {
        const params = req.body;

        const view = await db.blog.findOne({
            where: {
                id: params.id
            }
        })
        message = "Blog view successfully"
        return res.send(response(view, message));
    } catch (error) {
        next(error)
    }
  },
  blog_status_update: async (req, res, next) => {
    try {
      const params = req.body;

      const update = await db.blog.update(params, {
        where: {
          id: params.id
        }
      })

      if (params.status == 1) {
        message = "Blog Activate Successfully!"
      } else if (params.status == 0) {
        message = "Blog Deactivate Successfully!"
      }


      return res.send(response({}, message));

    } catch (error) {
      next(error)
    }
  },
}