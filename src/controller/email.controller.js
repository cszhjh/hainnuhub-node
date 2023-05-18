const sendEmail = require("../utils/email-handle");
const userService = require("../service/user.service");

class EmailController {
  async send(ctx, next) {
    try {
      const { email, type } = ctx.request.body;
      const code = await sendEmail(email);
      let result = "";

      // 0 注册，1 重置或登录
      if (type === 0) {
        result = await userService.insertEmailCodeByEmail(email, code);
      } else if (type === 1 || type === 2) {
        result = await userService.updateEmailCodeByEmail(email, code);
      }
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new EmailController();
