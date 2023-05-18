const settingService = require("../service/setting.service");

class SetttingController {
  async getSettings(ctx, next) {
    try {
      const result = await settingService.getSettings();
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async setting(ctx, next) {
    try {
      const { forumAudit, emailTitle, emailContent, registerWelcomeInfo } = ctx.request.body;

      const result = await settingService.setting(
        forumAudit,
        emailTitle,
        emailContent,
        registerWelcomeInfo
      );

      await settingService.updateForumAudit(forumAudit);

      ctx.success(result, "修改成功");
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new SetttingController();
