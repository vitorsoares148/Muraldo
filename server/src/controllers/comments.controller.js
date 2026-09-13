const commentsService = require("../services/comments.service");
const { isValidString } = require("../utils/validateString");

// ======================================================
// CRIAR COMENTÁRIO
// ======================================================
async function createComment(req, res) {
  try {
    const taskId = Number(req.params.taskId);
    const { content } = req.body;

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        error: "INVALID_TASK_ID",
      });
    }

    if (!isValidString(content, 800)) {
      return res.status(400).json({
        error: "INVALID_COMMENT_CONTENT",
      });
    }

    const result = await commentsService.createComment(
      taskId,
      req.userId,
      content.trim(),
    );

    if (result.status === "TASK_NOT_FOUND") {
      return res.status(404).json({
        error: "TASK_NOT_FOUND",
      });
    }

    if (result.status === "FORBIDDEN") {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    return res.json({
      message: "SUCCESS",
      comment: result.comment,
    });
  } catch (error) {
    console.error("Error creating comment:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// CONSEGUIR COMENTÁRIOS
// ======================================================
async function getComments(req, res) {
  try {
    const taskId = Number(req.params.taskId);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        error: "INVALID_TASK_ID",
      });
    }

    const result = await commentsService.getComments(taskId, req.userId);

    if (result.status === "TASK_NOT_FOUND") {
      return res.status(404).json({
        error: "TASK_NOT_FOUND",
      });
    }

    if (result.status === "FORBIDDEN") {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    return res.json({
      message: "SUCCESS",
      comments: result.comments,
    });
  } catch (error) {
    console.error("Error getting comments:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// DELETAR COMENTÁRIO
// ======================================================
async function deleteComment(req, res) {
  try {
    const commentId = Number(req.params.commentId);

    if (!Number.isInteger(commentId) || commentId <= 0) {
      return res.status(400).json({
        error: "INVALID_COMMENT_ID",
      });
    }

    const result = await commentsService.deleteComment(commentId, req.userId);

    if (result.status === "COMMENT_NOT_FOUND") {
      return res.status(404).json({
        error: "COMMENT_NOT_FOUND",
      });
    }

    if (result.status === "FORBIDDEN") {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    if (result.status === "NOT_AUTHORIZED") {
      return res.status(403).json({
        error: "NOT_AUTHORIZED",
      });
    }

    return res.json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Error deleting comment:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================

module.exports = {
  createComment,
  getComments,
  deleteComment,
};
