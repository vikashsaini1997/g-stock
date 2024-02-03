'use strict';
const {
  Model
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  class address extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate({country,state,city}) {
      address.belongsTo(country, {foreignKey: 'country_id', targetKey:'id'});
      address.belongsTo(state, {foreignKey: 'state_id', targetKey:'id'});
      address.belongsTo(city, {foreignKey: 'country_id', targetKey:'id'});
    }
  }
  address.init({
    user_id: DataTypes.INTEGER,
    full_name: DataTypes.STRING,
    phone_code: DataTypes.STRING,
    phone_no: DataTypes.STRING,
    address: DataTypes.TEXT,
    country_id: DataTypes.INTEGER,
    state_id: DataTypes.INTEGER,
    city_id: DataTypes.INTEGER,
    zip_code: DataTypes.INTEGER,
    status: DataTypes.INTEGER,
  }, {
    sequelize,
    modelName: 'address',
  });
  return address;
};