function findIndexById(id, commentList) {
  return commentList.findIndex(item => item.id === id);
}

function getParentNode(comment, coomentList) {
  if (comment.commentId === null) {
    return comment;
  }
  const index = findIndexById(comment.commentId, coomentList);
  return getParentNode(coomentList[index], coomentList);
}

module.exports = {
  getParentNode
};
