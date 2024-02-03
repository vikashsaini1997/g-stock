'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jobposts extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      jobposts.belongsTo(models.User, {foreignKey: 'userid', targetKey:"id"});
      jobposts.belongsTo(models.category, {foreignKey: 'categoryid'});
      jobposts.belongsTo(models.subcategory, {foreignKey: 'sub_cat_id'});
      jobposts.belongsTo(models.school, {foreignKey: 'school_id'});
      jobposts.belongsTo(models.course, {foreignKey: 'course_id'});
      jobposts.belongsTo(models.subject, {foreignKey: 'subject_id'});
      jobposts.belongsTo(models.country, {foreignKey: 'country_id'});
      jobposts.belongsTo(models.state, {foreignKey: 'state_id'});
      // jobposts.belongsTo(models.postjob_docs, {foreignKey: 'jobpost_id', targetKey:'id'});
      jobposts.belongsToMany(models.admin_tag, { through: 'postjob_tags', foreignKey: 'jobpost_id' }); 
      jobposts.hasMany(models.jobbids, {foreignKey: 'jobid',targetKey:"id"});
      jobposts.hasMany(models.postjob_docs, {foreignKey: 'jobpost_id',targetKey:"id"});
    }
  }
  jobposts.init({
    random_id:DataTypes.INTEGER,
    title: DataTypes.STRING,
    description: DataTypes.TEXT,
    categoryid: DataTypes.INTEGER,
    sub_cat_id: DataTypes.INTEGER,
    school_id:DataTypes.INTEGER,
    course_id:DataTypes.INTEGER,
    subject_id:DataTypes.INTEGER,
    documenttype:DataTypes.STRING,
    pages:DataTypes.INTEGER,
    due_date:DataTypes.STRING,
    budget:DataTypes.INTEGER,
    status:DataTypes.INTEGER,
    document:DataTypes.STRING,
    writingservice:DataTypes.INTEGER,
    userid:DataTypes.INTEGER,
    country_id:DataTypes.INTEGER,
    state_id:DataTypes.INTEGER,
    tags: DataTypes.TEXT,
  }, {
    sequelize,
    modelName: 'jobposts',
  });
  return jobposts;
};