'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class admin_banner extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  admin_banner.init({
    title: DataTypes.STRING,
    sub_title: DataTypes.TEXT,
    image: DataTypes.STRING,
    status:DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'admin_banner',
  });
  return admin_banner;
};