const cron = require('node-cron');
const userController = require("../front/controllers/user.controller")


module.exports = {
    planexpirycheck: () => {
        cron.schedule('1 0 * * *', async () => {
            console.log("expire plan status update per day 12.01 am")
            try {
                await userController.plan_status_update()

            } catch (error) {
                console.log(error)
            }
        });
    },
}