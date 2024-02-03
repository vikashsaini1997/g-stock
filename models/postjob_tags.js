'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class postjob_tags extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {

    }
  }
  postjob_tags.init({
    jobpost_id: DataTypes.INTEGER,
    tag_id: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'postjob_tags',
  });
  return postjob_tags;
};