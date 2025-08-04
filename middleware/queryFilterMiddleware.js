// middleware/queryFilterMiddleware.js
const queryFilterMiddleware = (options = {}) => {
  return (req, res, next) => {
    try {
      console.log("进入参数过滤中间件...");
      if (!req.query) {
        console.log("无查询参数，直接放行");
        return next();
      }

      const { allowEmpty = [] } = options;
      const filteredQuery = {};

      // 过滤空值参数（逻辑不变）
      Object.entries(req.query).forEach(([key, value]) => {
        if (allowEmpty.includes(key)) {
          filteredQuery[key] = value;
          return;
        }
        if (value !== "" && value !== null && value !== undefined) {
          filteredQuery[key] = value;
        }
      });

      // 关键修改：清空原始req.query的属性，再添加过滤后的值
      // 避免直接替换req.query对象导致的失效问题
      Object.keys(req.query).forEach((key) => delete req.query[key]); // 清空原始属性
      Object.assign(req.query, filteredQuery); // 将过滤后的值合并到原始req.query
      req.query.filterSearch = filteredQuery;
      console.log("过滤后参数：", req.query, "===", filteredQuery); // 此时应输出 { page: '1', pageSize: '10' }
      next();
    } catch (err) {
      res.status(500).json({
        code: 500,
        message: "参数过滤中间件错误",
        error: err.message,
      });
    }
  };
};

module.exports = queryFilterMiddleware;
