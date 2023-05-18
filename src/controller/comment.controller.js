const commentService = require("../service/comment.service");
const userService = require("../service/user.service");
const { getParentNode } = require("../utils/comment-children-handle");
const messageTypes = require("../constants/message-types");

class CommentController {
  async create(ctx, next) {
    try {
      const { forumId, content } = ctx.request.body;
      const { id, username } = ctx.user;

      // 1. 添加评论
      const { insertId } = await commentService.create(forumId, content, id);

      // 2. 给文章作者消息提示
      const { user_id: authorId, title } = ctx.forum;
      await userService.createMessage(
        authorId,
        forumId,
        title,
        null,
        id,
        username,
        messageTypes.REPLY,
        content
      );

      // 3. 返回此次评论 id
      const [result] = await commentService.getCommentByCommentId(insertId);
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async reply(ctx, next) {
    try {
      const { forumId, content } = ctx.request.body;
      const { commentId } = ctx.params;
      const { id, username } = ctx.user;
      const { insertId } = await commentService.reply(forumId, content, id, commentId);
      const [result] = await commentService.getCommentByCommentId(insertId);

      // 给父评论用户发通知
      const { title } = ctx.forum;
      const { user_id: authorId } = ctx.comment;
      await userService.createMessage(
        authorId,
        forumId,
        title,
        commentId,
        id,
        username,
        messageTypes.REPLY,
        content
      );
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async update(ctx, next) {
    try {
      const { commentId } = ctx.params;
      const { content } = ctx.request.body;
      const result = await commentService.update(commentId, content);
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async remove(ctx, next) {
    try {
      const { commentIds } = ctx.query;
      const result = await commentService.remove(commentIds);
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }

  async list(ctx, next) {
    try {
      const { userId = "0", forumId, type = "0" } = ctx.query;

      const { commentCount } = await commentService.getCommentsTotalByForumId(forumId);
      const listResult = await commentService.getCommentsByForumId(userId, forumId, type);

      for (let index in listResult) {
        if (listResult[index].commentId === null) continue;
        const parentNode = getParentNode(listResult[index], listResult);
        parentNode.children = parentNode.children ?? [];
        parentNode.children.push(listResult[index]);
      }

      const commentList = listResult.filter(item => {
        if (item.commentId === null) {
          item.children = item.children ?? [];
          return true;
        }
        return false;
      });

      ctx.success({
        forumId: Number(forumId),
        commentCount,
        commentList
      });
    } catch (error) {
      console.log(error);
    }
  }

  async fuzzyList(ctx, next) {
    try {
      const { offset = "0", size = "8", contentFuzzy, usernameFuzzy } = ctx.query;

      const { commentTotal } = await commentService.getCommentsFuzzyTotal(
        contentFuzzy,
        usernameFuzzy
      );
      const commentList = await commentService.getCommentsFuzzyList(
        offset,
        size,
        contentFuzzy,
        usernameFuzzy
      );

      ctx.success({
        dataTotal: commentTotal,
        pageNo: Number(offset) < Number(size) ? 1 : parseInt(offset / size) + 1,
        pageSize: Number(size),
        pageTotal: Math.ceil(commentTotal / size),
        commentList
      });
    } catch (error) {
      console.log(error);
    }
  }

  async incrementLikeCount(ctx, next) {
    try {
      const { commentId } = ctx.params;
      const { id, username } = ctx.user;

      await commentService.incrementLikeCount(commentId, id);
      const [result] = await commentService.getCommentByCommentId(commentId);

      // 给评论的作者发通知
      const { id: forumId, title } = ctx.forum;
      await userService.createMessage(
        result.user.id,
        forumId,
        title,
        commentId,
        id,
        username,
        messageTypes.COMMENT,
        null
      );

      ctx.success({ ...result, haveLike: true }, "点赞成功！");
    } catch (err) {
      console.log(err);
    }
  }

  async updateTopType(ctx, next) {
    try {
      const { commentId } = ctx.params;
      const { type } = ctx.request.body;
      const result = await commentService.updateTopType(commentId, type);

      // 给被置顶用户发系统通知
      const { id: userId, username } = ctx.user; // 帖主
      const { id: forumId, title } = ctx.forum; // 帖子
      const { user_id: authorId } = ctx.comment; // 评论主

      if (type) {
        await userService.createMessage(
          authorId,
          forumId,
          title,
          commentId,
          userId,
          username,
          messageTypes.SYS,
          "置顶"
        );
      }
      ctx.success(result);
    } catch (error) {
      console.log(error);
    }
  }
}

module.exports = new CommentController();
