const express = require("express");
const jwt = require("jsonwebtoken");
const db = require("../../models");
const { response, error, sendmails, singleFileRequest } = require("../../helper/helper");
const bcrypt = require("bcryptjs");
const config = require("../../config/config.js")
const randtoken = require("rand-token");
const Sequelize = require('sequelize')
const Op = Sequelize.Op;
const fastcsv = require('fast-csv');
const fs = require('fs');
const path = require('path');
const { reportdownload } = require("../../helper/reportdownload");

//admin//

module.exports = {

  Login: async (req, res, next) => {
    try {
      const params = req.body
      const user = await db.User.findOne({
        attributes: { exclude: ['auth_token'] },
        where: {
          email: params.email,
          role_id: 1,
          status: "1"
        }
      });
      if (!user) {
        let message = "Your Email is not registered with us.";
        return res.status(400).send(error({}, message))
      }

      if (!user || !(await bcrypt.compare(params.password, user.password))) {
        let message = "Password is incorrect.";
        return res.status(400).send(error({}, message))
      }

      if (user.role_id == "1") {
        // authentication successful
        const token = jwt.sign({
          sub: user.id,
          role_id: user.id
        }, config.secret, {
          expiresIn: '1d'
        });

        await db.User.update({
          auth_token: token
        }, { where: { email: params.email } })

        message = "You are logged in successfully."

        var data = {
          ...omitHash(user.get()),
          token,
        };
        return res.send(response(data, message));
      }
    } catch (error) {
      console.log(error)
      next(error);
    }
  },

  forgotpassword: async (req, res, next) => {
    try {
      const params = req.body


      const user = await db.User.findOne({
        where: {
          email: params.email
        }
      })
      if (!user) {
        var message = "Your Email is not registered with us";
        return res.status(400).send(error({}, message))
      }
      var token = randtoken.generate(25);
      var forgottoken = token
      const detail = { template_code: "ADMIN FORGOT PASSWORD", token: forgottoken, username: user.user_name }
      sendmails(user.email, detail)

      const update = await db.User.update({
        forgot_token: forgottoken
      }, {
        where: {
          email: params.email
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

      if (params.password != params.confirm_password) {
        var message = "Password and confirm password does not match";
        return res.status(400).send(error({}, message))
      }

      const password_check = await bcrypt.compare(params.password, user.password)
      if (password_check) {
        let message = "The new password you entered is the same as your old password. Enter a different password.";
        return res.status(400).send(error({}, message))
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
      var message = "Password updated successfully"
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
        return res.send(error({}, message))
      }
      if (params.password != params.confirm_password) {
        var message = "New password and confirm password does not match";
        return res.send(error({}, message))
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
          res.send({ msg: 'You have been Logged Out' });
        } else {
          res.send({ msg: 'Error' });
        }
      });
    } catch (error) {
      next(error)
    }
  },
  //school//
  school_add: async (req, res, next) => {
    try {
      const params = req.body;
      params.status = 1

      const check = await db.school.findOne({
        where: {
          school_name: params.school_name
        }
      })

      if (check) {
        var message = "School already added";
        return res.send(error({}, message))
      }

      const add = await db.school.create(params)

      return res.send(response(add, "School Added Successfully"));
    } catch (error) {
      next(error)
    }
  },
  school_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page - 1) * pageSize;
      const searchName = params.searchtext || '';

      const whereCondition = {};

      if (searchName) {
        whereCondition.school_name = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }

      const totalCount = await db.school.count({
        where: whereCondition,
      });

      const list = await db.school.findAll({
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

      return res.send(response(data, "School list get successfully"));
    } catch (error) {
      next(error)
    }
  },
  school_update: async (req, res, next) => {
    try {
      const params = req.body;

      const check = await db.school.findOne({
        where: {
          id: params.id
        }
      })

      if (check.school_name == params.school_name) {
        params.school_name = check.school_name
      } else {
        if (params.school_name) {
          const school_check = await db.school.findOne({
            where: {
              school_name: params.school_name
            }
          })

          if (school_check) {
            var message = "School already added";
            return res.send(error({}, message))
          }
        }
      }

      const update = await db.school.update(params, {
        where: { id: params.id }
      })

      return res.send(response({}, "School Updated Successfully"));
    } catch (error) {
      next(error)
    }
  },
  //subject//
  subject_add: async (req, res, next) => {
    try {
      const params = req.body
      params.status = 1

      const course_check = await db.course.findOne({
        where: { id: params.course_id }
      })

      if (!course_check) {
        var message = "course not available";
        return res.send(error({}, message))
      }

      const subject_check = await db.subject.findOne({
        where: {
          course_id: params.course_id,
          subject_name: params.subject_name
        }
      })

      if (subject_check) {
        var message = "Subject is already added";
        return res.send(error({}, message))
      }


      const add = await db.subject.create(params);

      return res.send(response(add, "Subject Added Successfully"));
    } catch (error) {
      next(error)
    }
  },
  subject_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page - 1) * pageSize;
      const searchName = params.searchtext || '';

      const whereCondition = {};

      if (searchName) {
        whereCondition.subject_name = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }

      const totalCount = await db.subject.count({
        where:whereCondition
      });

      const list = await db.subject.findAll({
        where:whereCondition,
        include: [
          { model: db.course, attributes: ["course_name"] }
        ],
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: pageSize,
      });

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        list
      }

      return res.send(response(data, "Subject list get successfully"));
    } catch (error) {
      next(error)
    }
  },
  subject_update: async (req, res, next) => {
    try {
      const params = req.body;

      const course_check = await db.course.findOne({
        where: {
          id: params.course_id
        }
      })

      if (!course_check) {
        var message = "Course not available";
        return res.send(error({}, message))
      }

      const subject_check = await db.subject.findOne({
        where: {
          id: params.id,
        }
      })
      if (subject_check.course_id == params.course_id && subject_check.subject_name == params.subject_name) {
        params.course_id = subject_check.course_id,
          params.subject_name = subject_check.subject_name
      } else {
        const subj_course_check = await db.subject.findOne({
          where: {
            subject_name: params.subject_name,
            course_id: params.course_id
          }
        })

        if (subj_course_check) {
          var message = "Subject already added in course";
          return res.send(error({}, message))
        }

      }

      const update = await db.subject.update(params, {
        where: { id: params.id }
      })

      return res.send(response({}, "Subject Updated Successfully"));
    } catch (error) {
      next(error)
    }
  },

  //course//
  course_add: async (req, res, next) => {
    try {
      const params = req.body;
      params.status = 1

      const check = await db.course.findOne({
        where: { course_name: params.course_name }
      })

      if (check) {
        var message = "Course is already added";
        return res.send(error({}, message))
      }

      const add = await db.course.create(params);

      return res.send(response(add, "Course Added Successfully"));

    } catch (error) {
      next(error)
    }
  },
  course_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page - 1) * pageSize;
      const searchName = params.searchtext || '';

      const whereCondition = {};

      if (searchName) {
        whereCondition.course_name = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }

      const totalCount = await db.course.count({
        where:whereCondition
      });

      const list = await db.course.findAll({
        where:whereCondition,
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: pageSize,
      });

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        list
      }

      return res.send(response(data, "Course list get successfully"));

    } catch (error) {
      next(error)
    }
  },
  course_update: async (req, res, next) => {
    try {
      const params = req.body;

      const check = await db.course.findOne({
        where: {
          id: params.id
        }
      })

      if (check.course_name == params.course_name) {
        params.course_name = check.course_name
      } else {
        if (params.course_name) {
          const course_check = await db.course.findOne({
            where: {
              course_name: params.course_name
            }
          })

          if (course_check) {
            var message = "Course is already added";
            return res.send(error({}, message))
          }
        }
      }

      const update = await db.course.update(params, {
        where: { id: params.id }
      })

      return res.send(response({}, "Course Updated Successfully"));
    } catch (error) {
      next(error)
    }
  },
  //country//
  country_add: async (req, res, next) => {
    try {
      const params = req.body;
      params.status = 1

      const check = await db.country.findOne({
        where: { country_name: params.country_name }
      })

      if (check) {
        var message = "Country already add";
        return res.send(error({}, message))
      }

      const add = await db.country.create(params);

      return res.send(response(add, "Country Added Successfully"));

    } catch (error) {
      next(error)
    }
  },
  country_list: async (req, res, next) => {
    try {
      const params = req.body;

      const list = await db.country.findAll({
        order: [["createdAt", "DESC"]]
      });

      return res.send(response(list, "Country list get successfully"));

    } catch (error) {
      next(error)
    }
  },
  country_status_update: async (req, res, next) => {
    try {
      const params = req.body;

      const update = await db.country.update({
        status: params.status
      }, {
        where: { id: params.id }
      })

      if (params.status == 1) {
        message = "Country activate successfully"
      } else {
        message = "Country deactivate successfully"
      }

      return res.send(response({}, message));
    } catch (error) {
      next(error)
    }
  },
  //state//
  state_add: async (req, res, next) => {
    try {
      const params = req.body;
      params.status = 1

      const country_check = await db.country.findOne({
        where: { id: params.country_id }
      })

      if (!country_check) {
        var message = "Country not available";
        return res.status(400).send(error({}, message))
      }

      const state_check = await db.state.findOne({
        where: {
          country_id: params.country_id,
          state_name: params.state_name
        }
      })

      if (state_check) {
        var message = "State alreay add";
        return res.status(400).send(error({}, message))
      }

      const add = await db.state.create(params)

      return res.send(response(add, "State add successfully"));
    } catch (error) {
      next(error)
    }
  },
  state_list: async (req, res, next) => {
    try {
      const params = req.body;

      const list = await db.state.findAll({
        order: [["createdAt", "DESC"]]
      });

      return res.send(response(list, "State list get successfully"));
    } catch (error) {
      next(error)
    }
  },
  state_status_update: async (req, res, next) => {
    try {
      const params = req.body;

      // const country_check = await db.country.findOne({
      //   where: {
      //     id: params.country_id
      //   }
      // })

      // if (!country_check) {
      //   var message = "Country not available";
      //   return res.status(400).send(error({}, message))
      // }

      // const state_check = await db.state.findOne({
      //   where: {
      //     id: params.id,
      //   }
      // })
      // if (state_check.country_id == params.country_id && state_check.state_name == params.state_name) {
      //   params.country_id = state_check.country_id,
      //     params.state_name = state_check.state_name
      // } else {
      //   const state_count_check = await db.state.findOne({
      //     where: {
      //       state_name: params.state_name,
      //       country_id: params.country_id
      //     }
      //   })

      //   if (state_count_check) {
      //     var message = "The state already add in country";
      //     return res.status(400).send(error({}, message))
      //   }

      // }

      const update = await db.state.update({
        status: params.status,
      }, {
        where: { id: params.id }
      })

      if (params.status == 1) {
        message = "State activate successfully"
      } else {
        message = "State deactivate successfully"
      }

      return res.send(response({}, message));
    } catch (error) {
      next(error)
    }
  },

  //city//
  city_add: async (req, res, next) => {
    try {
      const params = req.body;
      params.status = 1

      const state_check = await db.state.findOne({
        where: { id: params.state_id }
      })

      if (!state_check) {
        var message = "Country not available";
        return res.status(400).send(error({}, message))
      }

      const check = await db.city.findOne({
        where: {
          state_id: params.state_id,
          city_name: params.city_name
        }
      })

      if (check) {
        var message = "City already add";
        return res.status(400).send(error({}, message))
      }

      const add = await db.city.create(params)

      return res.send(response(add, "City add successfully"));
    } catch (error) {
      next(error)
    }
  },

  city_list: async (req, res, next) => {
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

  //HOME PAGE BANNER//

  banner_add: async (req, res, next) => {
    try {
      const params = req.body;
      params.status = 1
      let files = req.files;

      const check = await db.admin_banner.findOne({
        where: { title: params.title }
      })

      if (check) {
        var message = "Title already add";
        return res.status(400).send(error({}, message))
      }

      const subtitlecheck = await db.admin_banner.findOne({
        where: { sub_title: params.sub_title }
      })

      if (subtitlecheck) {
        var message = "Sub-Title already add";
        return res.status(400).send(error({}, message))
      }

      if (Object.keys(files).length > 0) {
        let files_detail = { files: files.image, img_name: files.originalFilename, folder_name: "banner_image/" }
        var file_name = await singleFileRequest(files_detail);
      } else {
        var message = "Banner image required";
        return res.status(400).send(error({}, message))
      }

      params.image = file_name.Location;

      const add = await db.admin_banner.create(params);

      return res.send(response(add, "Banner add successfully"));

    } catch (error) {
      next(error)
    }
  },
  banner_update: async (req, res, next) => {
    try {
      const params = req.body;
      let files = req.files;

      const check = await db.admin_banner.findOne({
        where: { id: params.id }
      })

      if (params.title) {
        if (params.title !== check.title) {
          const title_check = await db.admin_banner.findOne({
            where: {
              title: params.title
            }
          })

          if (title_check) {
            var message = "Title is already added";
            return res.send(error({}, message))
          }
        }
      }

      if (params.sub_title) {
        if (params.sub_title !== check.sub_title) {
          const sub_title_check = await db.admin_banner.findOne({
            where: {
              sub_title: params.sub_title
            }
          })

          if (sub_title_check) {
            var message = "Sub-Title is already added";
            return res.send(error({}, message))
          }
        }
      }

      if (Object.keys(files).length > 0) {
        let files_detail = { files: files.image, img_name: files.originalFilename, folder_name: "banner_image/" }
        var file_name = await singleFileRequest(files_detail);

        params.image = file_name.Location;
      }

      const add = await db.admin_banner.update(params, {
        where: { id: params.id }
      });

      return res.send(response({}, "Banner update successfully"));

    } catch (error) {
      next(error)
    }
  },
  banner_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page - 1) * pageSize;


      const list = await db.admin_banner.findAll({
        // where: { status: 1 },
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: pageSize,
      });


      return res.send(response(list, "Banner list get successfully"));
    } catch (error) {
      next(error)
    }
  },
  banner_status_update: async (req, res, next) => {
    try {
      const params = req.body;

      const update = await db.admin_banner.update(params, {
        where: {
          id: params.id
        }
      })

      if (params.status == 1) {
        message = "Banner Activate Successfully!"
      } else if (params.status == 0) {
        message = "Banner Deactivate Successfully!"
      }


      return res.send(response({}, message));

    } catch (error) {
      next(error)
    }
  },

  //skills//

  skills_add: async (req, res, next) => {
    try {
      const params = req.body
      const files = req.files
      params.status = 1

      // const cat_check = await db.category.findOne({
      //     where: { id: params.category_id }
      //   })

      //   if (!cat_check) {
      //     var message = "Category not available";
      //     return res.send(error({}, message))
      //   }

      const check = await db.skill.findOne({
        where: { sub_cat_id: params.sub_cat_id, skill_name: params.skill_name }
      })
      if (check) {
        message = "Skill is already added"
        return res.status(400).send(error({}, message));
      }


      // if (Object.keys(files).length > 0) {
      //     let files_detail = { files: files.skill_image, img_name: files.originalFilename, folder_name: "skill_image/" }
      //     var file_name = await singleFileRequest(files_detail);
      //   } else {
      //     var message = "Skill  image required";
      //     return res.status(400).send(error({}, message))
      //   }

      // params.skill_image = file_name.Location;

      const skill = await db.skill.create(params)

      message = "Skills Added Successfully!"
      return res.send(response(skill, message));
    } catch (error) {
      console.log(error)
      next(error)
    }
  },

  skills_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 15;
      const offset = (page - 1) * pageSize;

      let whereCondition = {};
      if (params.searchtext) {
        whereCondition = {
          skill_name: {
            [Op.like]: `%${params.searchtext}%`
          }
        };
      }

      var totalCount = await db.skill.count({
        where: whereCondition
      });

      const list = await db.skill.findAll({
        where: whereCondition,
        include: [
          { model: db.subcategory, attributes: ["sub_cat_name"] }
        ],
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: pageSize,
      });

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        list
      }

      return res.send(response(data, "Skills list get successfully"));
    } catch (error) {
      console.log(error)
      next(error)
    }
  },

  skill_status_update: async (req, res, next) => {
    try {
      const params = req.body;

      const update = await db.skill.update(params, {
        where: {
          id: params.id
        }
      })

      if (params.status == 1) {
        message = "Skills Activated Successfully!"
      } else if (params.status == 0) {
        message = "Skills Deactivated Successfully!"
      }


      return res.send(response({}, message));

    } catch (error) {
      next(error)
    }
  },

  //tags//

  tags_add: async (req, res, next) => {
    try {
      const params = req.body
      params.status = 1

      const cat_check = await db.category.findOne({
        where: { id: params.category_id }
      })

      if (!cat_check) {
        var message = "Category not available";
        return res.send(error({}, message))
      }

      const tag_check = await db.admin_tag.findOne({
        where: {
          category_id: params.category_id,
          tag_name: params.tag_name
        }
      })

      if (tag_check) {
        var message = "Tag is already added";
        return res.send(error({}, message))
      }


      const add = await db.admin_tag.create(params);

      return res.send(response(add, "Tags Added Successfully!"));
    } catch (error) {
      next(error)
    }
  },

  tag_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 15;
      const offset = (page - 1) * pageSize;

      let whereCondition = {};
      if (params.searchtext) {
        whereCondition = {
          tag_name: {
            [Op.like]: `%${params.searchtext}%`
          }
        };
      }

      var totalCount = await db.admin_tag.count({
        where: whereCondition
      });

      const list = await db.admin_tag.findAll({
        where: whereCondition,
        order: [["createdAt", "DESC"]],
        include: [
          { model: db.category, attributes: ["category_name"] }
        ],
        offset: offset,
        limit: pageSize,
      });

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        list
      }

      return res.send(response(data, "Tag list get successfully"));
    } catch (error) {
      next(error)
    }
  },

  tag_status_update: async (req, res, next) => {
    try {
      const params = req.body;

      const update = await db.admin_tag.update(params, {
        where: {
          id: params.id
        }
      })

      if (params.status == 1) {
        message = "Tags Activated Successfully!"
      } else if (params.status == 0) {
        message = "Tags Deactivated Successfully!"
      }


      return res.send(response({}, message));
    } catch (error) {
      next(error)
    }
  },

  //education//
  education_add: async (req, res, next) => {
    try {
      const params = req.body;
      params.status = 1

      const check = await db.education.findOne({
        where: { edu_name: params.edu_name }
      })

      if (check) {
        var message = "Education already add";
        return res.send(error({}, message))
      }

      const add = await db.education.create(params);

      return res.send(response(add, "Education Added Successfully"));

    } catch (error) {
      next(error)
    }
  },

  education_update: async (req, res, next) => {
    try{
      const params = req.body;

      const check = await db.education.findOne({
        where: { edu_name: params.edu_name }
      })

      if (check) {
        var message = "Education name already add";
        return res.send(error({}, message))
      }

      const update =  await db.education.update({
        edu_name:params.edu_name
      },{
        where:{
          id:params.id
        }
      })

      return res.send(response({}, "Education update Successfully"));
    }catch(error){
      next(error)
    }
  },

  education_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 15;
      const offset = (page - 1) * pageSize;
      const searchName = params.searchtext || '';

      const whereCondition = {};

      if (searchName) {
        whereCondition.edu_name = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }

      const totalCount = await db.education.count({
        where:whereCondition
      });

      const list = await db.education.findAll({
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

      return res.send(response(data, "Education list get successfully"));

    } catch (error) {
      next(error)
    }
  },

  buyer_user_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page -1) * pageSize;
      const searchName = params.searchText || '';

      const whereCondition = {
        role_id: 2,
        status: params.filter ? params.filter : [1,2],
      };

      if (searchName) {
        whereCondition.user_name = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }

      const totalCount = await db.User.count({
        where: whereCondition
      });

      const buyerlist = await db.User.findAll({
        attributes: { exclude: ['auth_token', "password"] },
        where: whereCondition,
        offset: offset,
        limit: pageSize,
      })

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        buyerlist
    }

      return res.send(response(data, "Buyer list get successfully"));
    } catch (error) {
      next(error)
    }
  },

  approve_expert_user_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page -1) * pageSize;
      const searchName = params.searchText || '';

      const whereCondition = {
        role_id: 3,
        status: params.filter ? params.filter : [1,2],
      };

      if (searchName) {
        whereCondition.firstName = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }

      const totalCount = await db.User.count({
        where: whereCondition
      });
      
      const expertlist = await db.User.findAll({
        attributes: { exclude: ['auth_token', "password"] },
        where: whereCondition,
        offset: offset,
        limit: pageSize,
      })

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        expertlist
    }


      return res.send(response(data, "Expert list get successfully"));

    } catch (error) {
      next(error)
    }
  },

  newrequest_expert_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page -1) * pageSize;
      const searchName = params.searchText || '';

      const whereCondition = {
        role_id: 3,
        status: 0,
        complete_profile: 6
      };

      if (searchName) {
        whereCondition.firstName = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
        whereCondition.lastName = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }
      console.log(whereCondition)
      const totalCount = await db.User.count({
        where: whereCondition
      });

      const neqrequest_list = await db.User.findAll({
        attributes: { exclude: ['auth_token', "password"] },
        where: whereCondition,
        offset: offset,
        limit: pageSize,
      })

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        neqrequest_list
    }
      return res.send(response(data, "New Request expert list get successfully"));
    } catch (error) {
      next(error)
    }
  },

  rejected_expert_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 10;
      const offset = (page -1) * pageSize;
      const searchName = params.searchText || '';

      const whereCondition = {
        role_id: 3,
        status: 3
      };

      if (searchName) {
        whereCondition.firstName = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
        whereCondition.lastName = {
          [db.Sequelize.Op.like]: `%${searchName}%`
        };
      }
      const totalCount = await db.User.count({
        where: whereCondition
      });

      const neqrequest_list = await db.User.findAll({
        attributes: { exclude: ['auth_token', "password"] },
        where: whereCondition,
        offset: offset,
        limit: pageSize,
      })

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        neqrequest_list
    }
      return res.send(response(data, "Rejected expert list get successfully"));
    } catch (error) {
      next(error)
    }
  },

  expert_request_approve: async (req, res, next) => {
    try {
      const params = req.body;

      const user = await db.User.findOne({
        where:{
          id:params.id
        }
      })

      const updatestatus = await db.User.update({
        status: params.status,
      }, {
        where: {
          id: params.id
        }
      })

      var message = ""
      if (params.status == 1) {
        message = "Aprrove successfully"
      } else {
        const Request_reject = { template_code: "REQUEST_REJECT", username: user.user_name, reason: params.reason }
        sendmails(user.email, Request_reject)
        message = "Reject successfully"
      }

      return res.send(response({}, message));
    } catch (error) {
      next(error)
    }
  },

  expert_view_detail: async (req, res, next) => {
    try {
      const params = req.body;
      const detail = await db.User.findOne({
        attributes:["id","firstName","lastName","user_name","createdAt","language","zip_code","about","profile_image"],
        where: {
          id: params.id
        },
        include: [
          {
            model: db.user_skill, attributes: ["skill_id"],
            include: [
              { model: db.skill, attributes: ["skill_name"] }
            ]
          },
          { model: db.country, attributes: ["country_name"] },
          { model: db.city, attributes: ["city_name"] },
          {
            model: db.user_education, attributes: ["education_id"],
            include: [
              { model: db.education, attributes: ["edu_name"] }
            ]
          },
          { model: db.education_doc, attributes: ["file_url"] },
        ]
      })

      return res.send(response(detail, "Detail view successfully"));

    } catch (error) {
      console.log(error)
      next(error)
    }
  },

  flash_card_list: async (req, res, next) => {
    try {
      const params = req.body;

      const page = parseInt(params.page) || 1; // Current page number
      const pageSize = parseInt(params.pageSize) || 15;
      const offset = (page - 1) * pageSize;

      let whereCondition = {};
      if (params.searchtext) {
        whereCondition = {
          title: {
            [Op.like]: `%${params.searchtext}%`
          }
        };
      }

      var totalCount = await db.flash_card.count({
        where: whereCondition
      });

      const list = await db.flash_card.findAll({
        where: whereCondition,
        attributes: ["id", "title", "price", "terms_count", "updatedAt", "status", "category_id"],
        include: [
          { model: db.category }
        ],
        order: [["createdAt", "DESC"]],
        offset: offset,
        limit: pageSize,
      })

      const data = {
        totalcount: totalCount,
        perpage_count: pageSize,
        list
      }
      message = "List find successfully"
      return res.send(response(data, message));

    } catch (error) {
      next(error)
    }
  },

  admin_flash_card_status_update: async (req, res, next) => {
    try {
      const params = req.body;

      const updat = await db.flash_card.update(params, {
        where: {
          id: params.id
        }
      })

      if (params.status == 1) {
        message = "Flashcard Activated Successfully!"
      } else if (params.status == 0) {
        message = "Flashcard Deactivated Successfully! "
      }

      return res.send(response({}, message));
    } catch (error) {
      next(error)
    }
  },

  expert_user_list_report_download: async (req, res, next) => {
    try {
      const params = req.body;
      let expertList;

      const startDate = new Date(params.startDate);
      const endDate = new Date(params.endDate);
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
   
      //aprove expert report download//
      if(params.report == 1){
       expertList = await db.User.findAll({
        attributes: { exclude: ['auth_token', 'password'] },
        where: {
          role_id: 3,
          status: 1,
          createdAt: {
            [db.Sequelize.Op.between]: [startDate, endDate],
          },
        },
      });
      //new request expert report download
      }else if(params.report == 0){
        expertList = await db.User.findAll({
          attributes: { exclude: ['auth_token', 'password'] },
          where: {
            role_id: 3,
            status: 0,
            createdAt: {
              [db.Sequelize.Op.between]: [startDate, endDate],
            },
          },
        });
        //rejected expert report list//
      }else if(params.report == 3){
        expertList = await db.User.findAll({
          attributes: { exclude: ['auth_token', 'password'] },
          where: {
            role_id: 3,
            status: 3,
            createdAt: {
              [db.Sequelize.Op.between]: [startDate, endDate],
            },
          },
        });
      }

      const csvData = expertList.map((user) => ({
        id: user.id,
        name: user.name,
        email: user.email,
        status: user.status
      }));

      const csvOptions = { headers: true, delimiter: ',', };
      const Directory = 'uploads/csv_report';
      const uploadDirectory = path.join(__dirname, "../../uploads/csv_report")
      console.log(uploadDirectory)
      const csvFileName = 'expert_list.csv';
      const csvFilePath = path.join(uploadDirectory, csvFileName);

      if (!fs.existsSync(uploadDirectory)) {
        fs.mkdirSync(uploadDirectory, { recursive: true });
      }
  
      fastcsv.writeToPath(csvFilePath, csvData, csvOptions)
        .on('finish', () => {
          const relativeUrl = `/${Directory}/${csvFileName}`;
          res.send(response({ csvUrl: relativeUrl }, 'CSV generated successfully'));
        });

    } catch (error) {
      next(error)
    }
  },

  expert_buyer_status_update: async (req, res, next) => {
    try{
      const params = req.body;

      const update = await db.User.update({
        status: params.status
      },{
        where:{id:params.id}
      })

      if(params.status == 1){
        message = "Activate successfully"
      }else if(params.status == 2){
        message = "Deactivate successfully"
      }

      res.send(response({},message));
    }catch(error){
      next(error)
    }
  },

  dashboard: async (req, res, next) => {
    try{
      const counts = await db.User.findAll({
        attributes: ['role_id', "status",[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
        where: {
          role_id: [2,3],//buyer and expert
          status: [1,2] //active and inactive
        },
        group: ['role_id',"status"]
      });
      
      //buyer count//
      //const role1Count = counts.find(item => item.role_id === 2 )?.get('count') || 0;
      const buyer_active = counts.find(item => item.role_id === 2 && item.status == 1)?.get('count') || 0;
      const buyer_inactive = counts.find(item => item.role_id === 2 && item.status == 2)?.get('count') || 0;
      
      //expert count//
      //const role2Count = counts.find(item => item.role_id === 3)?.get('count') || 0;
      const expert_active = counts.find(item => item.role_id === 3 && item.status == 1)?.get('count') || 0;
      const expert_inactive = counts.find(item => item.role_id === 3 && item.status == 2)?.get('count') || 0;
      
      const buyerdetail = {
        buyer_total_count : buyer_active + buyer_inactive,
        buyer_active_count : buyer_active,
        buyer_inactive_count :buyer_inactive
      }

      const expertdetail = {
        expert_total_count : expert_active + expert_inactive,
        expert_active_count : expert_active,
        expert_inactive_count : expert_inactive
      }

      const total_flash_card = await db.flash_card.count();
      const total_study_res_count = await db.study_resources.count();

      const user_membership_plan = await db.user_plan.findAll({
        attributes: ["status",[db.sequelize.fn('COUNT', db.sequelize.col('id')), 'count']],
        where: {
          status: [1,0] //active and inactive
        },
        group: ["status"]
      })

      const total_purchae_plan =  await db.user_plan.count()

      const planwise_count = await db.membership_plan.findAll({
        attributes: ["id","name",[
          Sequelize.literal('(SELECT COUNT(*) FROM user_plans WHERE user_plans.plan_id = membership_plan.id)'),
          'plan_count',
        ]],
        group: ['membership_plan.id', 'membership_plan.name'], 
      });


      const data = {
        totalusercount :buyerdetail.buyer_total_count + expertdetail.expert_total_count,
        buyerdetail :buyerdetail,
        expertdetail:expertdetail,
        total_flash_card_count: total_flash_card,
        total_study_res_count: total_study_res_count,
        total_membership_plan: total_purchae_plan,
        total_active_membership_plan: user_membership_plan.find(item => item.status == 1)?.get('count') || 0 ,
        total_inactive_membership_plan: user_membership_plan.find(item => item.status == 0)?.get('count') || 0 ,
        planwise_count
      };
  
      res.send(response(data,"message"));

    }catch(error){
      console.log(error)
      next(error)
    }
  },

  reportdownloadcommon: async(req, res, next) => {
    try{

      const slug = req.params.slug
      const {report,startDate,endDate} = req.body
      var filename = ""
      
      if(slug == "expert"){
        if(report == 1){
        filename = 'expert_approve.csv'
        }else if(report == 0){
          filename = "expert_newrequest.csv"
        }else if(report == 3){
          filename ="expert_reject.csv"
        }
      }else if(slug == "buyer"){
        filename = "buyer_list.csv"
      }
      const csvUrl = await reportdownload(slug, report, startDate, endDate, filename);
      res.send(response({ csvUrl }, 'CSV generated successfully'));

    }catch(error){
      next(error)
    }
  }

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