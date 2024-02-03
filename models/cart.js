'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class cart extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      cart.belongsTo(models.flash_card, {foreignKey: 'flash_card_id', targetKey: 'id'});
      cart.belongsTo(models.study_resources, {foreignKey: 'study_res_id', targetKey: 'id'});       
    }
  }
  cart.init({
    user_id: DataTypes.INTEGER,
    flash_card_id: DataTypes.INTEGER,
    study_res_id: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'cart',
  });
  return cart;
};