// 这是没有使用中间件校验的
// 比较原生
// const express = require("express");
// const router = express.Router();
// // 引入参数过滤工具
// const { filterEmptyParams } = require("../../utils/queryHandler");
// // 引入对应的模型
// const UserModel = require("../../models/user");

// // 1. 获取用户列表（GET /api/user）
// router.get("/", async (req, res) => {
//   try {
//     // 解构分页参数，其余参数作为过滤条件
//     console.log(req.query, "====s");

//     const { page = 1, pageSize = 10, ...filters } = req.query;

//     // 过滤空值参数
//     // const filteredFilters = filterEmptyParams(filters);

//     const currentPage = parseInt(page, 10);
//     const pageSizeNum = parseInt(pageSize, 10);
//     const offset = (currentPage - 1) * pageSizeNum;

//     // 同时查询数据列表和总条数（优化性能）
//     const [users, total] = await Promise.all([
//       UserModel.findAll({
//         where: filters,
//         limit: pageSizeNum,
//         offset,
//       }),
//       UserModel.count({ where: filters }), // 获取符合条件的总条数
//     ]);

//     console.log(pageSizeNum, offset, total, filters, "总条数");

//     res.json({
//       code: 200,
//       data: {
//         list: users, // 当前页数据列表
//         count: total, // 总数据条数
//         page: currentPage, // 当前页码
//         pageSize: pageSizeNum, // 每页条数
//         totalPages: Math.ceil(total / pageSizeNum), // 总页数（可选）
//       },
//       message: "获取用户列表成功",
//     });
//   } catch (err) {
//     res.status(500).json({
//       code: 500,
//       message: "服务器错误",
//       error: err.message,
//     });
//   }
// });

// // 其他接口保持不变...
// // 2. 获取单个用户（GET /api/user/:id）
// router.get("/:id", async (req, res) => {
//   try {
//     const user = await UserModel.findByPk(req.params.id);
//     if (!user) {
//       return res.status(404).json({ code: 404, message: "用户不存在" });
//     }
//     res.json({ code: 200, data: user });
//   } catch (err) {
//     res.status(500).json({ code: 500, message: "服务器错误" });
//   }
// });

// // 3. 创建用户（POST /api/user）
// router.post("/", async (req, res) => {
//   try {
//     const newUser = await UserModel.create(req.body);
//     res.status(200).json({
//       code: 200,
//       data: newUser,
//       message: "用户创建成功",
//     });
//   } catch (err) {
//     res
//       .status(400)
//       .json({ code: 400, message: "参数错误", error: err.message });
//   }
// });

// // 注意：这里有重复的POST路由，需要修改为PUT或PATCH
// router.put("/:id", async (req, res) => {
//   try {
//     const user = await UserModel.findByPk(req.params.id);
//     if (!user) {
//       return res.status(404).json({ code: 404, message: "用户不存在" });
//     }
//     const updatedUser = await user.update(req.body);
//     res.status(200).json({
//       code: 200,
//       data: updatedUser,
//       message: "用户更新成功",
//     });
//   } catch (err) {
//     res
//       .status(400)
//       .json({ code: 400, message: "参数错误", error: err.message });
//   }
// });

// // 5 删除
// router.delete("/:id", async (req, res) => {
//   try {
//     const user = await UserModel.findByPk(req.params.id);
//     if (!user) {
//       return res.status(404).json({ code: 404, message: "用户不存在" });
//     }
//     await user.destroy();
//     res.json({ code: 200, message: "删除成功" });
//   } catch (err) {
//     res.status(500).json({ code: 500, message: "服务器错误" });
//   }
// });

// module.exports = router;
