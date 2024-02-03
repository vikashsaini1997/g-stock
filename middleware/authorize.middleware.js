const jwt = require('jsonwebtoken');
const {
    secret
} = require('../config/config.js');
const db = require('../models');

module.exports = async (req, res, next) => {
    // console.log(req)
    var authHeader = req.headers.authorization;
    if (authHeader) {
        authHeader = authHeader.replace('Bearer ', '')

        jwt.verify(authHeader, secret, (err, result) => {

            if (err) {
                return res.status(401).send({
                    data: {},
                    status: false,
                    status_code: 401,
                    message: 'Unauthorized please login again!'
                });
            }
            if (result.sub) {
                db.User.findByPk(result.sub).then((data) => {
                    if (!data)
                        return res.status(401).json({
                            data: {},
                            status: false,
                            status_code: 401,
                            message: 'Unauthorized',
                        });
                    req.user = data.get();
                    // console.log(req)
                    next();
                });
            } else {
                next();
            }
        });
    } else {
        return res.status(401).send({
            status: false,
            status_code: 401,
            message: 'Unauthorized',
        });
    }
}