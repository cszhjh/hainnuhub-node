const fs = require("fs");

const userService = require("../service/user.service");
const fileService = require("../service/file.service");
const settingService = require("../service/setting.service");
const { AVATAR_PATH } = require("../constants/file-path");
const messageTypes = require("../constants/message-types");

class UserController {
  async create(ctx, next) {
    try {
      // 获取用户请求传递的参数
      const user = ctx.request.body;

      // 查询数据
      const result = await userService.create(user);
      const { registerWelcomeInfo } = await settingService.getSettings();

      // 给新用户发系统通知
      await userService.createMessage(
        result.insertId,
        null,
        null,
        null,
        null,
        null,
        messageTypes.SYS,
        registerWelcomeInfo
      );

      // 删除验证码数据
      await service.deleteEmailCodeByMain(email, "register");

      // 返回数据
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async update(ctx, next) {
    try {
      const { id } = ctx.user;
      const { username, sex, description, type = true, power } = ctx.request.body;
      let result;
      if (type) {
        result = await userService.updateUsernameByUserId(username, sex, description, id, power);
        ctx.success(result);
      }
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async updatePassword(ctx, next) {
    try {
      const user = ctx.request.body;

      const result = await userService.updatePasswordByEmail(user);

      // 删除验证码数据
      await service.deleteEmailCodeByMain(email, "user");
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async avatarInfo(ctx, next) {
    try {
      // 1. 用户的头像是哪一个文件
      const { userId } = ctx.params;
      const avatarInfo = await fileService.getAvatarByUserId(userId);
      // 2. 提供图像信息
      if (avatarInfo) {
        ctx.response.set("content-type", avatarInfo.mimetype);
        ctx.body = fs.createReadStream(`${AVATAR_PATH}/${avatarInfo.filename}`);
      } else {
        ctx.status = 404;
        return ctx.app.emit("error", new Error(), ctx);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async getUserInfo(ctx, next) {
    try {
      const { userId } = ctx.params;
      const result = await userService.getUserInfo(userId);
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async listFuzzy(ctx, next) {
    try {
      const { usernameFuzzy, sex, power, offset = "0", size = "8" } = ctx.query;
      const { userTotal } = await userService.getUserListTotal(usernameFuzzy, sex, power);
      const userList = await userService.getUserListFuzzy(offset, size, usernameFuzzy, sex, power);

      ctx.success({
        dataTotal: userTotal,
        pageNo: Number(offset) < Number(size) ? 1 : parseInt(offset / size) + 1,
        pageSize: Number(size),
        pageTotal: Math.ceil(userTotal / size),
        userList
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getUserForumInfo(ctx, next) {
    try {
      const { userId } = ctx.params;
      const { currentUserId, type = "0", offset = "0", size = "5" } = ctx.query;
      const result = await userService.getUserForumInfo(userId, currentUserId, type);
      ctx.success({
        dataTotal: result.length,
        pageNo: Number(offset) < Number(size) ? 1 : parseInt(offset / size) + 1,
        pageSize: Number(size),
        pageTotal: Math.ceil(result.length / size),
        forumList: result
      });
    } catch (error) {
      console.log(error);
    }
  }

  async getMessageCount(ctx, next) {
    try {
      const { id } = ctx.user;
      const result = await userService.getMessageCount(id);

      let total = 0;
      let sys = 0;
      let reply = 0;
      let forum = 0;
      let comment = 0;
      for (let item of result) {
        switch (item.messageType) {
          case messageTypes.SYS:
            sys += item.total;
            break;
          case messageTypes.REPLY:
            reply += item.total;
            break;
          case messageTypes.FORUM:
            forum += item.total;
            break;
          case messageTypes.COMMENT:
            comment += item.total;
            break;
        }
        total += item.total;
      }

      ctx.success({
        total,
        sys,
        reply,
        forum,
        comment
      });
    } catch (error) {
      console.log(error);
    }
  }

  async updateMessageStatus(ctx, next) {
    try {
      const { id } = ctx.user;
      const { messageType } = ctx.params;
      const { offset = "0", size = "5" } = ctx.request.body;

      const { changeTotal, result } = await userService.updateMessageStatus(
        id,
        messageTypes[messageType.toUpperCase()],
        offset,
        size
      );
      ctx.success({
        messageType: messageTypes[messageType.toUpperCase()],
        dataTotal: result.length,
        pageNo: Number(offset) < Number(size) ? 1 : parseInt(offset / size) + 1,
        pageSize: Number(size),
        pageTotal: Math.ceil(result.length / size),
        changeTotal: changeTotal,
        messageList: result
      });
    } catch (error) {
      console.log(error);
    }
  }

  async setRole(ctx, next) {
    try {
      const { userId } = ctx.request.body;
      const result = await userService.updateRole(userId);
      ctx.success(result, "设置成功");
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new UserController();
