const Router = require("koa-router");

const { login, success, logout, sendSystemMessage } = require("../controller/auth.controller");
const { verifyLogin, verifyAuth, verifyAdminPower } = require("../middleware/auth.middleware");
const { verifyEmail, verifyEmailCode } = require("../middleware/user.middleware");

const authRouter = new Router();

authRouter.post("/login", verifyLogin, login);
authRouter.post("/admin/login", verifyEmail, verifyEmailCode, verifyLogin, login);
authRouter.post("/logout", verifyAuth, logout);
authRouter.get("/test", verifyAuth, success);
authRouter.post("/system/:receivedUserId", verifyAuth, verifyAdminPower, sendSystemMessage);

module.exports = authRouter;
