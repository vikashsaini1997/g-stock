'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class study_resource_doc extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  study_resource_doc.init({
    study_res_id: DataTypes.INTEGER,
    doc_url: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'study_resource_doc',
  });
  return study_resource_doc;
};