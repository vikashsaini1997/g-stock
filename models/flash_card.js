'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class flash_card extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({User,school,category,subject,course,admin_tag,skill,country,state,subcategory}) {
      flash_card.belongsTo(User, {foreignKey: 'user_id', targetKey:'id'});
      flash_card.belongsTo(school, {foreignKey: 'school_id', targetKey:'id'});
      flash_card.belongsTo(category, {foreignKey: 'category_id', targetKey:'id'});
      flash_card.belongsTo(subcategory, {foreignKey: 'sub_cat_id', targetKey:'id'});
      flash_card.belongsTo(subject, {foreignKey: 'subject_id', targetKey:'id'});
      flash_card.belongsTo(course, {foreignKey: 'course_id', targetKey:'id'});
      flash_card.belongsTo(country, {foreignKey: 'country_id', targetKey:'id'});
      flash_card.belongsTo(state, {foreignKey: 'state_id', targetKey:'id'});
      flash_card.belongsToMany(admin_tag, { through: 'flash_card_tag', foreignKey: 'flash_card_id' }); 
      flash_card.belongsToMany(skill, { through: 'flash_card_skill', foreignKey: 'flash_card_id' }); 
    }
  }
  flash_card.init({
    user_id: DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    terms: DataTypes.TEXT,
    tags: DataTypes.TEXT,
    terms_count: DataTypes.INTEGER,
    category_id: DataTypes.INTEGER,
    sub_cat_id: DataTypes.INTEGER,
    school_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER,
    course_id: DataTypes.INTEGER,
    country_id: DataTypes.INTEGER,
    state_id: DataTypes.INTEGER,
    type: DataTypes.TEXT,
    price: DataTypes.INTEGER,
    isFree: DataTypes.BOOLEAN,
    rating: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'flash_card',
  });
  return flash_card;
};