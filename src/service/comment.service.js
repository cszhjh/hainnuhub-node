const connection = require("../app/database");

class CommentService {
  async create(forumId, content, userId) {
    const statement = `INSERT INTO comment (content, forum_id, user_id) VALUES (?, ?, ?);`;
    const [result] = await connection.execute(statement, [content, forumId, userId]);
    return result;
  }

  async reply(forumId, content, userId, commentId) {
    const statement = `
      INSERT INTO
      comment(content, forum_id, user_id, comment_id, reply_user_id, reply_username)
      SELECT 
        ? content, ? forum_id, ? user_id, ? comment_id, 
        IF(? IS NOT NULL, u.id, NULL) reply_user_id,
        IF(? IS NOT NULL, u.username, NULL) reply_username
      FROM comment c
      JOIN user u ON c.id = ? AND c.user_id = u.id; 
    `;
    const [result] = await connection.execute(statement, [
      content,
      forumId,
      userId,
      commentId,
      commentId,
      commentId,
      commentId
    ]);
    return result;
  }

  async update(commentId, content) {
    const statement = `UPDATE comment SET content = ? WHERE id = ?;`;
    const [result] = await connection.execute(statement, [content, commentId]);
    return result;
  }

  async remove(commentIds) {
    const statement = `DELETE FROM comment WHERE id IN (${commentIds});`;
    const [result] = await connection.execute(statement);
    return result;
  }

  async getCommentsByForumId(userId, forumId, type) {
    const statement = `
      SELECT
        c.id, c.content, c.forum_id forumId, c.comment_id commentId, c.reply_user_id replyUserId,
        c.reply_username replyUsername, c.good_count goodCount, c.top_type topType, 
        c.createAt createTime, c.updateAt updateTime,
        IF(c.id in (SELECT comment_id id FROM comment_good WHERE user_id = ?), 1, 0) haveLike,
        JSON_OBJECT("id", u.id, "username", u.username) user,
        (SELECT 
          JSON_ARRAYAGG(CONCAT("${APP_HOST}:${APP_PORT}/forum/images/", file.filename))
        FROM file WHERE file.forum_id = ? AND c.id = file.comment_id
        ) images
      FROM comment c
      LEFT JOIN user u ON u.id = c.user_id
      WHERE forum_id = ?
      ${
        type == 0
          ? `ORDER BY c.top_type DESC, c.comment_id, c.good_count DESC`
          : `ORDER BY c.top_type DESC, c.comment_id, c.createAt DESC`
      };
    `;
    const [result] = await connection.execute(statement, [userId, forumId, forumId]);
    return result;
  }

  async getCommentsFuzzyList(offset, size, contentFuzzy, usernameFuzzy) {
    const statement = `
      SELECT
        c.id, c.content, c.forum_id forumId, c.comment_id commentId, c.reply_user_id replyUserId,
        c.reply_username replyUsername, c.good_count goodCount, c.top_type topType, 
        c.createAt createTime, c.updateAt updateTime,
        IF(c.comment_id, 1, 0) commentType,
        JSON_OBJECT("id", u.id, "username", u.username) user,
        (SELECT 
          JSON_ARRAYAGG(CONCAT("${APP_HOST}:${APP_PORT}/forum/images/", file.filename))
        FROM file WHERE file.forum_id = c.forum_id AND c.id = file.comment_id
        ) images
      FROM comment c
      LEFT JOIN user u ON u.id = c.user_id
      WHERE TRUE
      ${contentFuzzy ? ` AND LOCATE("${contentFuzzy}", c.content)` : ""}
      ${usernameFuzzy ? ` AND LOCATE("${usernameFuzzy}", u.username)` : ""}
      ORDER BY c.createAt DESC
      limit ?, ?;
    `;
    const [result] = await connection.execute(statement, [offset, size]);
    return result;
  }

  async getCommentsTotalByForumId(forumId) {
    const statement = `
      SELECT COUNT(*) commentCount
      FROM comment
      WHERE forum_id = ?;
    `;
    const [result] = await connection.execute(statement, [forumId]);
    return result[0];
  }

  async getCommentsFuzzyTotal(contentFuzzy, usernameFuzzy) {
    const statement = `
      SELECT count(*) commentTotal
      FROM comment c
      LEFT JOIN user u ON c.user_id = u.id
      WHERE TRUE
      ${contentFuzzy ? ` AND LOCATE("${contentFuzzy}", c.content)` : ""}
      ${usernameFuzzy ? ` AND LOCATE("${usernameFuzzy}", u.username)` : ""}
    `;
    const [result] = await connection.execute(statement);
    return result[0];
  }

  async getCommentByCommentId(commentId) {
    const statement = `
      SELECT
        c.id, c.content, c.forum_id forumId, c.comment_id commentId, c.reply_user_id replyUserId, 
        c.reply_username replyUsername, c.good_count goodCount, c.top_type topType, 
        c.createAt createTime, c.updateAt updateTime,
        JSON_OBJECT("id", u.id, "username", u.username) user
      FROM comment c
      LEFT JOIN user u ON u.id = c.user_id
      WHERE c.id = ?;
    `;
    const [result] = await connection.execute(statement, [commentId]);
    return result;
  }

  async incrementLikeCount(commentId, userId) {
    let statement = `UPDATE comment SET good_count = good_count + 1 WHERE id = ?;`;
    await connection.execute(statement, [commentId]);
    statement = `INSERT INTO comment_good (comment_id, user_id) VALUES (?, ?);`;
    const [result] = await connection.execute(statement, [commentId, userId]);
    return result;
  }

  async updateTopType(commentId, type) {
    const statement = `UPDATE comment SET top_type = ? WHERE id = ?`;
    const [result] = await connection.execute(statement, [type, commentId]);
    return result;
  }
}

module.exports = new CommentService();
