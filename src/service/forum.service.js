const connection = require("../app/database");
const { APP_HOST, APP_PORT } = require("../app/config");

class ForumService {
  async create(userId, title, summary, content, markdownContent, editorType) {
    const statement = `INSERT INTO forum (title, summary, content, markdown_content, user_id, editor_type) VALUES (?, ?, ?, ?, ?, ?);`;
    const [result] = await connection.execute(statement, [
      title,
      summary,
      content,
      markdownContent,
      userId,
      Number(editorType)
    ]);
    return result;
  }

  async getForumById(forumId, userId) {
    const statement = `
      SELECT
        f.id id, f.title title, f.summary summary, f.content content, f.markdown_content markdownContent,
        f.status status, f.read_count readCount, f.good_count goodCount, f.editor_type editorType,
        f.createAt createTime, f.updateAt updateTime,
        (SELECT COUNT(*) FROM comment c WHERE c.forum_id = f.id) commentCount,
        (SELECT COUNT(*) FROM forum_good fg WHERE fg.forum_id = f.id AND fg.user_id = ?) haveLike,
        JSON_OBJECT("id", u.id, "username", u.username) author,
        IF(COUNT(l.id), JSON_ARRAYAGG(JSON_OBJECT("id", l.id, "name", l.name)), NULL) labels,
        IF(COUNT(a.id), JSON_OBJECT("id", a.id, "name", a.filename, "mimetype", a.mimetype, "size", a.size, 
          "forumId", a.forum_id, "downloadCount", a.download_count, "createTime", a.createAt, "updateTime",
          a.updateAt), NULL
        ) attachment,
        (SELECT
          IF(COUNT(c.id), JSON_ARRAYAGG(
              JSON_OBJECT("id", c.id, "content", c.content, "commentId", c.comment_id,
                "createTime", c.createAt, 
                "user", JSON_OBJECT("id", cu.id, "username", cu.username)
              )), NULL)
          FROM comment c 
          LEFT JOIN user cu ON c.user_id = cu.id
          WHERE f.id = c.forum_id
        ) comments,
        (SELECT CONCAT("${APP_HOST}:${APP_PORT}/forum/images/", file.filename)
          FROM file WHERE f.id = file.forum_id AND file.cover = 1
        ) cover
      FROM forum f
      LEFT JOIN user u ON f.user_id = u.id
      LEFT JOIN attachment a ON f.id = a.forum_id
      LEFT JOIN forum_label fl ON f.id = fl.forum_id
      LEFT JOIN label l ON fl.label_id = l.id
      WHERE f.id = ?
      GROUP BY f.id;
    `;
    const [result] = await connection.execute(statement, [userId, forumId]);
    if (result.length) {
      result[0].haveLike = Boolean(result[0].haveLike);
    }
    return result[0];
  }

  async getForumList(offset, size, labelId, type) {
    const statement = `
      SELECT
        f.id id, f.title title, f.summary summary, f.read_count readCount, f.good_count goodCount, f.status status, 
        f.createAt createTime, f.updateAt updateTime,
        JSON_OBJECT("id", u.id, "username", u.username) author,
        (SELECT COUNT(*) FROM comment c WHERE c.forum_id = f.id) commentCount,
        (SELECT COUNT(*) FROM forum_label fl WHERE fl.forum_id = f.id) labelCount,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", lt.id, "name", lt.name))
          FROM forum_label flt
          LEFT JOIN label lt ON flt.label_id = lt.id
          WHERE flt.forum_id = f.id
        ) labels,
        IF(a.id, 1, 0) attachmentType,
        (SELECT (CONCAT("${APP_HOST}:${APP_PORT}/forum/images/", file.filename))
          FROM file WHERE f.id = file.forum_id AND file.cover = 1
        ) cover
      FROM forum f
      LEFT JOIN user u ON f.user_id = u.id
      LEFT JOIN attachment a ON f.id = a.forum_id
      ${
        labelId > 0
          ? `INNER JOIN forum_label fl ON fl.label_id = ${labelId} AND f.id = fl.forum_id`
          : ""
      } 
      WHERE f.status = 1
      ${
        type == 0
          ? `ORDER BY goodCount DESC, readCount DESC, commentCount DESC`
          : `ORDER BY createTime DESC`
      }
      LIMIT ?, ?;
    `;

    const [result] = await connection.execute(statement, [offset, size]);
    return result;
  }

  async getForumFuzzyList(
    labelIds,
    titleFuzzy,
    usernameFuzzy,
    attachmentType,
    status,
    offset,
    size
  ) {
    let labelStatement = ``;
    if (labelIds?.length) {
      labelIds.forEach((item, index) => {
        labelStatement += `INNER JOIN forum_label fl${index} ON f.id = fl${index}.forum_id AND fl${index}.label_id = ${item}\n`;
      });
    }
    const attachmentStatement = `${attachmentType == 1 ? "a.id IS NOT NULL" : "a.id IS NULL"}`;

    const statement = `
      SELECT
        f.id id, f.title title, f.summary summary, f.read_count readCount, f.good_count goodCount, f.status status, 
        f.createAt createTime, f.updateAt updateTime,
        JSON_OBJECT("id", u.id, "username", u.username) author,
        (SELECT COUNT(*) FROM comment c WHERE c.forum_id = f.id) commentCount,
        (SELECT COUNT(*) FROM forum_label fl WHERE fl.forum_id = f.id) labelCount,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", lt.id, "name", lt.name))
          FROM forum_label flt
          LEFT JOIN label lt ON flt.label_id = lt.id
          WHERE flt.forum_id = f.id
        ) labels,
        IF(a.id, 1, 0) attachmentType,
        (SELECT (CONCAT("${APP_HOST}:${APP_PORT}/forum/images/", file.filename))
          FROM file WHERE f.id = file.forum_id AND file.cover = 1
        ) cover
      FROM forum f
      LEFT JOIN user u ON f.user_id = u.id
      LEFT JOIN attachment a ON f.id = a.forum_id
      ${labelStatement}
      WHERE TRUE
      ${status ? ` AND status = ${status}` : ""}
      ${attachmentType ? ` AND ${attachmentStatement}` : ""}
      ${titleFuzzy ? ` AND LOCATE("${titleFuzzy}", f.title)` : ""}
      ${usernameFuzzy ? ` AND LOCATE("${usernameFuzzy}", u.username)` : ""}
      ORDER BY createTime DESC
      limit ?, ?
    `;

    const [result] = await connection.execute(statement, [offset, size]);
    return result;
  }

  async getForumTotalByLableId(labelId) {
    const statement = `
      SELECT COUNT(*) forumTotal
      FROM forum
      WHERE status = 1
      ${labelId > 0 ? ` AND id IN(SELECT forum_id FROM forum_label WHERE label_id = ?);` : ""};
    `;
    const [result] = await connection.execute(statement, [labelId]);
    return result[0];
  }

  async getForumFuzzyTotal(labelIds, titleFuzzy, usernameFuzzy, attachmentType, status) {
    let labelStatement = ``;
    if (labelIds?.length) {
      labelIds.forEach((item, index) => {
        labelStatement += `INNER JOIN forum_label fl${index} ON f.id = fl${index}.forum_id AND fl${index}.label_id = ${item}\n`;
      });
    }
    const attachmentStatement = `${attachmentType == 1 ? "a.id IS NOT NULL" : "a.id IS NULL"}`;

    const statement = `
      SELECT count(*) forumTotal
      FROM forum f
      LEFT JOIN user u ON f.user_id = u.id
      LEFT JOIN attachment a ON f.id = a.forum_id
      ${labelStatement}
      WHERE TRUE
      ${status ? ` AND status = ${status}` : ""}
      ${attachmentType ? ` AND ${attachmentStatement}` : ""}
      ${titleFuzzy ? ` AND LOCATE("${titleFuzzy}", f.title)` : ""}
      ${usernameFuzzy ? ` AND LOCATE("${usernameFuzzy}", u.username)` : ""}
    `;

    const [result] = await connection.execute(statement);
    return result[0];
  }

  async update(title, summary, content, markdownContent, editorType, forumId) {
    const statement = `UPDATE forum SET title = ?, summary = ?, content = ?, markdown_content = ?, editor_type = ? WHERE id = ?;`;
    const [result] = await connection.execute(statement, [
      title,
      summary,
      content,
      markdownContent,
      editorType,
      forumId
    ]);
    return result;
  }

  async remove(forumId) {
    const statement = `DELETE FROM forum WHERE id = ?`;
    const [result] = await connection.execute(statement, [forumId]);
    return result;
  }

  async hasLabel(forumId, labelId) {
    const statement = `SELECT * FROM forum_label WHERE forum_id = ? AND label_id = ?;`;
    const [result] = await connection.execute(statement, [forumId, labelId]);
    return result[0] ? true : false;
  }

  async hasForum(forumId) {
    const statement = `SELECT id FROM forum WHERE id = ?;`;
    const [result] = await connection.execute(statement, [forumId]);
    return result[0] ? true : false;
  }

  async incrementReadCount(forumId) {
    const statement = `UPDATE forum SET read_count = read_count + 1 WHERE id = ?;`;
    const [result] = await connection.execute(statement, [forumId]);
    return result;
  }

  async incrementLikeCount(forumId, userId) {
    // 1. 修改动态中的点赞数
    let statement = `UPDATE forum SET good_count = good_count + 1 WHERE id = ?;`;
    await connection.execute(statement, [forumId]);

    // 2. 将用户与动态对应
    const result = (statement = `INSERT INTO forum_good (forum_id, user_id) VALUES (?, ?);`);
    await connection.execute(statement, [forumId, userId]);

    return result;
  }

  async incrementDownLoadCount(forumId) {
    const statement = `UPDATE attachment SET download_count = download_count + 1 WHERE forum_id = ?;`;
    const [result] = await connection.execute(statement, [forumId]);
    return result[0];
  }

  async addLabel(forumId, labelId) {
    const statement = `INSERT INTO forum_label (forum_id, label_id) VALUES (?, ?);`;
    const [result] = await connection.execute(statement, [forumId, labelId]);
    return result;
  }

  async removeLabelsByForumId(forumId) {
    const statement = `DELETE FROM forum_label WHERE forum_id = ?;`;
    const [result] = await connection.execute(statement, [forumId]);
    return result;
  }

  async audit(forumIds, status) {
    const statement = `UPDATE forum SET status = ? WHERE status != -1 AND id IN (${forumIds})`;
    const [result] = await connection.execute(statement, [status]);
    return result;
  }

  async search(keywords) {
    const statement = `
      SELECT
        f.id id, f.title title, f.summary summary, f.read_count readCount, f.good_count goodCount, f.status status, 
        f.createAt createTime, f.updateAt updateTime,
        JSON_OBJECT("id", u.id, "username", u.username) author,
        (SELECT COUNT(*) FROM comment c WHERE c.forum_id = f.id) commentCount,
        (SELECT COUNT(*) FROM forum_label fl WHERE fl.forum_id = f.id) labelCount,
        (SELECT JSON_ARRAYAGG(JSON_OBJECT("id", lt.id, "name", lt.name))
          FROM forum_label flt
          LEFT JOIN label lt ON flt.label_id = lt.id
          WHERE flt.forum_id = f.id
        ) labels,
        IF(a.id, 1, 0) attachmentType,
        (SELECT (CONCAT("${APP_HOST}:${APP_PORT}/forum/images/", file.filename))
          FROM file WHERE f.id = file.forum_id AND file.cover = 1
        ) cover
      FROM forum f
      LEFT JOIN user u ON f.user_id = u.id
      LEFT JOIN attachment a ON f.id = a.forum_id
      WHERE f.status = 1 AND (f.title REGEXP "${keywords}" OR f.summary REGEXP "${keywords}")
      ORDER BY goodCount DESC, readCount DESC, commentCount DESC
    `;

    const [result] = await connection.execute(statement);
    return result;
  }
}

module.exports = new ForumService();
