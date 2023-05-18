const connection = require("../app/database");

class FileService {
  async createAvatar(filename, mimetype, size, userId, cover) {
    const statement = `
      INSERT INTO avatar(user_id, filename, mimetype, size)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        filename = VALUES(filename),
        mimetype = VALUES(mimetype),
        size = VALUES(size);
    `;
    const [result] = await connection.execute(statement, [userId, filename, mimetype, size]);
    return result;
  }

  async getAvatarByUserId(userId) {
    const statement = `SELECT * FROM avatar WHERE user_id = ?;`;
    const [result] = await connection.execute(statement, [userId]);
    return result[0];
  }

  async createFile(filename, mimetype, size, userId, forumId = null, commentId = null, cover = 0) {
    let statement = ``;

    if (forumId && cover == 1) {
      statement = `DELETE FROM file WHERE user_id = ? AND forum_id = ? AND cover = 1`;
      await connection.execute(statement, [userId, forumId]);
    }
    statement = `
      INSERT INTO file (filename, mimetype, size, user_id, forum_id, comment_id, cover)
      VALUES (?, ?, ?, ?, ?, ?, ?);`;
    const [result] = await connection.execute(statement, [
      filename,
      mimetype,
      size,
      userId,
      forumId,
      commentId,
      cover
    ]);
    return result;
  }

  async createAttachment(filename, mimetype, size, forumId) {
    const statement = `
      INSERT INTO attachment(filename, mimetype, size, forum_id)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
        filename = VALUES(filename), 
        mimetype = VALUES(mimetype),
        size = VALUES(size),
        forum_id = VALUES(forum_id);
    `;
    const [result] = await connection.execute(statement, [filename, mimetype, size, forumId]);
    return result;
  }

  async getFileByFilename(filename) {
    const statement = `SELECT * FROM file WHERE filename = ?;`;
    const [result] = await connection.execute(statement, [filename]);
    return result[0];
  }

  async getFileByFilename(filename) {
    const statement = `SELECT * FROM file WHERE filename = ?;`;
    const [result] = await connection.execute(statement, [filename]);
    return result[0];
  }

  async getFileURLById(fileId) {
    const statement = `SELECT CONCAT("${APP_HOST}:${APP_PORT}/forum/images/", file.filename) image FROM file WHERE id = ?;`;
    const [result] = await connection.execute(statement, [fileId]);
    return result[0];
  }

  async getAttachmentByForumId(forumId) {
    const statement = `SELECT id, filename, mimetype, size, forum_id forumId, download_count downloadCount, 
                        createAt createTime, updateAt updateTime FROM attachment WHERE forum_id = ?;`;
    const [result] = await connection.execute(statement, [forumId]);
    return result[0];
  }
}

module.exports = new FileService();
