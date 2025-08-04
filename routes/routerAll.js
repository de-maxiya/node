#!/usr/bin/env node
// -*- coding: utf-8 -*-

const express = require("express");
const router = express.Router();
const queryFilterMiddleware = require("../middleware/queryFilterMiddleware");

// 1. 显式导入所有路由模块（类似Python的from router.admin import ...）
const userRouter = require("./user");
// const productRouter = require("./api/product");
// const orderRouter = require("./api/order");
// const cartRouter = require("./api/cart");
// const paymentRouter = require("./api/payment");
// const eelRouter = require("./api/eel");
// const auditRouter = require("./api/audit");
// 按需添加更多路由模块...

// 2. 路由路径与模块映射表（类似Python的routers字典）
const routers = {
  "/user": userRouter,
  // "/product": productRouter,
  // "/order": orderRouter,
  // "/cart": cartRouter,
  // "/payment": paymentRouter,
  // "/eel": eelRouter,
  // "/audit": auditRouter,
  // // 嵌套路由示例（类似Python的"/audit/label"）
  // "/audit/label": require("./api/audit/label"),
  // "/product/check": require("./api/product/check"),
  // 按需添加更多路由映射...
};

// 3. 批量注册路由（类似Python的for循环注册）
Object.entries(routers).forEach(([path, routerModule]) => {
  // 统一添加/api前缀（相当于Python的root_path）
  const fullPath = `/api${path}`;
  router.use(fullPath, routerModule);
  console.log(`已注册路由：${fullPath}`);
});

// 4. 中间件配置（保持原有）
router.use(queryFilterMiddleware());

// 全局API中间件（如日志、权限验证等）
router.use((req, res, next) => {
  console.log(`API 请求：${req.method} ${req.originalUrl}`, req.query);
  next();
});

module.exports = router;
