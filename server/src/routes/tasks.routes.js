const express = require("express");

const {
  createTask,
  deleteTask,
  getTasks,
  finishTask,
  updateTaskPosition,
} = require("../controllers/tasks.controller");

const { authenticateToken } = require("../middleware/authenticateToken");

const router = express.Router();

router.get("/columns/:columnId/tasks", authenticateToken, getTasks);

router.post("/columns/:columnId/tasks", authenticateToken, createTask);

router.delete("/tasks/:taskId", authenticateToken, deleteTask);

router.put("/tasks/:taskId/finish", authenticateToken, finishTask);

router.patch("/tasks/:taskId/position", authenticateToken, updateTaskPosition);

module.exports = router;
