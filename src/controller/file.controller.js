const fileService = require("../service/file.service");
const userService = require("../service/user.service");
const { APP_HOST, APP_PORT } = require("../app/config");

class FileController {
  async saveAvatarInfo(ctx, next) {
    // 1. 获取图像相关信息
    const { filename, mimetype, size } = ctx.req.file;
    const { id } = ctx.user;

    try {
      // 2. 将图像数据保存到数据库中
      const result = await fileService.createAvatar(filename, mimetype, size, id);

      // 3. 返回数据
      ctx.success(result, "上传头像成功");
    } catch (error) {
      console.log(error);
    }
  }

  async savePictureInfo(ctx, next) {
    try {
      // 1. 获取图像信息
      const files = ctx.req.files;
      const { id } = ctx.user;
      const { forumId, commentId } = ctx.params;
      const { cover } = ctx.query;
      const result = [];

      // 2. 将所有文件信息保存到数据库中
      for (let file of files) {
        const { filename, mimetype, size } = file;
        const res = await fileService.createFile(
          filename,
          mimetype,
          size,
          id,
          forumId,
          commentId,
          cover
        );
        const { image } = await fileService.getFileURLById(res.insertId);
        result.push(image);
      }
      ctx.success(result, "图片上传完成");
    } catch (error) {
      console.log(error);
    }
  }

  async saveAttachmentInfo(ctx, next) {
    // 1. 获取图像相关信息
    try {
      const { filename, mimetype, size } = ctx.req.file;
      const { forumId } = ctx.params;

      // 2. 将图像数据保存到数据库中
      const result = await fileService.createAttachment(filename, mimetype, size, forumId);

      // 3. 返回数据
      ctx.success(result, "上传附件成功");
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new FileController();
