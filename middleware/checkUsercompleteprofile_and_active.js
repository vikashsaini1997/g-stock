//const config = require("../config/config.json");
const express = require("express");
const sequelize = require('sequelize');
const Op = sequelize.Op;
const db = require("../models");
const { getAuthUserId } = require("../helper/helper");

module.exports = async (req, res, next) => {
    try {
        var userId = getAuthUserId(req);
        var user = await db.User.findOne({  
            where: {
                id: userId,
            },
        });
        if(user){
            //complete profile check//
            if(user.complete_profile !== 6 && user.role_id == 3){
                return res.status(400).json({ status: false, status_code: 400, message: 'Please complete your profile first'});
            //user profile pending check//
            }else if(user.status == 0){
                return res.status(400).json({ status: false, status_code: 400, message: 'Your profile under review'});
            //user account inactive check//
            }else if(user.status == 2){
                return res.status(401).json({ status: false, status_code: 401, message: 'Account inactive admin side please contact admin'});
            //user prfile rejected check//
            }else if(user.status == 3){
                return res.status(401).json({ status: false, status_code: 401, message: 'Your profile rejected please contact admin'});
            }else{
                next();
            }
        }else{
            return res.status(403).json({ status: false, status_code: 403, message: 'Account Not Exist'});
        }
    } catch (error) {
        next(error);
    }
};