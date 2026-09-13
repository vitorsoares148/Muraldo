const express = require("express");

const {
  createColumn,
  deleteColumn,
  getColumns,
  updateColumnPosition,
} = require("../controllers/columns.controller");

const { authenticateToken } = require("../middleware/authenticateToken");

const router = express.Router();

router.post("/boards/:boardId/columns", authenticateToken, createColumn);

router.delete("/columns/:columnId", authenticateToken, deleteColumn);

router.get("/boards/:boardId/columns", authenticateToken, getColumns);

router.patch(
  "/columns/:columnId/position",
  authenticateToken,
  updateColumnPosition,
);

module.exports = router;
