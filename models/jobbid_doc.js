'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jobbid_doc extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  jobbid_doc.init({
    jobbid_id: DataTypes.INTEGER,
    doc_url: DataTypes.STRING,
    file_name: DataTypes.TEXT,
    extension: DataTypes.STRING,
    size: DataTypes.STRING,
  }, {
    sequelize,
    modelName: 'jobbid_doc',
  });
  return jobbid_doc;
};