const Router = require("koa-router");

const { verifyAuth } = require("../middleware/auth.middleware");
const {
  avatarHandler,
  pictureHandler,
  pictureResize,
  attachmentrHandler
} = require("../middleware/file.middleware");
const {
  saveAvatarInfo,
  savePictureInfo,
  saveAttachmentInfo
} = require("../controller/file.controller");

const fileRouter = new Router({ prefix: "/upload" });

fileRouter.post("/avatar", verifyAuth, avatarHandler, saveAvatarInfo);
fileRouter.post(
  ["/picture", "/:forumId/picture", "/:forumId/:commentId/picture"],
  verifyAuth,
  pictureHandler,
  pictureResize,
  savePictureInfo
);
fileRouter.post("/:forumId/attachment", verifyAuth, attachmentrHandler, saveAttachmentInfo);

module.exports = fileRouter;
