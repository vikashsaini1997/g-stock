'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class subject extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({course}) {
      subject.belongsTo(course, {foreignKey: 'course_id', targetKey:'id'});
    }
  }
  subject.init({
    course_id: DataTypes.INTEGER,
    subject_name: DataTypes.STRING,
    status: DataTypes.STRING
  }, {
    sequelize,
    modelName: 'subject',
  });
  return subject;
};