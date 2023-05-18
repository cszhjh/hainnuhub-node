const Router = require("koa-router");

const { send } = require("../controller/email.controller");
const { verifyEmailFormat, verifyEmailExist } = require("../middleware/user.middleware");

const emailRouter = new Router();

emailRouter.post("/sendEmailCode", verifyEmailFormat, verifyEmailExist, send);

module.exports = emailRouter;
