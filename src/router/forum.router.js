const Router = require("koa-router");

const {
  create,
  detail,
  list,
  update,
  remove,
  fileInfo,
  attachmentInfo,
  attachmentDownload,
  incrementDownLoadCount,
  incrementReadCount,
  incrementLikeCount,
  fuzzyList,
  updateLabel,
  audit,
  search
} = require("../controller/forum.controller");

const {
  verifyAuth,
  verifyPermission,
  verifyAdminPower,
  verifyLikePermission,
  verifyForumExists
} = require("../middleware/auth.middleware");

const forumRouter = new Router({ prefix: "/forum" });

forumRouter.post("/", verifyAuth, create);
forumRouter.get("/", list);
forumRouter.get("/fuzzy", fuzzyList);
forumRouter.get("/search", search);
forumRouter.get("/:forumId", verifyForumExists, detail);
forumRouter.patch("/:forumId", verifyAuth, verifyPermission, update);
forumRouter.delete("/:forumId", verifyAuth, verifyPermission, remove);
forumRouter.post("/:forumId/read", incrementReadCount);
forumRouter.post(
  "/:forumId/dolike",
  verifyAuth,
  verifyForumExists,
  verifyLikePermission,
  incrementLikeCount
);
forumRouter.post("/:forumId/labels", verifyAuth, verifyPermission, updateLabel);

// 动态配图
forumRouter.get("/images/:filename", fileInfo);

// 附件
forumRouter.get("/attachment/:forumId", attachmentInfo);
forumRouter.get("/attachment/download/:forumId", attachmentDownload);
forumRouter.post("/attachment/downloadCount/:forumId", verifyAuth, incrementDownLoadCount);

// 批量审核
forumRouter.post("/audit", verifyAuth, verifyAdminPower, audit);

module.exports = forumRouter;
