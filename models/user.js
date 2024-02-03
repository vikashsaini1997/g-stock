'use strict';
const { Model} = require('sequelize');
const jobbids = require('./jobbids');

module.exports = (sequelize, DataTypes) => {
  class User extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({jobbids,jobposts,user_skill,user_education,education_doc,country,state,user_plan,city,subcategory}) {
      // define association here
      // User.hasMany(jobbids, { as: 'jobbids'});
      // User.hasMany(jobposts, { as: 'jobposts'});
      User.hasMany(user_skill, {foreignKey: 'user_id', targetKey:'id'});
      User.hasMany(user_education, {foreignKey: 'user_id', targetKey:'id'});
      User.hasMany(education_doc, {foreignKey: 'user_id', targetKey:'id'});
      User.belongsTo(country, {foreignKey: 'country_id', targetKey:'id'});
      User.belongsTo(state, {foreignKey: 'state_id', targetKey:'id'});
      User.belongsTo(city, {foreignKey: 'city_id', targetKey:'id'});
      User.belongsTo(user_plan, {foreignKey: 'id', targetKey:'user_id'});
      User.belongsTo(subcategory, {foreignKey: 'sub_cat_id', targetKey:'id'});
    } 
  }
  
  User.init({
    firstName: DataTypes.STRING,
    lastName: DataTypes.STRING,
    user_name:DataTypes.STRING,
    role_id: DataTypes.INTEGER,
    email: DataTypes.STRING,
    password:DataTypes.STRING,
    phone_number:DataTypes.STRING,
    profile_image:DataTypes.STRING,
    otp:DataTypes.STRING,
    address:DataTypes.STRING,
    status:DataTypes.TINYINT,
    is_verify:DataTypes.TINYINT,
    complete_profile:DataTypes.TINYINT,
    forgot_token: DataTypes.STRING,
    auth_token: DataTypes.STRING,
    google_id: DataTypes.STRING,
    facebook_id: DataTypes.STRING,
    occupation:DataTypes.STRING,
    about:DataTypes.TEXT,
    experience:DataTypes.TEXT,
    language:DataTypes.STRING,
    dob:DataTypes.STRING,
    customerid:DataTypes.STRING,
    category_id:DataTypes.INTEGER,
    sub_cat_id:DataTypes.INTEGER,
    country_id:DataTypes.INTEGER,
    state_id:DataTypes.INTEGER,
    city_id:DataTypes.INTEGER,
    address:DataTypes.TEXT,
    zip_code:DataTypes.INTEGER,
    level:DataTypes.STRING,
    total_earning:DataTypes.INTEGER,
    membership_status:DataTypes.INTEGER,


  }, {
    sequelize,
    modelName: 'User',
  });

  return User;
};