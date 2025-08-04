// services/userService.js
const UserModel = require("../models/user");

class UserService {
  // 1. 获取用户列表
  static async getUserList({ page = 1, pageSize = 10, ...filters }) {
    const currentPage = parseInt(page, 10);
    const pageSizeNum = parseInt(pageSize, 10);
    const offset = (currentPage - 1) * pageSizeNum;

    // 同时查询数据和总条数
    const [users, total] = await Promise.all([
      UserModel.findAll({
        where: filters,
        limit: pageSizeNum,
        offset,
      }),
      UserModel.count({ where: filters }),
    ]);

    return {
      list: users,
      count: total,
      page: currentPage,
      pageSize: pageSizeNum,
      totalPages: Math.ceil(total / pageSizeNum),
    };
  }

  // 2. 获取单个用户
  static async getUserById(id) {
    const user = await UserModel.findByPk(id);
    if (!user) {
      throw new Error("用户不存在"); // 抛出自定义错误，由路由统一处理
    }
    return user;
  }

  // 3. 创建用户
  static async createUser(userData) {
    return await UserModel.create(userData);
  }

  // 4. 更新用户
  static async updateUser(id, updateData) {
    const user = await UserModel.findByPk(id);
    if (!user) {
      throw new Error("用户不存在");
    }
    return await user.update(updateData);
  }

  // 5. 删除用户
  static async deleteUser(id) {
    const user = await UserModel.findByPk(id);
    if (!user) {
      throw new Error("用户不存在");
    }
    await user.destroy();
    return true;
  }
}

module.exports = UserService;
