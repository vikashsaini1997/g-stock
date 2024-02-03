'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class education_doc extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  education_doc.init({
    user_id: DataTypes.INTEGER,
    file_url: DataTypes.STRING,
    name: DataTypes.STRING,
    size:DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'education_doc',
  });
  return education_doc;
};