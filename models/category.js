'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class category extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      category.hasMany(models.postjob_docs, {foreignKey: 'category_id', targetKey: 'id'});
    }
  }
  category.init({
    category_name: DataTypes.STRING,
    cat_image: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'category',
  });
  return category;
};