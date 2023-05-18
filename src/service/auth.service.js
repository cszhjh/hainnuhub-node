const connection = require("../app/database");

class AuthService {
  async checkResource(tableName, id, userId) {
    const statement = `
      SELECT * FROM ${tableName} 
      WHERE id = ? AND (user_id = ? OR ? IN (SELECT id FROM user WHERE id = ? AND (power = 1 OR power = -1)));`;
    const [result] = await connection.execute(statement, [id, userId, userId, userId]);
    return result.length > 0;
  }

  async checkAdminPower(userId) {
    const statment = `SELECT * FROM user WHERE id = ? AND (power = 1 OR power = -1);`;
    const [result] = await connection.execute(statment, [userId]);
    return result.length > 0;
  }

  async checkSuperAdminPower(userId) {
    const statment = `SELECT * FROM user WHERE id = ? AND power = -1`;
    const [result] = await connection.execute(statment, [userId]);
    return result.length > 0;
  }

  async checkHaveLike(tableName, id, userId) {
    const statement = `SELECT * FROM ${tableName}_good WHERE ${tableName}_id = ? AND user_id = ?;`;
    const [result] = await connection.execute(statement, [id, userId]);
    return result.length > 0;
  }

  async checkForumExists(forumId, userId, status) {
    const statement = `SELECT * FROM forum WHERE id = ?`;
    let permissionStatement = ` AND status = 1`;
    if (userId && status == 0) {
      permissionStatement = ` AND (user_id = ${userId} OR ${userId} IN (SELECT id FROM user WHERE id = ${userId} AND (power = 1 OR power = -1)))`;
    }
    console.log(userId, status);
    const [result] = await connection.execute(statement + permissionStatement, [forumId]);
    return result[0];
  }

  async checkCommentExists(commentId) {
    const statement = `SELECT * FROM comment WHERE id = ?;`;
    const [result] = await connection.execute(statement, [commentId]);
    return result[0];
  }

  async checkForumStatus(forumId) {
    const statment = `SELECT status FROM forum WHERE id = ?`;
    const [result] = await connection.execute(statment, [forumId]);
    return result[0];
  }
}

module.exports = new AuthService();
