'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class jobbids extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      jobbids.belongsTo(models.User, {foreignKey: 'userid', as: 'users'});
      jobbids.belongsTo(models.jobposts, {foreignKey: 'jobid', targetKey:"id"});
      jobbids.hasMany(models.jobbid_doc, {foreignKey: 'jobbid_id', targetKey:"id"});
    }
  }
  jobbids.init({
    bidamount: DataTypes.INTEGER,
    deliverydate: DataTypes.STRING,
    proposal: DataTypes.TEXT,
    jobid: DataTypes.INTEGER,
    userid:DataTypes.INTEGER,
    status:DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'jobbids',
  });
  return jobbids;
};