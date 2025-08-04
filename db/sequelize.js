require("dotenv").config();
const { Sequelize } = require("sequelize");

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST || "localhost",
    dialect: "mysql",
    logging: false, // 关闭 SQL 日志，开发时可改为 console.log
  }
);

// 测试连接
(async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Sequelize 连接成功");
  } catch (error) {
    console.error("❌ Sequelize 连接失败:", error);
  }
})();

module.exports = sequelize;
