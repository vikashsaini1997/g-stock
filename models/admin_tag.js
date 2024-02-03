'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class admin_tag extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      admin_tag.belongsToMany(models.jobposts, { through: 'postjob_tags', foreignKey: 'tag_id' });
      admin_tag.belongsToMany(models.study_resources, { through: 'study_resource_tag', foreignKey: 'tag_id' });
      admin_tag.belongsToMany(models.flash_card, { through: 'flash_card_tag', foreignKey: 'tag_id', });
      admin_tag.belongsTo(models.category, { foreignKey: 'category_id', targetKey: 'id' });

    }
  }
  admin_tag.init({
    category_id: DataTypes.INTEGER,
    tag_name: DataTypes.STRING,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'admin_tag',
  });
  return admin_tag;
};