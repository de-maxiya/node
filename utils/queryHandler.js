// 通用查询参数过滤工具
/**
 * 过滤查询参数中的空值
 * @param {Object} queryParams - 原始查询参数
 * @param {Array} allowEmpty - 允许为空的字段数组（可选）
 * @returns {Object} 过滤后的参数
 */
function filterEmptyParams(queryParams, allowEmpty = []) {
  if (!queryParams || typeof queryParams !== "object") {
    return {};
  }

  const filtered = {};

  // 遍历所有查询参数
  Object.entries(queryParams).forEach(([key, value]) => {
    // 允许为空的字段直接保留
    if (allowEmpty.includes(key)) {
      filtered[key] = value;
      return;
    }

    // 过滤空值（空字符串、null、undefined）
    if (value !== "" && value !== null && value !== undefined) {
      filtered[key] = value;
    }
  });

  return filtered;
}

module.exports = {
  filterEmptyParams,
};
