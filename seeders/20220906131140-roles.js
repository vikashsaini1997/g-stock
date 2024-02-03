'use strict';

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('roles',[
      {
        role_name:"Admin",createdAt:new Date(),updatedAt:new Date()
      },
      {
        role_name:"User",createdAt:new Date(),updatedAt:new Date()
      },
   ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('roles',{},null);
  }
};
