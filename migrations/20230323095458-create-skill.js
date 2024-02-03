'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('skills', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      category_id: {
        type: Sequelize.INTEGER
      },
      sub_cat_id: {
        type: Sequelize.INTEGER
      },
      skill_name: {
        type: Sequelize.STRING
      },
      skill_image: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.INTEGER,
        Comment:"1-active, 0-inactive",
        default:0
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
    await queryInterface.dropTable('skills');
  }
};