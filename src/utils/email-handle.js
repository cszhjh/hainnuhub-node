const nodemailer = require("nodemailer");
const { USER, PASS } = require("../constants/mail-info");
const service = require("../service/setting.service");

const transporter = nodemailer.createTransport({
  host: "smtp.163.com",
  secureConnection: true,
  port: 465,
  auth: {
    user: USER,
    pass: PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const createCode = () => {
  const baseCode = "1234567890";
  let emailCode = "";
  for (let i = 0; i < 6; i++) {
    emailCode += baseCode.charAt(Math.floor(Math.random() * baseCode.length));
  }
  return emailCode;
};

const sendEmail = async email => {
  let newCode = createCode();

  const result = await service.getSettings();

  const emailOptions = {
    from: USER,
    to: email,
    subject: result.emailTitle,
    html: result.emailContent.replace("%s", newCode)
  };
  transporter.sendMail(emailOptions);
  return newCode;
};

module.exports = sendEmail;
