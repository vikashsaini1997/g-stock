'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class skill extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({study_resources,flash_card,subcategory}) {
      skill.belongsToMany(study_resources, { through: 'study_resource_skill', foreignKey: 'skill_id' });  
      skill.belongsToMany(flash_card, { through: 'flash_card_skill', foreignKey: 'skill_id' }); 
      skill.belongsTo(subcategory, { foreignKey: 'sub_cat_id', targetKey: 'id' });
    }
  }
  skill.init({
    category_id: DataTypes.INTEGER,
    sub_cat_id: DataTypes.INTEGER,
    skill_name: DataTypes.STRING,
    skill_image: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'skill',
  });
  return skill;
};