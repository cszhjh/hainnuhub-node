const Router = require("koa-router");

const {
  verifyAuth,
  verifyPermission,
  verifyForumExists,
  verifyCommentExists,
  verifyLikePermission,
  verifyAdminPower
} = require("../middleware/auth.middleware");
const { verifyContent } = require("../middleware/comment.middleware");
const {
  create,
  reply,
  update,
  remove,
  list,
  fuzzyList,
  incrementLikeCount,
  updateTopType
} = require("../controller/comment.controller");

const commentRouter = new Router({ prefix: "/comment" });

commentRouter.post("/", verifyAuth, verifyForumExists, verifyContent, create);
commentRouter.post(
  "/:commentId/reply",
  verifyAuth,
  verifyForumExists,
  verifyCommentExists,
  verifyContent,
  reply
);
commentRouter.patch(
  "/:commentId",
  verifyAuth,
  verifyForumExists,
  verifyContent,
  verifyContent,
  verifyPermission,
  update
);
commentRouter.delete("/", verifyAuth, verifyAdminPower, remove);
commentRouter.get("/", list);
commentRouter.get("/fuzzy", fuzzyList);
commentRouter.post(
  "/:commentId/dolike",
  verifyAuth,
  verifyForumExists,
  verifyLikePermission,
  verifyCommentExists,
  incrementLikeCount
);
commentRouter.patch(
  "/:forumId/:commentId/top",
  verifyAuth,
  verifyForumExists,
  verifyCommentExists,
  verifyPermission,
  updateTopType
);

module.exports = commentRouter;
