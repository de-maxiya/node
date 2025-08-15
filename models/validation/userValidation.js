// models/validation/userValidation.js
const Joi = require("joi");

// 1. 获取用户列表的查询参数验证
const getUserListSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1), // 页码，默认1
  pageSize: Joi.number().integer().min(1).max(100).default(10), // 每页条数，默认10
  // 其他过滤字段（根据实际业务添加，例如用户名、年龄等）
  name: Joi.string().allow("", null), // 允许空字符串或null
  //   age: Joi.number().integer().min(0).allow(null),
  age: Joi.string().allow("", null),
  id: Joi.number().integer().min(1).allow(null, ""),
  status: Joi.number().integer().min(1).allow(null, ""),
  gender: Joi.number().integer().min(1).allow(null, ""),
  img: Joi.string().allow("", null, ""),
});

// 2. 创建用户的请求体验证
const createUserSchema = Joi.object({
  account: Joi.string().required().messages({
    "string.empty": "账号不能为空",
    "any.required": "账号不能为空", // 同时覆盖 required 的默认消息
  }),
  password: Joi.string().required().messages({
    "string.empty": "密码不能为空",
    "any.required": "密码不能为空", // 同时覆盖 required 的默认消息
  }),
  name: Joi.string().required().messages({
    "string.empty": "用户名不能为空",
    "any.required": "用户名不能为空", // 同时覆盖 required 的默认消息
  }),
  age: Joi.number()
    .integer()
    .min(0)
    .message("年龄必须是非负整数") // 正确：跟在 min() 后面
    .messages({
      "number.base": "年龄必须是数字",
      "number.integer": "年龄必须是整数",
    }),
  status: Joi.number().integer().min(1).allow(null, "").messages({
    "number.integer": "状态必须是整数",
    "number.min": "状态最小值为 1",
  }),
  gender: Joi.number().integer().min(0).allow(null, "").messages({
    "number.integer": "性别必须是整数",
    "number.min": "性别最小值为 0",
  }),
  img: Joi.string()
    .allow("", null) // 注意：这里重复写了空字符串，简化为一个即可
    .messages({
      "string.base": "图片路径必须是字符串",
    }),
});

// // 3. 更新用户的请求体验证
const updateUserSchema = Joi.object({
  account: Joi.string().required().messages({
    "string.empty": "账号不能为空",
    "any.required": "账号不能为空", // 同时覆盖 required 的默认消息
  }),
  name: Joi.string().required().messages({
    "string.empty": "用户名不能为空",
    "any.required": "用户名不能为空", // 同时覆盖 required 的默认消息
  }),
  age: Joi.number()
    .integer()
    .min(0)
    .message("年龄必须是非负整数") // 正确：跟在 min() 后面
    .messages({
      "number.base": "年龄必须是数字",
      "number.integer": "年龄必须是整数",
    }),
  status: Joi.number().integer().min(1).allow(null, "").messages({
    "number.integer": "状态必须是整数",
    "number.min": "状态最小值为 1",
  }),
  gender: Joi.number().integer().min(0).allow(null, "").messages({
    "number.integer": "性别必须是整数",
    "number.min": "性别最小值为 0",
  }),
  img: Joi.string()
    .allow("", null) // 注意：这里重复写了空字符串，简化为一个即可
    .messages({
      "string.base": "图片路径必须是字符串",
    }),
});

// 4. 路径参数（id）验证
const idParamSchema = Joi.object({
  id: Joi.number()
    .integer()
    .message("id必须是整数")
    .min(1)
    .message("id不能小于1")
    .required()
    .messages({
      "any.required": "id必须是正整数", // 给 required 规则设置提示
    }),
});

module.exports = {
  getUserListSchema,
  createUserSchema,
  updateUserSchema,
  idParamSchema,
};
