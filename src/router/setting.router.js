const Router = require("koa-router");

const { verifyAuth, verifySuperAdminPower } = require("../middleware/auth.middleware");

const { getSettings, setting } = require("../controller/setting.controller");

const settingRouter = new Router({ prefix: "/settings" });

settingRouter.get("/", getSettings);
settingRouter.post("/set", verifyAuth, verifySuperAdminPower, setting);

module.exports = settingRouter;
