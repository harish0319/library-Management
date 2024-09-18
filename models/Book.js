const { Model, DataTypes } = require('sequelize');
const sequelize = require('../config/connection');

class Book extends Model {}

Book.init(
  {
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    issuedAt: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    returnedAt: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fine: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    finePaid: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    modelName: 'Book',
  }
);

module.exports = Book;