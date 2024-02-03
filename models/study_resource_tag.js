'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class study_resource_tag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  study_resource_tag.init({
    study_res_id: DataTypes.INTEGER,
    tag_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'study_resource_tag',
  });
  return study_resource_tag;
};