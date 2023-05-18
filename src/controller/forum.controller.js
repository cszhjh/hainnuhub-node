const fs = require("fs");

const fileService = require("../service/file.service");
const forumService = require("../service/forum.service");
const userService = require("../service/user.service");
const messageTypes = require("../constants/message-types");
const labelService = require("../service/label.service");
const { PICTURE_PATH, ATTACHMENT_PATH } = require("../constants/file-path");

class ForumController {
  async create(ctx, next) {
    try {
      // 1. 获取数据(user_id, content)
      const userId = ctx.user.id;
      const { title, summary, content, markdownContent, editorType, labels } = ctx.request.body;

      // 2. 将数据插入到数据库
      const { insertId: forumId } = await forumService.create(
        userId,
        title,
        summary,
        content,
        markdownContent,
        editorType
      );

      // 3. 增加标签
      const newLabels = [];
      if (labels) {
        for (let label of labels) {
          let labelId = label?.id;
          let labelName = label?.name;
          if (!(label instanceof Object)) {
            const labelResult = await labelService.create(label);
            labelId = labelResult.insertId;
            labelName = label;
          }
          newLabels.push({ id: labelId, name: labelName });
          await forumService.addLabel(forumId, labelId);
        }
      }
      ctx.success({ forumId, newLabels });
    } catch (error) {
      console.log(error);
    }
  }

  async detail(ctx, next) {
    try {
      // 1. 获取数据(forumId)
      const forumId = ctx.params.forumId;
      const { userId = 0 } = ctx.query;

      // 2. 根据 id 去查询这条数据
      const result = await forumService.getForumById(forumId, userId);
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async list(ctx, next) {
    try {
      // 1. 获取数据
      let { offset = "0", size = "10", labelId = "0", type = "0" } = ctx.query;

      // 2. 查询列表
      const { forumTotal } = await forumService.getForumTotalByLableId(labelId);
      const listResult = await forumService.getForumList(offset, size, labelId, type);

      ctx.success({
        dataTotal: Number(forumTotal),
        pageNo: Number(offset) < Number(size) ? 1 : parseInt(offset / size) + 1,
        pageSize: Number(size),
        pageTotal: Math.ceil(forumTotal / size),
        type: Number(type),
        labelId: Number(labelId),
        forumList: listResult
      });
    } catch (error) {
      console.log(error);
    }
  }

  async fuzzyList(ctx, next) {
    try {
      let {
        offset = "0",
        size = "8",
        labelIds,
        titleFuzzy,
        usernameFuzzy,
        attachmentType,
        status
      } = ctx.query;

      if (labelIds) {
        labelIds = labelIds.split(",");
      }

      // 2. 查询列表
      const { forumTotal } = await forumService.getForumFuzzyTotal(
        labelIds,
        titleFuzzy,
        usernameFuzzy,
        attachmentType,
        status
      );
      const listResult = await forumService.getForumFuzzyList(
        labelIds,
        titleFuzzy,
        usernameFuzzy,
        attachmentType,
        status,
        offset,
        size
      );
      ctx.success({
        dataTotal: Number(forumTotal),
        pageNo: Number(offset) < Number(size) ? 1 : parseInt(offset / size) + 1,
        pageSize: Number(size),
        pageTotal: Math.ceil(forumTotal / size),
        labelIds: labelIds,
        forumList: listResult
      });
    } catch (error) {
      console.log(error);
    }
  }

  async update(ctx, next) {
    try {
      // 1. 获取参数
      const { forumId } = ctx.params;
      const { title, summary, content, markdownContent, editorType, labels } = ctx.request.body;

      // 2. 修改内容
      const result = await forumService.update(
        title,
        summary,
        content,
        markdownContent,
        editorType,
        forumId
      );

      // 3. 删除旧标签
      await forumService.removeLabelsByForumId(forumId);

      // 4. 增加新标签
      const newLabels = [];
      if (labels) {
        for (let label of labels) {
          let labelId = label?.id;
          let labelName = label?.name;
          if (!(label instanceof Object)) {
            const isExist = await labelService.getLabelByName(label);
            if (!isExist) {
              const labelResult = await labelService.create(label);
              labelId = labelResult.insertId;
            }
            labelName = label;
          }
          newLabels.push({ id: labelId, name: labelName });
          await forumService.addLabel(forumId, labelId);
        }
      }

      ctx.success({ forumId, newLabels });
    } catch (error) {
      console.log(error);
    }
  }
  async remove(ctx, next) {
    try {
      // 获取参数
      const { forumId } = ctx.params;

      // 2. 删除内容
      const result = await forumService.remove(forumId);

      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async incrementReadCount(ctx, next) {
    try {
      const { forumId } = ctx.params;

      const result = await forumService.incrementReadCount(forumId);

      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async incrementLikeCount(ctx, next) {
    try {
      const { forumId } = ctx.params;
      const { id, username } = ctx.user;
      const { user_id: authorId, title } = ctx.forum;

      const [result] = await forumService.incrementLikeCount(forumId, id);

      await userService.createMessage(
        authorId,
        forumId,
        title,
        null,
        id,
        username,
        messageTypes.FORUM,
        null
      );

      ctx.success(result, "点赞成功！");
    } catch (error) {
      console.log(error);
    }
  }

  async fileInfo(ctx, next) {
    try {
      let { filename } = ctx.params;
      const result = await fileService.getFileByFilename(filename);
      const { type } = ctx.query;
      const types = ["small", "middle", "large"];

      if (types.some(item => item === type)) {
        filename = filename + "-" + type;
      }

      ctx.response.set("content-type", result.mimetype);
      ctx.body = fs.createReadStream(`${PICTURE_PATH}/${filename}`);
    } catch (error) {
      console.log(error);
    }
  }

  async attachmentInfo(ctx, next) {
    try {
      const { forumId } = ctx.params;
      const attachmentInfo = await fileService.getAttachmentByForumId(forumId);
      ctx.success(attachmentInfo);
    } catch (error) {
      console.log(error);
    }
  }

  async attachmentDownload(ctx, next) {
    try {
      const { forumId } = ctx.params;
      const attachmentInfo = await fileService.getAttachmentByForumId(forumId);

      let result = {};
      // 2. 提供文件信息
      if (attachmentInfo) {
        ctx.response.set("content-type", attachmentInfo.mimetype);
        result = fs.createReadStream(`${ATTACHMENT_PATH}/${attachmentInfo.filename}`);
        ctx.body = result;
      } else {
        ctx.app.emit("error", new Error(), ctx);
      }
    } catch (error) {
      console.log(error);
    }
  }

  async incrementDownLoadCount(ctx, next) {
    try {
      const { forumId } = ctx.params;

      const result = await forumService.incrementDownLoadCount(forumId);

      ctx.success(result, "下载次数增加成功！");
    } catch (error) {
      console.log(error);
    }
  }

  async updateLabel(ctx, next) {
    try {
      const { forumId } = ctx.params;
      const { labels } = ctx.request.body;

      await forumService.removeLabelsByForumId(forumId);

      const newLabels = [];
      if (labels) {
        for (let label of labels) {
          let labelId = label?.id;
          let labelName = label?.name;
          if (!(label instanceof Object)) {
            const isExist = await labelService.getLabelByName(label);
            if (!isExist) {
              const labelResult = await labelService.create(label);
              labelId = labelResult.insertId;
            }
            labelName = label;
          }
          newLabels.push({ id: labelId, name: labelName });
          await forumService.addLabel(forumId, labelId);
        }
      }

      ctx.success(newLabels, "修改成功！");
    } catch (error) {
      console.log(error);
    }
  }

  async audit(ctx, next) {
    const { forumIds, status = 0 } = ctx.request.body;

    try {
      const result = await forumService.audit(forumIds, status);
      ctx.success(result, "审核成功！");
    } catch (error) {
      console.log(error);
    }
  }

  async search(ctx, next) {
    try {
      const { keywords } = ctx.query;
      const result = await forumService.search(keywords);
      ctx.success({
        dataTotal: result.length,
        forumList: result
      });
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new ForumController();
