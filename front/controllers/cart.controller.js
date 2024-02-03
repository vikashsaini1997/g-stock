const Sequelize = require('sequelize')
const Op = Sequelize.Op;
const formidable = require('formidable');
var fs = require('fs');
const db = require("../../models");
const { response, error, sendmails, singleFileRequest, multiplefilerequest } = require("../../helper/helper");
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

module.exports = {
    add_cart: async (req, res, next) => {
        try {
            const params = req.body;
            const message = "Add successfully"
            //flash card//
            if (params.doc_type == 3) {

                const alreadycard_add_check =  await db.cart.findOne({
                    where:{
                        user_id: params.user_id,
                        flash_card_id: params.flash_card_id
                    }
                })

                if(alreadycard_add_check){
                    return res.status(400).send(error({}, "Already add in cart"));
                }
                const add = await db.cart.create({
                    user_id: params.user_id,
                    flash_card_id: params.flash_card_id
                })

                res.send(response({}, message));
                //study resource//
            } else if (params.doc_type == 2) {
                const already_doc_card_check =  await db.cart.findOne({
                    where:{
                        user_id: params.user_id,
                        study_res_id: params.study_res_id
                    }
                })

                if(already_doc_card_check){
                    return res.status(400).send(error({}, "Already add in cart"));
                }
                const add = await db.cart.create({
                    user_id: params.user_id,
                    study_res_id: params.study_res_id
                })

                res.send(response({}, message));
            } else {
                return res.status(400).send(error(null, "Please select doc type"));

            }

        } catch (error) {
            next(error)
        }
    },

    cart_list: async (req, res, next) => {
        try {
            const params = req.body;
            let userId = params.user_id || 0; // Set userId to 0 if not provided

            const flashcardlist = await db.cart.findAll({
                attributes: ["id", "user_id", "flash_card_id", "createdAt",
                    [
                        Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM favorites WHERE cart.flash_card_id = favorites.doc_id AND favorites.doc_type = ${3} AND favorites.user_id = ${userId} AND favorites.status = 1) THEN true ELSE false END`),
                        'isFavorite'
                    ],
                    [Sequelize.literal("3"), "doctype"],
                ],
                where: {
                    user_id: userId,
                    flash_card_id: {
                        [Op.ne]: null, // Exclude null values to retrieve only flash card entries
                    },
                },
                include: [
                    {
                        model: db.flash_card,
                        attributes: ["id", "title", "price", "rating", "status"],
                    },
                ],
            });

            const studyResList = await db.cart.findAll({
                attributes: ["id", "user_id", "study_res_id", "createdAt",
                    [
                        Sequelize.literal(`CASE WHEN EXISTS(SELECT 1 FROM favorites WHERE cart.study_res_id = favorites.doc_id AND favorites.doc_type = ${2} AND favorites.user_id = ${userId} AND favorites.status = 1) THEN true ELSE false END`),
                        'isFavorite'
                    ],
                    [Sequelize.literal("2"), "doctype"],
                ],
                where: {
                    user_id: userId,
                    study_res_id: {
                        [Op.ne]: null, // Exclude null values to retrieve only study resources entries
                    },
                },
                include: [
                    {
                        model: db.study_resources,
                        attributes: ["id", "title", "price", "rating", "status"],
                    },
                ],
            });

            const data = flashcardlist.concat(studyResList);

            console.log(data.length)

            res.send(response(data, "List find successfully"));

        } catch (error) {
            console.log(error)
            next(error)
        }
    },

    add_new_address: async (req, res, next) => {
        try {
            const params = req.body;
            params.status = 1
            params.user_id = req.user.id
            const message = "Address add successfully"

            const add = await db.address.create(params)

            res.send(response(add, message));

        } catch (error) {
            next(error)
        }
    },

    update_address: async (req, res, next) => {
        try {
            const params = req.body;
            params.user_id = req.user.id
            const message = "Address update successfully"

            const update = await db.address.update(params, {
                where: {
                    id: params.address_id
                }
            })

            res.send(response({}, message));

        } catch (error) {
            next(error)
        }
    },

    delete_address: async (req, res, next) => {
        try {
            const params = req.body;
            const message = "Address delete successfully"

            const add_delete = await db.address.destroy({
                where: {
                    id: params.address_id
                }
            })

            res.send(response({}, message));

        } catch (error) {
            next(error)
        }
    },

    address_list: async (req, res, next) => {
        try {
            const params = req.body;
            const userId = req.user.id;
            console.log(req.user)
            const message = "List find successfully"

            const list = await db.address.findAll({
                where: {
                    user_id: userId
                },
                include:[
                    {
                        model:db.country,
                        attributes:["country_name"]
                    },
                    {
                        model:db.city,
                        attributes:["city_name"]
                    },
                    {
                        model:db.state,
                        attributes:["state_name"]
                    }
                ]
            })

            res.send(response(list, message));

        } catch (error) {
            next(error)
        }
    },

    cart_item_delete: async (req, res, next) => {
        try {
            const params = req.body;
            const message = "Item remove successfully"

            const cartdelete = await db.cart.destroy({
                where: {
                    id: params.cart_id
                }
            })

            res.send(response({}, message));

        } catch (error) {
            next(error)
        }
    },

    coupan_list: async (req, res, next) => {
        try {
            const params = req.body
            const message = "Coupan list get successfully"

            const coupan_list = await db.coupan.findAll({
                where: {
                    status: 1
                }
            })

            res.send(response(coupan_list, message));

        } catch (error) {
            next(error)
        }
    },

    cart_payment: async (req, res, next) => {
        try {
            const params = req.body;
            const userId = req.user.id;
            const statusZeroProducts = [];

            const flashcard = await db.cart.findAll({
                where: {
                    user_id: userId,
                    flash_card_id: { [db.Sequelize.Op.ne]: null }
                },
                include: [
                    {
                        model: db.flash_card,
                        where: {
                            status: { [db.Sequelize.Op.ne]: 1 } // Verify flashcard status is not 1
                        }
                    }
                ]
            })

            const studyres = await db.cart.findAll({
                where: {
                    user_id: userId,
                    study_res_id: { [db.Sequelize.Op.ne]: null }
                },
                include: [
                    {
                        model: db.study_resources,
                        where: {
                            status: { [db.Sequelize.Op.ne]: 1 } // Verify flashcard status is not 1
                        }
                    }
                ]
            })
            
            flashcard.forEach(item => {
                if (item.flash_card.status === 0) {
                    statusZeroProducts.push({
                        cartId: item.id,
                        flashCardId: item.flash_card_id,
                        flashCardTitle: item.flash_card.title,
                        currentStatus: item.flash_card.status
                    });
                }
            });

            studyres.forEach(item => {
                if (item.study_resource.status === 0) {
                    statusZeroProducts.push({
                        cartId: item.id,
                        study_res_id: item.study_res_id,
                        study_resource_title: item.study_resource.title,
                        currentStatus: item.study_resource.status
                    });
                }
            });

            if (statusZeroProducts.length > 0) {
                return res.status(400).send(error(statusZeroProducts, "Products deactivate admin side"));
            }
            

            const cartIds = []
            const allcart = await db.cart.findAll({
                attributes:["id"],
                where:{
                    user_id:userId
                }
            })

            allcart.map((item)=>{
                cartIds.push(item.dataValues.id)
            })

            if(params.amount > 0){
                params.amount = params.amount * 100
                const charge = await stripe.charges.create({
                    amount: params.amount,
                    currency: 'usd',
                    source: params.cardId || params.bankId,
                    customer:params.customerId,
                    //description: params.description,
                });

                if(charge.status == "succeeded"){
                    cartIds.map(async(item)=>{
                        const cart_delete = await db.cart.destroy({
                            where:{
                                id:item
                            }
                        })
                    })
                

                return res.send(response(charge, "Payment successfully"));
                }else{
                    return res.status(400).send(error(charge, "Please try again"))
                }
            }else{
            cartIds.map(async(item)=>{
                const cart_delete = await db.cart.destroy({
                    where:{
                        id:item
                    }
                })
            })

            return res.send(response({}, "Buy successfully"));

        }

        } catch (error) {
            next(error)
        }
    }
}