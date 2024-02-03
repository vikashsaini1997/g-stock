'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class flash_card_tag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  flash_card_tag.init({
    flash_card_id: DataTypes.INTEGER,
    tag_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'flash_card_tag',
  });
  return flash_card_tag;
};