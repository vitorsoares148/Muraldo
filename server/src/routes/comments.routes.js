const express = require("express");

const {
  createComment,
  deleteComment,
  getComments,
} = require("../controllers/comments.controller");

const { authenticateToken } = require("../middleware/authenticateToken");

const router = express.Router();

router.get("/tasks/:taskId/comments", authenticateToken, getComments);

router.post("/tasks/:taskId/comments", authenticateToken, createComment);

router.delete("/comments/:commentId", authenticateToken, deleteComment);

module.exports = router;
