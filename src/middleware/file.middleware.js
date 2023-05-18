const path = require("path");

const Multer = require("koa-multer");
const Jimp = require("jimp");
const getQueryString = require("../utils/url-query-handle");

const { AVATAR_PATH, PICTURE_PATH, ATTACHMENT_PATH } = require("../constants/file-path");
const errorTypes = require("../constants/error-types");

// 用户头像
const avatarUpload = Multer({
  storage: Multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, AVATAR_PATH);
    },
    filename: (req, file, cb) => {
      const type = path.extname(file.originalname);
      cb(null, decodeURI(file.originalname + "·.-@-.·" + Date.now().toString(16) + type));
    }
  })
});
const avatarHandler = avatarUpload.single("avatar");

// 文章/评论配图
const randomNumber = () => {
  const baseCode = "1234567890";
  let number = "";
  for (let i = 0; i < 6; i++) {
    number += baseCode.charAt(Math.floor(Math.random() * baseCode.length));
  }
  return number.toString();
};
const pictureUpload = Multer({
  storage: Multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, PICTURE_PATH);
    },
    filename: (req, file, cb) => {
      const type = path.extname(file.originalname);
      cb(
        null,
        decodeURI(file.originalname + "·.-@-.·" + Date.now().toString(16) + randomNumber() + type)
      );
    }
  })
});
const pictureHandler = pictureUpload.array("picture", 9);

// 文章附件
const fileFilter = (req, file, cb) => {
  file.originalname = getQueryString(req._parsedUrl.search, "filename");
  cb(null, file.originalname);
};
const storage = Multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, ATTACHMENT_PATH);
  },
  filename: (req, file, cb) => {
    const type = path.extname(file.originalname);
    cb(null, decodeURI(file.originalname + "·.-@-.·" + Date.now().toString(16) + type));
  }
});
const attachmentUpload = Multer({
  fileFilter,
  storage
});
const attachmentrHandler = attachmentUpload.single("attachment");

// 图片处理
const pictureResize = async (ctx, next) => {
  try {
    // 1. 获取所有的图像信息
    const files = ctx.req.files;

    // 2. 处理图像
    for (let file of files) {
      const destPath = path.join(file.destination, file.filename);
      Jimp.read(file.path)
        .then(image => {
          image.resize(1280, Jimp.AUTO).write(`${destPath}-large`);
          image.resize(640, Jimp.AUTO).write(`${destPath}-middle`);
          image.resize(320, Jimp.AUTO).write(`${destPath}-small`);
        })
        .catch(error => {
          console.log(error);
        });
    }

    await next();
  } catch (err) {
    const error = new Error(errorTypes.PICTURE_UPLOAD_FAILD);
    return ctx.app.emit("error", error, ctx);
  }
};

module.exports = {
  avatarHandler,
  pictureHandler,
  pictureResize,
  attachmentrHandler
};
