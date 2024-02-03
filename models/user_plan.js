'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class user_plan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({membership_plan,User}) {
      user_plan.belongsTo(membership_plan, {foreignKey: 'plan_id', targetKey:'id'});
      user_plan.belongsTo(User, {foreignKey: 'user_id', targetKey:'id'});
    }
  }
  user_plan.init({
    user_id: DataTypes.INTEGER,
    plan_id: DataTypes.INTEGER,
    start_date: DataTypes.STRING,
    end_date: DataTypes.STRING,
    bid: DataTypes.INTEGER,
    type: DataTypes.STRING,
    status: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'user_plan',
  });
  return user_plan;
};