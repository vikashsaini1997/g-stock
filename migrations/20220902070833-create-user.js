'use strict';
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('Users', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      firstName: {
        type: Sequelize.STRING
      },
      lastName: {
        type: Sequelize.STRING
      },
      user_name: {
        type: Sequelize.STRING
      },
      role_id: {
        type: Sequelize.INTEGER,
        comment:'1 = Admin, 2 = User, 3 = Expert'
      },
      email: {
        type: Sequelize.STRING
      },
      password: {
        type: Sequelize.STRING
      },
      phone_number: {
        type: Sequelize.STRING
      },
      profile_image: {
        type: Sequelize.STRING
      },
      otp: {
        type: Sequelize.STRING
      },
      address: {
        type: Sequelize.STRING
      },
      status: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
        comment: '1 = Active, 0 = Pending, 2 = Inactive , 3 = rejected'
      },
      is_verify: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
        comment: '1 = yes, 0 = No'
      },
      complete_profile: {
        type: Sequelize.TINYINT,
        defaultValue: 0,
        comment: '1 = yes, 0 = No'
      },
      forgot_token: {
        type: Sequelize.STRING
      },
      auth_token: {
        type: Sequelize.STRING
      },
      google_id: {
        type: Sequelize.STRING
      },
      facebook_id: {
        type: Sequelize.STRING
      },
      occupation: {
        type: Sequelize.STRING
      },
      about: {
        type: Sequelize.TEXT
      },
      experience: {
        type: Sequelize.TEXT
      },
      language: {
        type: Sequelize.STRING
      },
      dob: {
        type: Sequelize.STRING
      },
      customerid: {
        type: Sequelize.STRING,
        comment:"stripe customer id"
      },
      category_id: {
        type: Sequelize.INTEGER
      },
      sub_cat_id: {
        type: Sequelize.INTEGER
      },
      country_id: {
        type: Sequelize.INTEGER
      },
      state_id: {
        type: Sequelize.INTEGER
      },
      city_id: {
        type: Sequelize.INTEGER
      },
      address: {
        type: Sequelize.TEXT
      },
      zip_code: {
        type: Sequelize.INTEGER
      },
      level: {
        type: Sequelize.STRING
      },
      total_earning:{
        type: Sequelize.INTEGER
      },
      membership_status:{
        type: Sequelize.INTEGER,
        defaultValue:0,
        comment:'0-Inactive,1-Active'
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
    await queryInterface.dropTable('Users');
  }
};