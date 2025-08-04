// middleware/validate.js
const {
  getUserListSchema,
  createUserSchema,
  updateUserSchema,
  idParamSchema,
} = require("../models/validation/userValidation");

// 通用验证中间件
const validate = (schemaConfig) => {
  return (req, res, next) => {
    // 验证的目标：query（查询参数）、body（请求体）、params（路径参数）
    const { query, body, params } = schemaConfig;

    // 执行验证
    if (query) {
      const { error } = query.validate(req.query);
      if (error)
        return res
          .status(400)
          .json({ code: 400, message: error.details[0].message });
    }

    if (body) {
      const { error } = body.validate(req.body);
      if (error)
        return res
          .status(400)
          .json({ code: 400, message: error.details[0].message });
    }

    if (params) {
      const { error } = params.validate(req.params);
      if (error)
        return res
          .status(400)
          .json({ code: 400, message: error.details[0].message });
    }

    next(); // 验证通过，进入下一步
  };
};

module.exports = { validate };
