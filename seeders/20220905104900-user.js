'use strict';
const bcrypt = require('bcryptjs');

const password = 'Admin@123'
const hash = bcrypt.hashSync(password, 10);

// async function hash(password) {
//   const salt = await bcrypt.genSalt(10);
//   const passwprdHash = await bcrypt.hash(password, salt);  

//   return passwprdHash;
// }

module.exports = {
  async up (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Users',[
      {
        firstName:'Grad',lastName:'stock',user_name:'gradstock', email:'gradstock@yopmail.com',status:"1",is_verify:true,password:hash,role_id:"1",createdAt:new Date(),updatedAt:new Date(),
      },
      
   ]);
  },

  async down (queryInterface, Sequelize) {
    return queryInterface.bulkInsert('Users',{},null);
  }
};
