const errorTypes = require("../constants/error-types");
const messageTypes = require("../constants/message-types");
const service = require("../service/user.service");
const md5password = require("../utils/password-handle");

const verifyUser = async (ctx, next) => {
  // 1. 获取邮箱、用户名和密码
  const { email, username, password } = ctx.request.body;

  // 2. 判断邮箱、用户名和密码不能空
  if (!email || !username || !password) {
    const error = new Error(errorTypes.EMAIL_OR_NAME_OR_PASSWORD_IS_REQUIRED);
    return ctx.app.emit("error", error, ctx);
  }

  // 3. 判断这次注册的用户名、邮箱没有被注册过
  const resultEmail = await service.getUserByEmail(email);
  if (resultEmail.length) {
    const error = new Error(errorTypes.EMAIL_ALREADY_EXISTS);
    return ctx.app.emit("error", error, ctx);
  }

  try {
    const resultName = await service.getUserByName(username);

    if (resultName.length) {
      const error = new Error(errorTypes.USER_ALREADY_EXISTS);
      return ctx.app.emit("error", error, ctx);
    }
    await next();
  } catch (error) {
    console.log(error);
  }
};

const verifyUsername = async (ctx, next) => {
  const { id } = ctx.user;
  const { username } = ctx.request.body;

  if (!username) {
    const error = new Error(errorTypes.NAME_IS_REQUIRED);
    return ctx.app.emit("error", error, ctx);
  }

  const result = await service.getUserByName(username, id);
  if (result.length) {
    const error = new Error(errorTypes.USER_ALREADY_EXISTS);
    return ctx.app.emit("error", error, ctx);
  }

  await next();
};

const handlePassword = async (ctx, next) => {
  ctx.request.body.password = md5password(ctx.request.body.password);

  await next();
};

const verifyEmailFormat = async (ctx, next) => {
  const reg = /^([A-Za-z0-9_\-\.])+\@([A-Za-z0-9_\-\.])+\.([A-Za-z]{2,4})$/;
  const { email } = ctx.request.body;
  if (!reg.test(email)) {
    const error = new Error(errorTypes.EMAIL_IS_INCORRENT);
    return ctx.app.emit("error", error, ctx);
  }

  await next();
};

const verifyEmail = async (ctx, next) => {
  // 1. 获取邮箱和密码
  const { email, password, type } = ctx.request.body;

  // 2. 判断邮箱、用户名和密码不能空
  if (!email || !password) {
    const error = new Error(errorTypes.EMAIL_OR_PASSWORD_IS_REQUIRED);
    return ctx.app.emit("error", error, ctx);
  }

  // 3. 判断这次注册的邮箱被注册过
  const result = await service.getUserByEmail(email);
  if (!result.length) {
    const error = new Error(
      type === 1 ? errorTypes.EMAIL_DOES_NOT_EXISTS : errorTypes.EMAIL_ALREADY_EXISTS
    );
    return ctx.app.emit("error", error, ctx);
  }

  await next();
};

const verifyEmailExist = async (ctx, next) => {
  const { email, type } = ctx.request.body;
  const result = await service.getUserByEmail(email);

  if (type === 0) {
    if (result.length) {
      const error = new Error(errorTypes.EMAIL_ALREADY_EXISTS);
      return ctx.app.emit("error", error, ctx);
    }
  } else if (type === 1 || type === 2) {
    if (!result.length) {
      const error = new Error(errorTypes.EMAIL_DOES_NOT_EXISTS);
      return ctx.app.emit("error", error, ctx);
    }
  }

  await next();
};

const verifyEmailCode = async (ctx, next) => {
  try {
    const { email, code, type } = ctx.request.body;
    let tableName = "";

    if (type === 0) {
      tableName = "register";
    } else if (type === 1 || type === 2) {
      tableName = "user";
    } else {
      const error = new Error(errorTypes.EMAIL_CODE_TYPE_INCORRENT);
      return ctx.app.emit("error", error, ctx);
    }

    const result = await service.getEmailCodeByEmail(email, tableName);

    if (!result.length) {
      const error = new Error(errorTypes.EMAIL_CODE_INCORRENT);
      return ctx.app.emit("error", error, ctx);
    }

    const { email_code, email_code_date } = result[0];
    const nowDate = new Date().getTime();

    if (email_code != code || nowDate - email_code_date.getTime() >= 600000) {
      const error = new Error(errorTypes.EMAIL_CODE_INCORRENT);
      return ctx.app.emit("error", error, ctx);
    }

    await next();
  } catch (err) {
    console.log(err);
  }
};

const verifyUserById = async (ctx, next) => {
  try {
    const { userId } = ctx.params;
    const [isExist] = await service.getUserById(userId);
    if (!isExist) {
      const error = new Error(errorTypes.USER_DOES_NOT_EXISTS);
      return ctx.app.emit("error", error, ctx);
    }
    await next();
  } catch (error) {
    console.log(error);
  }
};

const verifyMessageType = async (ctx, next) => {
  try {
    const { messageType } = ctx.params;
    if (messageTypes[messageType.toUpperCase()] === undefined) {
      const error = new Error();
      return ctx.app.emit("error", error, ctx);
    }
    await next();
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  verifyUser,
  verifyUsername,
  handlePassword,
  verifyEmailFormat,
  verifyEmailCode,
  verifyEmailExist,
  verifyEmail,
  verifyUserById,
  verifyMessageType
};
