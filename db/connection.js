// // db/connection.js
// // 关键：使用 mysql2/promise 版本（返回 Promise，支持 async/await）
// const mysql = require("mysql2/promise");
// const dotenv = require("dotenv");

// dotenv.config();
// const pool = mysql.createPool({
//   host: process.env.DB_HOST || "localhost",
//   user: process.env.DB_USER || "root",
//   password: process.env.DB_PASSWORD,
//   database: process.env.DB_NAME,
//   waitForConnections: true,
//   connectionLimit: 10,
//   queueLimit: 0,
// });

// // 测试连接（现在与 Promise 版本兼容）
// (async () => {
//   try {
//     const connection = await pool.getConnection(); // 正确返回 Promise
//     console.log("✅ 数据库连接成功！数据库名：", process.env.DB_NAME);
//     connection.release(); // 此时 connection 是有效对象，可调用 release()
//   } catch (err) {
//     console.error("❌ 数据库连接失败：", err.message);
//     console.error(
//       "失败原因可能：数据库名不存在、密码错误、MySQL未启动、表不存在"
//     );
//   }
// })();

// module.exports = pool;
