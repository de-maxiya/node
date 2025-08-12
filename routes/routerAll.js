const express = require("express");
const router = express.Router();
const queryFilterMiddleware = require("../middleware/queryFilterMiddleware");
const jwt = require("jsonwebtoken");

// 1. 导入路由模块（新增auth模块）
const userRouter = require("./user");
const authRouter = require("./authToken/auth"); // 认证路由模块

// 2. 路由映射表（添加auth路由）
const routers = {
  "/user": userRouter,
  "/auth": authRouter, // 注册认证接口：/api/auth/...
  // 其他路由...
};

// 3. 批量注册路由（保持原有逻辑）
Object.entries(routers).forEach(([path, routerModule]) => {
  const fullPath = `/api${path}`;
  router.use(fullPath, routerModule);
  console.log(`已注册路由：${fullPath}`);
});

// 4. 全局中间件（过滤、日志等）
router.use(queryFilterMiddleware());
router.use((req, res, next) => {
  console.log(`API 请求：${req.method} ${req.originalUrl}`);
  next();
});

// 5. Token验证中间件（保护需要登录的接口）
const verifyToken = (req, res, next) => {
  // 排除不需要验证的接口（如登录、验证码接口）
  const publicPaths = [
    "/api/auth/login",
    "/api/auth/captcha",
    "/api/auth/ecdh/public/key",
    "/api/auth/ecdh/exchange",
    "/api/auth/ecdh/exchange",
  ];
  if (publicPaths.includes(req.originalUrl)) {
    return next();
  }

  // 验证Token
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ code: 401, message: "未登录" });
  }

  jwt.verify(token, process.env.JWT_SECRET || "your-secret", (err, decoded) => {
    if (err) {
      return res.status(401).json({ code: 401, message: "Token无效或过期" });
    }
    req.user = decoded; // 将用户信息存入请求
    next();
  });
};

// 应用Token验证中间件（所有API请求都会经过）
router.use(verifyToken);

// 6. 全局错误处理
router.use((err, req, res, next) => {
  console.error("接口错误：", err);
  res.status(500).json({ code: 500, message: "服务器内部错误" });
});

module.exports = router;
