'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class subcategory extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({category}) {
      subcategory.belongsTo(category, { foreignKey: 'cat_id', targetKey: 'id' });
    }
  }
  subcategory.init({
    cat_id: DataTypes.INTEGER,
    sub_cat_name: DataTypes.STRING,
    sub_cat_image: DataTypes.STRING,
    status: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'subcategory',
  });
  return subcategory;
};