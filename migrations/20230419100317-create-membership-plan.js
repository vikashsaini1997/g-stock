'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('membership_plans', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      name: {
        type: Sequelize.STRING
      },
      plan_type: {
        defaultValue: 'Paid',
        type: Sequelize.ENUM('Free','Paid')
      },
      monthly_price: {
        type: Sequelize.FLOAT
      },
      total_price: {
        type: Sequelize.FLOAT
      },
      description: {
        type: Sequelize.TEXT
      },
      duration: {
        type: Sequelize.INTEGER
      },
      status: {
        type: Sequelize.INTEGER,
        default:0,
        Comment:"1-active, 0-inactive"
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
    await queryInterface.dropTable('membership_plans');
  }
};