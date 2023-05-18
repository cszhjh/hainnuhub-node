const Router = require("koa-router");

const {
  create,
  update,
  updatePassword,
  avatarInfo,
  getUserInfo,
  getUserForumInfo,
  getMessageCount,
  updateMessageStatus,
  listFuzzy,
  setRole
} = require("../controller/user.controller");
const {
  verifyUser,
  verifyUsername,
  handlePassword,
  verifyEmailFormat,
  verifyEmailCode,
  verifyEmail,
  verifyUserById,
  verifyMessageType
} = require("../middleware/user.middleware");
const { verifyAuth, verifySuperAdminPower } = require("../middleware/auth.middleware");

const userRouter = new Router({ prefix: "/users" });

userRouter.post("/", verifyEmailFormat, verifyUser, verifyEmailCode, handlePassword, create);
userRouter.patch("/update", verifyAuth, verifyUsername, update);
userRouter.patch(
  "/forgot",
  verifyEmailFormat,
  verifyEmail,
  verifyEmailCode,
  handlePassword,
  updatePassword
);
userRouter.get("/:userId/avatar", avatarInfo);
userRouter.get("/:userId/info", verifyUserById, getUserInfo);
userRouter.get("/:userId/forum", verifyUserById, getUserForumInfo);
userRouter.get("/message", verifyAuth, getMessageCount);
userRouter.patch("/message/:messageType", verifyAuth, verifyMessageType, updateMessageStatus);
userRouter.get("/list", listFuzzy);
userRouter.post("/role", verifyAuth, verifySuperAdminPower, setRole);

module.exports = userRouter;
