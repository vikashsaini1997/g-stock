'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('jobposts', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      random_id: { type: Sequelize.INTEGER },
      title: { type: Sequelize.STRING },
      description: { type: Sequelize.TEXT },
      categoryid: { type: Sequelize.INTEGER },
      sub_cat_id: { type: Sequelize.INTEGER },
      school_id: { type: Sequelize.INTEGER },
      course_id: { type: Sequelize.INTEGER },
      subject_id: { type: Sequelize.INTEGER },
      documenttype: { type: Sequelize.STRING },
      pages: { type: Sequelize.INTEGER },
      due_date: { type: Sequelize.STRING },
      budget: { type: Sequelize.INTEGER },
      status: { type: Sequelize.INTEGER,comment: "1-active , 0-expire , 2-cancel, 3- assign to expert , 4- complete job" },
      document: { type: Sequelize.STRING },
      writingservice: { type: Sequelize.INTEGER,comment : "1-writingservice , 2-ask a question" },
      userid: { type: Sequelize.INTEGER },
      country_id: { type: Sequelize.INTEGER },
      state_id: { type: Sequelize.INTEGER },
      tags: { type: Sequelize.TEXT },
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
    await queryInterface.dropTable('jobposts');
  }
};