'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class postjob_docs extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  postjob_docs.init({
    jobpost_id: DataTypes.INTEGER,
    category_id: DataTypes.INTEGER,
    doc_url: DataTypes.STRING,
    file_name: DataTypes.STRING,
    size: DataTypes.STRING,
    extension: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'postjob_docs',
  });
  return postjob_docs;
};