'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('favorites', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      doc_id: {
        type: Sequelize.INTEGER
      },
      doc_type: {
        type: Sequelize.INTEGER,
        Comment: "1-jobs, 2-study_res , 3-flash_card"
      },
      status: {
        type: Sequelize.INTEGER,
        Comment: "1-favorite , 0-unfavorite"
      },
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
    await queryInterface.dropTable('favorites');
  }
};