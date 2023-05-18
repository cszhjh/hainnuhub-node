const connection = require("../app/database");
const { APP_HOST, APP_PORT } = require("../app/config");
const messageTypes = require("../constants/message-types");

const forumStatement = `
SELECT DISTINCT
  f.id id, f.title title, f.summary summary, f.read_count readCount, f.status status, f.good_count goodCount, f.createAt createTime, f.updateAt updateTime,
  JSON_OBJECT("id", u.id, "username", u.username) author,
  (SELECT COUNT(*) FROM comment c WHERE c.forum_id = f.id) commentCount,
  (SELECT COUNT(*) FROM forum_label fl WHERE fl.forum_id = f.id) labelCount,
  (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", lt.id, "name", lt.name))
    FROM forum_label flt
    LEFT JOIN label lt ON flt.label_id = lt.id
    WHERE flt.forum_id = f.id
  ) labels,
  (SELECT 
    CONCAT("${APP_HOST}:${APP_PORT}/forum/images/", file.filename)
  FROM file WHERE f.id = file.forum_id AND cover = 1
  ) cover
FROM forum f
LEFT JOIN user u ON f.user_id = u.id
`;

class UserService {
  async create(user) {
    const { email, username, password } = user;
    const statement = `INSERT INTO user (email, username, password) VALUES (?, ?, ?);`;
    const [result] = await connection.execute(statement, [email, username, password]);

    // 给予默认头像
    const defaultAvatarStatement = `
      INSERT INTO avatar(filename, mimetype, size, user_id)
      SELECT
	      filename, mimetype, size, ? as user_id
      FROM avatar
      WHERE id = 1;
    `;
    await connection.execute(defaultAvatarStatement, [result.insertId]);

    // 将 user 存储到数据库中
    return result;
  }

  async updateUsernameByUserId(username, sex, description, userId, power) {
    const statement = `
      UPDATE user SET
        username = ?, sex = ?, description = ? ${power ? `, power = ${power}` : ""}
        WHERE id = ?;`;
    const result = await connection.execute(statement, [username, sex, description, userId]);
    return result[0];
  }

  async updatePasswordByEmail(user) {
    const { email, password } = user;
    const statement = `UPDATE user SET password = ? WHERE email = ?;`;
    const result = await connection.execute(statement, [password, email]);
    return result[0];
  }

  async getUserByName(username, id = null) {
    const statment = `SELECT * FROM user WHERE username = ? AND id != ?`;
    const result = await connection.execute(statment, [username, id]);
    return result[0];
  }

  async getUserByEmail(email) {
    const statment = `SELECT * FROM user WHERE email = ?;`;
    const result = await connection.execute(statment, [email]);
    return result[0];
  }

  async getUserById(userId) {
    const statement = `SELECT * FROM user WHERE id = ?;`;
    const result = await connection.execute(statement, [userId]);
    return result[0];
  }

  async updateEmailCodeByEmail(email, code) {
    const statement = `UPDATE user SET email_code = ? WHERE email = ?;`;
    const result = await connection.execute(statement, [code, email]);
    return result[0];
  }

  async getEmailCodeByEmail(email, tableName) {
    const statement = `SELECT email_code, email_code_date FROM ${tableName} WHERE email = ?;`;
    const result = await connection.execute(statement, [email]);
    return result[0];
  }

  async insertEmailCodeByEmail(email, code) {
    const statement = `insert into register(email, email_code) VALUES(?, ?) ON DUPLICATE KEY UPDATE email_code = VALUES(email_code);`;
    const result = await connection.execute(statement, [email, code]);
    return result[0];
  }

  async deleteEmailCodeByMain(email, tableName) {
    let statement = ``;
    if (tableName === "register") {
      statement = `DELETE FROM register WHERE email = ?;`;
    } else if (tableName === "user") {
      statement = `UPDATE user SET email_code = NULL, email_code_date = NULL WHERE email = ?;`;
    }
    const result = await connection.execute(statement, [email]);
    return result[0];
  }

  async getUserInfo(userId) {
    const statement = `
      SELECT
        u.id id, u.email email, u.username username, u.sex sex, u.description description,
        power, count(f.id) postCount,
        sum(f.good_count) likeCount,
        u.last_login_time lastLoginTime, u.createAt createTime, u.updateAt updateTime
      FROM user u
      LEFT JOIN forum f ON f.user_id = u.id
      WHERE u.id = ?
      GROUP BY u.id
    `;
    const [result] = await connection.execute(statement, [userId]);
    return result[0];
  }

  async getUserListFuzzy(offset, size, usernameFuzzy, sex, power) {
    const statement = `
      SELECT
        id, email, username, sex, description, power, 
        last_login_time lastLoginTime, createAt createTime, updateAt updateTime
      FROM user
      WHERE TRUE
      ${sex ? ` AND sex = "${sex}"` : ""}
      ${power ? ` AND power = ${power}` : ""}
      ${usernameFuzzy ? ` AND LOCATE("${usernameFuzzy}", username)` : ""}
      limit ?, ?
    `;
    const [result] = await connection.execute(statement, [offset, size]);
    return result;
  }

  async getUserListTotal(usernameFuzzy, sex, power) {
    const statement = `
      SELECT COUNT(*) userTotal
      FROM user
      WHERE TRUE
      ${sex ? ` AND sex = "${sex}"` : ""}
      ${power ? ` AND power = ${power}` : ""}
      ${usernameFuzzy ? ` AND LOCATE("${usernameFuzzy}", username)` : ""}
    `;
    const [result] = await connection.execute(statement);
    return result[0];
  }

  async getUserForumInfo(userId, currentUserId, type) {
    let statement = ``;
    if (type == 0) {
      statement = `WHERE f.user_id = ?`;
      if (userId !== currentUserId) {
        statement += ` AND status = 1`;
      }
    } else if (type == 1) {
      statement = `INNER JOIN comment c ON f.id = c.forum_id AND c.user_id = ?`;
    } else if (type == 2) {
      statement = `INNER JOIN forum_good fg ON f.id = fg.forum_id AND fg.user_id = ?`;
    }
    const orderByStatement = ` ORDER BY f.createAt DESC;`;
    const [result] = await connection.execute(forumStatement + statement + orderByStatement, [
      userId
    ]);
    return result;
  }

  async createMessage(
    receivedUserId,
    forumId,
    title,
    commentId,
    sendUserId,
    sendUsername,
    type,
    content
  ) {
    if (receivedUserId === sendUserId && type !== messageTypes.SYS) {
      return;
    }

    const statement = `
      INSERT INTO user_message
        (received_user_id, forum_id, forum_title, comment_id, send_user_id, send_username, message_type, message_content)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?);
    `;
    const [result] = await connection.execute(statement, [
      receivedUserId,
      forumId,
      title,
      commentId,
      sendUserId,
      sendUsername,
      type,
      content
    ]);

    return result;
  }

  async getMessageCount(id) {
    const statement = `
      SELECT message_type messageType, count(1) total
        FROM user_message
        WHERE received_user_id = ? AND status = 0
        GROUP BY message_type;
      `;
    const [result] = await connection.execute(statement, [id]);
    return result;
  }

  async updateMessageStatus(id, type, offset, size) {
    let statement = `
      UPDATE user_message
      SET status = 1
      WHERE id in (SELECT id FROM (
        SELECT id 
        FROM user_message 
        WHERE received_user_id = ? AND message_type = ?
        ORDER BY id DESC LIMIT ?, ?) mt
      )
    `;
    const [updateResult] = await connection.execute(statement, [id, type, offset + "", size + ""]);
    statement = `
      SELECT um.id, um.forum_id forumId, um.forum_title forumTitle, um.comment_id commentId, um.send_user_id sendUserId, 
        um.send_username sendUsername, um.message_type messageType, um.message_content messageContent, 
        c.content originCommentContent, um.createAt createTime, um.updateAt updateTime
      FROM user_message um
      LEFT JOIN comment c ON c.id = um.comment_id
      WHERE um.received_user_id = ? AND um.message_type = ?
      ORDER BY um.createAt DESC
    `;
    const [result] = await connection.execute(statement, [id, type]);
    return {
      changeTotal: updateResult.changedRows,
      result
    };
  }

  async updateLastLoginTime(id) {
    const statement = `UPDATE user SET last_login_time = ? WHERE id = ?;`;
    const [result] = await connection.execute(statement, [new Date(), id]);
    return result;
  }

  async updateRole(userId) {
    const statement = `UPDATE user SET power = 1 WHERE id = ? AND power != -1;`;
    const [result] = await connection.execute(statement, [userId]);
    return result;
  }
}

module.exports = new UserService();
