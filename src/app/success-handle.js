const successHandle = (option = {}) => {
  return async (ctx, next) => {
    ctx.success = (data, message = "请求成功", type) => {
      ctx.type = type || option.type || "json";
      ctx.body = {
        status: option.code || 200,
        message: option.message || message,
        data
      };
    };
    await next();
  };
};

module.exports = successHandle;
