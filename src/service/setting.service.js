const connection = require("../app/database");

class SettingService {
  async getSettings() {
    const statement = `
      SELECT 
        forum_audit forumAudit, email_title emailTitle, 
        email_content emailContent, register_welcome_info registerWelcomeInfo
        FROM settings;
      `;
    const [result] = await connection.execute(statement);
    return result[0];
  }

  async setting(forumAudit, emailTitle, emailContent, registerWelcomeInfo) {
    const statement = `
      UPDATE settings 
      SET forum_audit = ?, email_title = ?, email_content = ?, register_welcome_info = ?;
    `;
    const [result] = await connection.execute(statement, [
      forumAudit.toString(),
      emailTitle,
      emailContent,
      registerWelcomeInfo
    ]);
    return result;
  }

  async updateForumAudit(forumAudit) {
    const statement = `ALTER TABLE forum modify column status TINYINT(4) NOT NULL DEFAULT ${!forumAudit};`;
    const [result] = await connection.execute(statement);
    return result;
  }
}

module.exports = new SettingService();
