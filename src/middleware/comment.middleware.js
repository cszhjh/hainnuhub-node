const errorTypes = require("../constants/error-types");

const verifyContent = async (ctx, next) => {
  const { content } = ctx.request.body;

  if (!content) {
    const error = new Error(errorTypes.COMMENT_CONTENT_IS_REQUIRED);
    return ctx.app.emit("error", error, ctx);
  }

  await next();
};

module.exports = {
  verifyContent
};
