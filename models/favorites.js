'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class favorites extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      favorites.belongsTo(models.jobposts, {foreignKey: 'doc_id', targetKey:"id"});
      favorites.belongsTo(models.study_resources, {foreignKey: 'doc_id', targetKey:"id"});
      favorites.belongsTo(models.flash_card, {foreignKey: 'doc_id', targetKey:"id"});
    }
  }
  favorites.init({
    user_id: DataTypes.INTEGER,
    doc_id: DataTypes.INTEGER,
    doc_type: DataTypes.INTEGER,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'favorites',
  });
  return favorites;
};