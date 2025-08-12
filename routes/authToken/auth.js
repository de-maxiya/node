const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const svgCaptcha = require("svg-captcha");
const jwt = require("jsonwebtoken");
const User = require("../../models/user");
// 1. ECDH配置（全局存储，生产环境需绑定用户会话，如用Redis）
const ecdh = crypto.createECDH("prime256v1");
let ecdhMap = new Map(); // 存储 sessionId → ECDH实例
let sharedSecretMap = new Map(); // 存储 sessionId → 共享密钥

// 2. 获取后端 ECDH 公钥（完整正确代码）
router.get("/ecdh/public/key", async (req, res) => {
  const sessionId = req.sessionID;
  console.log("获取公钥 - sessionId:", sessionId);
  try {
    const ecdh = crypto.createECDH("prime256v1");
    ecdh.generateKeys();

    // 显式指定公钥格式为 "uncompressed"（关键！）
    const serverPublicKey = ecdh.getPublicKey("base64", "uncompressed");

    ecdhMap.set(sessionId, ecdh);
    console.log("ECDH实例已存储 - sessionId:", sessionId);

    res.json({
      code: 200,
      data: { serverPublicKey }, // 返回未压缩格式的公钥
      message: "获取公钥成功",
    });
  } catch (error) {
    console.error("获取公钥失败:", error);
    res.status(500).json({ message: "获取公钥失败" });
  }
});

// 3. 接收前端公钥，计算共享密钥（绑定用户会话）
router.post("/ecdh/exchange", (req, res) => {
  const { clientPublicKey } = req.body;
  const sessionId = req.sessionID;

  // 1. 基础参数校验
  if (!clientPublicKey) {
    return res.status(400).json({ success: false, message: "缺少客户端公钥" });
  }

  try {
    // 新增：验证客户端公钥长度（65字节 → base64编码后约87字符）
    const clientPublicKeyBuffer = Buffer.from(clientPublicKey, "base64");
    if (clientPublicKeyBuffer.length !== 65) {
      throw new Error(
        `公钥长度错误（应为65字节，实际${clientPublicKeyBuffer.length}字节）`
      );
    }

    // 2. 验证公钥是否为有效的base64格式
    if (!/^[A-Za-z0-9+/=]+$/.test(clientPublicKey)) {
      throw new Error("客户端公钥不是有效的base64格式");
    }

    // 3. 检查当前会话的ECDH实例是否存在（关键！）
    const ecdh = ecdhMap.get(sessionId); // 假设你已按之前建议改用per-session的ECDH实例
    if (!ecdh) {
      throw new Error("未找到当前会话的ECDH实例，请先获取服务器公钥");
    }

    // 4. 计算共享密钥（核心步骤）
    const sharedSecret = ecdh.computeSecret(
      clientPublicKey, // 客户端公钥（base64格式）
      "base64", // 输入格式
      "hex" // 输出格式
    );

    // 5. 存储共享密钥
    sharedSecretMap.set(sessionId, sharedSecret);
    res.json({ success: true });
  } catch (error) {
    // 关键：打印详细错误信息（开发环境）
    console.error(`密钥交换失败：${error.message}`, {
      sessionId,
      clientPublicKey: clientPublicKey.substring(0, 20) + "...", // 只打印部分，避免日志过长
      errorStack: error.stack,
    });

    res.status(500).json({
      success: false,
      message: "密钥交换失败",
      // 开发环境可返回具体错误，生产环境移除
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// 4. 生成验证码（SVG + 加密文本）
router.get("/captcha", (req, res) => {
  const sessionId = req.sessionID;
  const sharedSecret = sharedSecretMap.get(sessionId);

  if (!sharedSecret) {
    return res.status(400).json({ message: "请先完成ECDH密钥交换" });
  }

  // 生成验证码
  const captcha = svgCaptcha.create({ size: 4, noise: 2 });
  req.session.captchaText = captcha.text; // 存储到session（5分钟过期）

  // 加密验证码文本（AES-256-CBC）
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(
    "aes-256-cbc",
    Buffer.from(sharedSecret, "hex"),
    iv
  );
  const encryptedCaptcha =
    cipher.update(captcha.text, "utf8", "hex") + cipher.final("hex");

  res.json({
    code: 200,
    message: "获取验证码成功",
    data: {
      captchaSvg: captcha.data,
      encryptedCaptcha,
      iv: iv.toString("hex"),
    },
  });
});

// 5. 登录接口（验证加密的密码和验证码）
router.post("/login", async (req, res) => {
  const sessionId = req.sessionID;
  const sharedSecret = sharedSecretMap.get(sessionId);
  const { encryptedPassword, encryptedUserCaptcha, iv, account } = req.body;

  if (!sharedSecret) {
    return res.status(400).json({ message: "请先完成ECDH密钥交换" });
  }

  try {
    // 解密用户输入的验证码
    const decipherCaptcha = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(sharedSecret, "hex"),
      Buffer.from(iv, "hex")
    );
    const userCaptcha =
      decipherCaptcha.update(encryptedUserCaptcha, "hex", "utf8") +
      decipherCaptcha.final("utf8");

    // 解密密码（实际应与数据库比对）
    const decipherPwd = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(sharedSecret, "hex"),
      Buffer.from(iv, "hex")
    );
    const password =
      decipherPwd.update(encryptedPassword, "hex", "utf8") +
      decipherPwd.final("utf8");

    // 验证验证码
    if (userCaptcha.toLowerCase() !== req.session.captchaText.toLowerCase()) {
      return res.status(400).json({ message: "验证码错误" });
    }

    // 验证密码（示例：实际需查数据库）
    const allUsers = await User.findAll({
      raw: true, // 关键参数：只返回数据，不包含模型实例元数据
    });

    const filterAccount = allUsers.filter((item) => item.account === account);
    if (filterAccount.length === 0) {
      return res.status(401).json({ message: "账号不存在" });
    }

    const filterPassword = filterAccount.filter(
      (item) => item.password === password
    );
    if (filterPassword.length === 0) {
      return res.status(401).json({ message: "密码错误" });
    }
    console.log(filterAccount, filterPassword, "=filterPassword");

    // if (password !== "123456") {
    //   // 假设正确密码
    //   return res.status(401).json({ message: "密码错误" });
    // }

    // 生成JWT Token
    const token = jwt.sign(
      { userId: 1, username: "admin" },
      process.env.JWT_SECRET || "your-secret", // 生产环境用环境变量
      { expiresIn: "2h" }
    );

    res.json({ token, message: "登录成功" });
  } catch (error) {
    res.status(500).json({ message: "验证失败" });
  }
});

module.exports = router;
