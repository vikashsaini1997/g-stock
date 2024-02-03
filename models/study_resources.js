'use strict';
const { Model} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class study_resources extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({User,school,category,subject,course,admin_tag,skill,study_resource_doc,country,state}) {
      // define association here
      study_resources.belongsTo(User, {foreignKey: 'user_id', targetKey:'id'});
      study_resources.belongsTo(school, {foreignKey: 'school_id', targetKey:'id'});
      study_resources.belongsTo(category, {foreignKey: 'category_id', targetKey:'id'});
      study_resources.belongsTo(subject, {foreignKey: 'subject_id', targetKey:'id'});
      study_resources.belongsTo(course, {foreignKey: 'course_id', targetKey:'id'});
      study_resources.belongsTo(country, {foreignKey: 'country_id', targetKey:'id'});
      study_resources.belongsTo(state, {foreignKey: 'state_id', targetKey:'id'});
      study_resources.belongsToMany(admin_tag, { through: 'study_resource_tag', foreignKey: 'study_res_id' }); 
      study_resources.belongsToMany(skill, { through: 'study_resource_skill', foreignKey: 'study_res_id' }); 
      study_resources.hasMany(study_resource_doc, {foreignKey: 'study_res_id', targetKey:'id'});

    }
  }
  study_resources.init({
    sr_id: DataTypes.INTEGER,
    user_id: DataTypes.INTEGER,    
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    category_id: DataTypes.INTEGER,
    sub_cat_id: DataTypes.INTEGER,
    school_id: DataTypes.INTEGER,
    course_id: DataTypes.INTEGER,
    subject_id: DataTypes.INTEGER,
    country_id: DataTypes.INTEGER,
    state_id: DataTypes.INTEGER,
    type: DataTypes.TEXT,
    tags: DataTypes.TEXT,
    price: DataTypes.INTEGER,
    rating: DataTypes.INTEGER,
    isFree: DataTypes.BOOLEAN,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'study_resources',
  });
  return study_resources;
};