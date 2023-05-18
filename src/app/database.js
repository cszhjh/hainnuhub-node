const mysql = require("mysql2");
const config = require("./config");

const connections = mysql.createPool({
  host: config.MYSQL_HOST, // 服务器地址
  port: config.MYSQL_PORT, // 服务器端口
  database: config.MYSQL_DATABASE, // 数据库名
  user: config.MYSQL_USER, // 用户名
  password: config.MYSQL_PASSWORD // 密码
});

connections.getConnection((err, conn) => {
  conn.connect(err => {
    if (err) {
      console.log("数据库连接失败");
    } else {
      console.log("数据库连接成功");
    }
  });
});

module.exports = connections.promise();
