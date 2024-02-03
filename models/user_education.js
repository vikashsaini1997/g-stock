'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_education extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({education}) {
      user_education.belongsTo(education, {foreignKey: 'education_id', targetKey:'id'});
    }
  }
  user_education.init({
    user_id: DataTypes.INTEGER,
    education_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'user_education',
  });
  return user_education;
};