const jwt = require("jsonwebtoken");
const service = require("../service/user.service");
const messageTypes = require("../constants/message-types");
const { PRIVATE_KEY, PUBLIC_KEY } = require("../app/config");

class AuthController {
  async login(ctx, next) {
    try {
      const { id, email, username, power, last_login_time, createAt, updateAt } = ctx.user;
      const token = jwt.sign({ id, email, username }, PRIVATE_KEY, {
        expiresIn: 60 * 60 * 24,
        algorithm: "RS256"
      });

      // 删除验证码数据
      await service.deleteEmailCodeByMain(email, "user");

      ctx.success({
        "userInfo": {
          id,
          email,
          username,
          power,
          lastLoginTime: last_login_time,
          createTime: createAt,
          updateTime: updateAt
        },
        token
      });
    } catch (error) {
      console.log(error);
    }
  }

  async logout(ctx, next) {
    try {
      const { id } = ctx.user;
      const result = await service.updateLastLoginTime(id);
      ctx.success(result, "退出成功！");
    } catch (error) {
      console.log(error);
    }
  }

  async success(ctx, next) {
    ctx.success({}, "授权成功！");
  }

  async sendSystemMessage(ctx, next) {
    try {
      const { receivedUserId } = ctx.params;
      const { userId, username, message } = ctx.request.body;
      await service.createMessage(
        receivedUserId,
        null,
        null,
        null,
        userId,
        username,
        messageTypes.SYS,
        message
      );
      ctx.success({}, "发送成功");
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new AuthController();
