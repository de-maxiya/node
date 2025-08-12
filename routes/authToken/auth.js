const express = require("express");
const router = express.Router();
const crypto = require("crypto");
const svgCaptcha = require("svg-captcha");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt"); // 新增：用于密码存储加密
const User = require("../../models/user");

// 1. ECDH配置（全局存储，生产环境需绑定用户会话，如用Redis）
const ecdhMap = new Map(); // 存储 sessionId → ECDH实例
const sharedSecretMap = new Map(); // 存储 sessionId → 共享密钥

// 新增：复用的ECDH验证中间件（验证是否已完成密钥交换）
const requireECDH = (req, res, next) => {
  const sessionId = req.sessionID;
  const sharedSecret = sharedSecretMap.get(sessionId);
  if (!sharedSecret) {
    return res.status(400).json({ message: "请先完成ECDH密钥交换" });
  }
  // 将共享密钥挂载到req，后续解密使用
  req.sharedSecret = Buffer.from(sharedSecret, "hex");
  next();
};

// 新增：AES解密工具函数（复用登录的解密逻辑）
const aesDecrypt = (encryptedData, key, ivHex) => {
  const iv = Buffer.from(ivHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);
  return decipher.update(encryptedData, "hex", "utf8") + decipher.final("utf8");
};

// 2. 获取后端 ECDH 公钥
router.get("/ecdh/public/key", async (req, res) => {
  const sessionId = req.sessionID;
  console.log("获取公钥 - sessionId:", sessionId);
  try {
    const ecdh = crypto.createECDH("prime256v1");
    ecdh.generateKeys();
    const serverPublicKey = ecdh.getPublicKey("base64", "uncompressed");
    ecdhMap.set(sessionId, ecdh);
    res.json({
      code: 200,
      data: { serverPublicKey },
      message: "获取公钥成功",
    });
  } catch (error) {
    console.error("获取公钥失败:", error);
    res.status(500).json({ message: "获取公钥失败" });
  }
});

// 3. 接收前端公钥，计算共享密钥
router.post("/ecdh/exchange", (req, res) => {
  const { clientPublicKey } = req.body;
  const sessionId = req.sessionID;

  if (!clientPublicKey) {
    return res.status(400).json({ success: false, message: "缺少客户端公钥" });
  }

  try {
    const clientPublicKeyBuffer = Buffer.from(clientPublicKey, "base64");
    if (clientPublicKeyBuffer.length !== 65) {
      throw new Error(
        `公钥长度错误（应为65字节，实际${clientPublicKeyBuffer.length}字节）`
      );
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(clientPublicKey)) {
      throw new Error("客户端公钥不是有效的base64格式");
    }

    const ecdh = ecdhMap.get(sessionId);
    if (!ecdh) {
      throw new Error("未找到当前会话的ECDH实例，请先获取服务器公钥");
    }

    const sharedSecret = ecdh.computeSecret(clientPublicKey, "base64", "hex");
    sharedSecretMap.set(sessionId, sharedSecret);
    res.json({ success: true });
  } catch (error) {
    console.error(`密钥交换失败：${error.message}`, {
      sessionId,
      clientPublicKey: clientPublicKey.substring(0, 20) + "...",
      errorStack: error.stack,
    });
    res.status(500).json({
      success: false,
      message: "密钥交换失败",
      debug: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
});

// 4. 生成验证码
router.get("/captcha", (req, res) => {
  const sessionId = req.sessionID;
  const sharedSecret = sharedSecretMap.get(sessionId);

  if (!sharedSecret) {
    return res.status(400).json({ message: "请先完成ECDH密钥交换" });
  }

  const captcha = svgCaptcha.create({ size: 4, noise: 2 });
  req.session.captchaText = captcha.text;

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

// 5. 登录接口
router.post("/login", async (req, res) => {
  const sessionId = req.sessionID;
  const sharedSecret = sharedSecretMap.get(sessionId);
  const { encryptedPassword, encryptedUserCaptcha, iv, account } = req.body;

  if (!sharedSecret) {
    return res.status(400).json({ message: "请先完成ECDH密钥交换" });
  }

  try {
    // 解密验证码
    const decipherCaptcha = crypto.createDecipheriv(
      "aes-256-cbc",
      Buffer.from(sharedSecret, "hex"),
      Buffer.from(iv, "hex")
    );
    const userCaptcha =
      decipherCaptcha.update(encryptedUserCaptcha, "hex", "utf8") +
      decipherCaptcha.final("utf8");

    // 解密密码
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

    // 验证账号密码
    const user = await User.findOne({ where: { account } });
    if (!user) {
      return res.status(401).json({ message: "账号不存在" });
    }
    // 注意：如果是新注册的用户，密码已用bcrypt加密，这里需要用bcrypt验证
    const isPasswordValid =
      (await bcrypt.compare(password, user.password)) ||
      user.password === password;
    if (!isPasswordValid) {
      return res.status(401).json({ message: "密码错误" });
    }

    // 生成JWT
    const token = jwt.sign(
      { userId: user.id, username: user.name },
      process.env.JWT_SECRET || "your-secret",
      { expiresIn: "2h" }
    );

    res.json({ token, message: "登录成功" });
  } catch (error) {
    console.error("登录失败:", error);
    res.status(500).json({ message: "验证失败" });
  }
});

// 6. 注册接口（直接添加在当前文件中）
router.post("/create", requireECDH, async (req, res) => {
  const { encryptedPassword, iv, account, name } = req.body;
  const sessionId = req.sessionID;
  console.log("注册接口sessionId:", sessionId); // 与ECDH交换时的sessionId对比
  console.log("后端共享密钥:", req.sharedSecret.toString("hex")); // 打印后端使用的密钥

  try {
    // 1. 解密前端加密的密码（使用共享密钥）
    const password = aesDecrypt(encryptedPassword, req.sharedSecret, iv);
    console.log("解密后的密码:", password);
    // 2. 验证账号是否已存在
    const existingUser = await User.findOne({ where: { account } });
    if (existingUser) {
      return res.status(400).json({ code: 400, message: "账号已存在" });
    }

    // 3. 密码存储加密（bcrypt加盐哈希）
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    console.log(hashedPassword, "hashedPassword");

    // 4. 创建新用户（根据你的User模型字段调整）
    await User.create({
      account,
      password: hashedPassword, // 存储加密后的密码
      name: name || account, // 用户名默认用账号
      // 其他字段（如status、gender等）根据模型默认值自动填充
    });

    res.json({ code: 200, message: "注册成功" });
  } catch (error) {
    console.error("注册失败:", error);
    res.status(500).json({ code: 500, message: "注册失败，请重试" });
  }
});

module.exports = router;
