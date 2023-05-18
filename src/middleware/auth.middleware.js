const jwt = require("jsonwebtoken");

const errorTypes = require("../constants/error-types");
const userService = require("../service/user.service");
const authService = require("../service/auth.service");
const md5password = require("../utils/password-handle");
const { PUBLIC_KEY } = require("../app/config");

const verifyLogin = async (ctx, next) => {
  console.log("---验证登陆---");

  // 1. 获取用户邮箱和密码
  const { email, password, type } = ctx.request.body;

  // 2. 判断用户邮箱和密码是否为空
  if (!email || !password) {
    const error = new Error(errorTypes.EMAIL_OR_PASSWORD_IS_REQUIRED);
    return ctx.app.emit("error", error, ctx);
  }

  // 3. 判断用户是否存在
  const result = await userService.getUserByEmail(email);
  const user = result[0];
  if (!user) {
    const error = new Error(errorTypes.USER_DOES_NOT_EXISTS);
    return ctx.app.emit("error", error, ctx);
  }

  // 4. 判断密码是否和数据库中的密码是一致的（加密）
  if (md5password(password) != user.password) {
    const error = new Error(errorTypes.PASSWORD_IS_INCORRENT);
    return ctx.app.emit("error", error, ctx);
  }

  // 5. 如果是管理员登录，判断是否具备权限
  if (type === 2 && user.power !== 1 && user.power !== -1) {
    const error = new Error(errorTypes.UNPERMISSION);
    return ctx.app.emit("error", error, ctx);
  }

  ctx.user = user;

  await next();
};

const verifyAuth = async (ctx, next) => {
  console.log("---验证token---");

  // 1. 获取 token
  const authorization = ctx.headers.authorization;
  if (!authorization) {
    const error = new Error(errorTypes.AUTHORIZATION_IS_DUE);
    return ctx.app.emit("error", error, ctx);
  }

  const token = authorization.replace("Bearer ", "");

  // 2. 验证 token (id/email/username/iat/exp)
  try {
    const result = jwt.verify(token, PUBLIC_KEY, {
      algorithms: ["RS256"]
    });
    ctx.user = result;
    await next();
  } catch (err) {
    const error = new Error(errorTypes.UNAUTHORIZATION);
    return ctx.app.emit("error", error, ctx);
  }
};

const verifyPermission = async (ctx, next) => {
  console.log("---验证授权---");

  // 1. 获取参数
  const [resourceKey] = Object.keys(ctx.params);
  const resourceId = ctx.params[resourceKey];
  const tableName = resourceKey.replace("Id", "");
  const { id } = ctx.user;

  // 2. 查询是否具备权限
  try {
    const isPermission = await authService.checkResource(tableName, resourceId, id);
    if (!isPermission) throw new Error();
    await next();
  } catch (err) {
    const error = new Error(errorTypes.UNPERMISSION);
    return ctx.app.emit("error", error, ctx);
  }
};

const verifyAdminPower = async (ctx, next) => {
  console.log("---验证管理员权限---");

  const { id } = ctx.user;

  try {
    const isPermission = await authService.checkAdminPower(id);
    if (!isPermission) throw new Error();
    await next();
  } catch (err) {
    const error = new Error(errorTypes.UNPERMISSION);
    return ctx.app.emit("error", error, ctx);
  }
};

const verifySuperAdminPower = async (ctx, next) => {
  console.log("---验证超级管理员权限---");

  const { id } = ctx.user;
  try {
    const isPermission = await authService.checkSuperAdminPower(id);
    if (!isPermission) throw new Error();
    await next();
  } catch (err) {
    const error = new Error(errorTypes.UNPERMISSION);
    return ctx.app.emit("error", error, ctx);
  }
};

const verifyForumExists = async (ctx, next) => {
  try {
    const forumId = ctx.params.forumId || ctx.request.body.forumId || ctx.query.forumId;
    const { userId } = ctx.query;

    if (!forumId) throw new Error();
    const { status } = await authService.checkForumStatus(forumId);
    const forumInfo = await authService.checkForumExists(forumId, userId, status);
    if (!forumInfo) throw new Error();
    ctx.forum = forumInfo;
    await next();
  } catch (err) {
    const error = new Error(errorTypes.FORUM_IS_INEXISTS);
    return ctx.app.emit("error", error, ctx);
  }
};

const verifyCommentExists = async (ctx, next) => {
  console.log("---验证评论是否存在---");

  const commentId = ctx.params.commentId || ctx.request.body.commentId || ctx.query.commentId;
  if (!commentId) throw new Error();
  try {
    const commentInfo = await authService.checkCommentExists(commentId);
    if (!commentInfo) throw new Error();
    ctx.comment = commentInfo;
    await next();
  } catch (err) {
    const error = new Error(errorTypes.COMMENT_IS_INEXISTS);
    return ctx.app.emit("error", error, ctx);
  }
};

const verifyLikePermission = async (ctx, next) => {
  console.log("---验证点赞权限---");
  const [resourceKey] = Object.keys(ctx.params);
  const resourceId = ctx.params[resourceKey];
  const tableName = resourceKey.replace("Id", "");
  const { id } = ctx.user;

  try {
    const haveLike = await authService.checkHaveLike(tableName, resourceId, id);
    if (haveLike) throw new Error();
    await next();
  } catch (err) {
    const error = new Error(errorTypes.USER_ALREADY_LIKE);
    return ctx.app.emit("error", error, ctx);
  }
};

const verifyStickyTopPermission = async (ctx, next) => {
  console.log("---验证置顶权限---");
  // /:forumId/:commentId/top
  const [resourceKey] = Object.keys(ctx.params);
  const resourceId = ctx.params[resourceKey];
  const tableName = resourceKey.replace("Id", "");
  const { id } = ctx.user;

  try {
    const isPermission = await authService.checkResource(tableName, resourceId, id);
    if (!isPermission) throw new Error();
    await next();
  } catch (err) {
    const error = new Error(errorTypes.UNPERMISSION);
    return ctx.app.emit("error", error, ctx);
  }
};

module.exports = {
  verifyLogin,
  verifyAuth,
  verifyPermission,
  verifyAdminPower,
  verifySuperAdminPower,
  verifyForumExists,
  verifyCommentExists,
  verifyLikePermission,
  verifyStickyTopPermission
};
