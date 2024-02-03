'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class study_resource_skill extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({skill}) {
      study_resource_skill.hasMany(skill, {foreignKey: 'id', targetKey:'skill_id'});
    }
  }
  study_resource_skill.init({
    study_res_id: DataTypes.INTEGER,
    skill_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'study_resource_skill',
  });
  return study_resource_skill;
};