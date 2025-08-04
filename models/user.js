// models/user.js
const { Model, DataTypes } = require("sequelize");
const sequelize = require("../db/sequelize"); // 你的 Sequelize 连接实例

class User extends Model {}

User.init(
  {
    // 定义表字段
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    age: {
      type: DataTypes.INTEGER,
    },
    status: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    gender: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    img: {
      type: DataTypes.STRING,
      defaultValue: "",
    },
  },
  {
    sequelize,
    modelName: "User",
    tableName: "user", // 数据库中的表名
    timestamps: false, // 自动生成 createdAt 和 updatedAt
  }
);

module.exports = User;
