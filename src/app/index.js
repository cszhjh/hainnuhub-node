const Koa = require("koa");
const bodyParser = require("koa-bodyparser");
const successHandle = require("./success-handle");
const errorHandler = require("./error-handle");
const useRoutes = require("../router");
// 后端跨域
// const cors = require("koa2-cors");

const app = new Koa();

app.useRoutes = useRoutes;

app.use(bodyParser());
// app.use(cors());
app.use(successHandle());
app.useRoutes();
app.on("error", errorHandler);

module.exports = app;
