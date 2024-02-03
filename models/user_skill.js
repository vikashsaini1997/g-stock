'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_skill extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({skill,category,user_education}) {
      user_skill.belongsTo(skill, {foreignKey: 'skill_id', targetKey:'id'});
      user_skill.belongsTo(category, {foreignKey: 'category_id', targetKey:'id'});
    }
  }
  user_skill.init({
    user_id: DataTypes.INTEGER,
    category_id: DataTypes.INTEGER,
    skill_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'user_skill',
  });
  return user_skill;
};