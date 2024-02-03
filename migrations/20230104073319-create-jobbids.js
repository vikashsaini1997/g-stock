'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobbids', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      bidamount: { type: Sequelize.INTEGER},
      deliverydate: { type: Sequelize.STRING },
      proposal: { type: Sequelize.TEXT },
      jobid: { type: Sequelize.INTEGER },
      userid: { type: Sequelize.INTEGER },
      status: { type: Sequelize.INTEGER ,default:0, comment : "1-active, 2-cancel (user side) , 3-reject (expert side) , 4- hire expert"},
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('jobbids');
  }
};