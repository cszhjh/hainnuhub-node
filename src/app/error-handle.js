const errorTypes = require("../constants/error-types");

const errorHandler = (error, ctx) => {
  let status, message;

  switch (error.message) {
    case errorTypes.NAME_IS_REQUIRED:
      status = 400; //Bad Request
      message = "用户名不能为空！";
      break;
    case errorTypes.EMAIL_OR_PASSWORD_IS_REQUIRED:
      status = 400; //Bad Request
      message = "邮箱或密码不能为空！";
      break;
    case errorTypes.EMAIL_OR_NAME_OR_PASSWORD_IS_REQUIRED:
      status = 400; //Bad Request
      message = "邮箱、用户名或密码不能为空！";
      break;
    case errorTypes.USER_ALREADY_EXISTS:
      status = 409; //Conflict
      message = "用户名已存在！";
      break;
    case errorTypes.EMAIL_ALREADY_EXISTS:
      status = 409; //Conflict
      message = "邮箱已被注册过！";
      break;
    case errorTypes.USER_DOES_NOT_EXISTS:
      status = 400; //Bad Request
      message = "用户名不存在！";
      break;
    case errorTypes.EMAIL_DOES_NOT_EXISTS:
      status = 400; //Bad Request
      message = "邮箱地址不存在！";
      break;
    case errorTypes.PASSWORD_IS_INCORRENT:
      status = 400; //Bad Request
      message = "密码输入错误，请重试！";
      break;
    case errorTypes.UNAUTHORIZATION:
      status = 401; //Unauthorized
      message = "登录已过期，请重新登录！";
      break;
    case errorTypes.AUTHORIZATION_IS_DUE:
      status = 401; //Unauthorized
      message = "你还没有登录，请先登录！";
      break;
    case errorTypes.UNPERMISSION:
      status = 403; //Forbidden
      message = "你没有操作的权限，请联系管理员！";
      break;
    case errorTypes.EMAIL_IS_INCORRENT:
      status = 400; //Bad Request
      message = "邮箱格式错误，请检查后重新输入！";
      break;
    case errorTypes.EMAIL_CODE_INCORRENT:
      status = 400; //Bad Request
      message = "验证码错误或已失效！";
      break;
    case errorTypes.EMAIL_CODE_TYPE_INCORRENT:
      status = 400; //Bad Request
      message = "获取邮箱验证码类型错误！";
      break;
    case errorTypes.FORUM_IS_INEXISTS:
      status = 404;
      message = "找不到这篇文章，看看其他文章吧！";
      break;
    case errorTypes.USER_ALREADY_LIKE:
      status = 403; //Forbidden
      message = "你已经点过赞了，不能重复点赞哦！";
      break;
    case errorTypes.COMMENT_IS_INEXISTS:
      status = 404; //Bad Request
      message = "回复的评论不见啦！";
      break;
    case errorTypes.COMMENT_CONTENT_IS_REQUIRED:
      status = 400; //Bad Request
      message = "你还没有评论，说点什么吧！";
      break;
    case errorTypes.PICTURE_UPLOAD_FAILD:
      status = 422; //Unprocessable Entity
      message = "图片上传失败！";
      break;
    default:
      status = 404;
      message = "NOT FOUND";
  }

  ctx.status = status;
  ctx.body = {
    status,
    message,
    data: {}
  };
};

module.exports = errorHandler;
