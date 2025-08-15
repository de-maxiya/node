const express = require("express");
const router = express.Router();
const { filterEmptyParams } = require("../../utils/queryHandler");
const UserService = require("../../services/userService"); // 引入服务
const { validate } = require("../../middleware/validate"); // 引入验证中间件
const {
  getUserListSchema,
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} = require("../../models/validation/userValidation"); // 引入验证模型

// 1. 获取用户列表（GET /api/user）
router.get(
  "/",
  validate({ query: getUserListSchema }), // 绑定查询参数验证
  async (req, res) => {
    try {
      // 过滤空参数
      const filteredParams = filterEmptyParams(req.query);
      // 调用服务层
      const result = await UserService.getUserList(filteredParams);
      res.json({
        code: 200,
        data: result,
        message: "获取用户列表成功",
      });
    } catch (err) {
      res.status(500).json({
        code: 500,
        message: err.message || "服务器错误",
      });
    }
  }
);

// 2. 获取单个用户（GET /api/user/:id）
router.get(
  "/:id",
  validate({ params: idParamSchema }), // 绑定路径参数验证
  async (req, res) => {
    try {
      const user = await UserService.getUserById(req.params.id);
      res.json({ code: 200, data: user });
    } catch (err) {
      const status = err.message === "用户不存在" ? 404 : 500;
      res.status(status).json({ code: status, message: err.message });
    }
  }
);

// 3. 创建用户（POST /api/user）
router.post(
  "/",
  validate({ body: createUserSchema }), // 绑定请求体验证
  async (req, res) => {
    try {
      const newUser = await UserService.createUser(req.body);
      res.status(200).json({
        code: 200,
        data: newUser,
        message: "用户创建成功",
      });
    } catch (err) {
      res.status(400).json({ code: 400, message: err.message || "参数错误" });
    }
  }
);

// 4. 更新用户（PUT /api/user/:id）
router.put(
  "/:id",
  validate({
    params: idParamSchema, // 路径参数验证
    body: updateUserSchema, // 请求体验证
  }),
  async (req, res) => {
    try {
      const updatedUser = await UserService.updateUser(req.params.id, req.body);
      res.json({
        code: 200,
        data: updatedUser,
        message: "用户更新成功",
      });
    } catch (err) {
      const status = err.message === "用户不存在" ? 404 : 400;
      res.status(status).json({ code: status, message: err.message });
    }
  }
);

// 5. 删除用户（DELETE /api/user/:id）
router.delete(
  "/:id",
  validate({ params: idParamSchema }), // 路径参数验证
  async (req, res) => {
    try {
      await UserService.deleteUser(req.params.id);
      res.json({ code: 200, message: "删除成功" });
    } catch (err) {
      const status = err.message === "用户不存在" ? 404 : 500;
      res.status(status).json({ code: status, message: err.message });
    }
  }
);

module.exports = router;
