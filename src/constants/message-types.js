const SYS = 0;
const REPLY = 1;
const FORUM = 2;
const COMMENT = 3;

/** 对于 commentId:
 *    reply:
 *          1. 有 commentId 则表示 回复评论
 *          2. 没有 commentId 则表示 评论文章
 *          -. 若有 commentId 的数据，将对应的评论内容返回到前端
 **/

module.exports = {
  REPLY,
  FORUM,
  COMMENT,
  SYS
};
