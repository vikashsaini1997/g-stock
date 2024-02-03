'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class membership_plan extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      membership_plan.hasMany(models.user_plan, {foreignKey: 'plan_id',targetKey:"id"});
    }
  }
  membership_plan.init({
    name: DataTypes.STRING,
    plan_type: DataTypes.ENUM('Free','Paid'),
    monthly_price: DataTypes.FLOAT,
    total_price: DataTypes.FLOAT,
    description: DataTypes.TEXT,
    duration: DataTypes.INTEGER,
    status: DataTypes.INTEGER
  }, {
    sequelize,
    modelName: 'membership_plan',
  });
  return membership_plan;
};