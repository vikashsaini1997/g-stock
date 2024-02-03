'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class flash_card_skill extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
    }
  }
  flash_card_skill.init({
    flash_card_id: DataTypes.INTEGER,
    skill_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'flash_card_skill',
  });
  return flash_card_skill;
};