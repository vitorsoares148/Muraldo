const express = require("express");

const {
  createBoard,
  deleteBoard,
} = require("../controllers/boards.controller");

const { authenticateToken } = require("../middleware/authenticateToken");

const router = express.Router();

router.post("/projects/:projectId/boards", authenticateToken, createBoard);

router.delete("/boards/:boardId", authenticateToken, deleteBoard);

module.exports = router;
