const tasksService = require("../services/tasks.service");
const { isValidDate } = require("../utils/validateDate");
const { isValidString } = require("../utils/validateString");

// ======================================================
// CRIAR TAREFA
// ======================================================
async function createTask(req, res) {
  try {
    const columnId = Number(req.params.columnId);

    const { description, priority, dueDate, assignedTo } = req.body;

    if (!Number.isInteger(columnId) || columnId <= 0) {
      return res.status(400).json({
        error: "INVALID_COLUMN_ID",
      });
    }

    if (!isValidString(description, 200)) {
      return res.status(400).json({
        error: "INVALID_TASK_DESCRIPTION",
      });
    }

    const validPriorities = ["none", "low", "medium", "high", "urgent"];

    if (priority !== undefined && !validPriorities.includes(priority)) {
      return res.status(400).json({
        error: "INVALID_PRIORITY",
      });
    }

    if (dueDate !== undefined && dueDate !== null) {
      if (!isValidDate(dueDate)) {
        return res.status(400).json({
          error: "INVALID_DUE_DATE",
        });
      }
    }

    const result = await tasksService.createTask(
      columnId,
      assignedTo || null,
      req.userId,
      description?.trim(),
      priority,
      dueDate,
    );

    if (result.status === "COLUMN_NOT_FOUND") {
      return res.status(404).json({
        error: "COLUMN_NOT_FOUND",
      });
    }

    if (result.status === "FORBIDDEN") {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    return res.status(201).json({
      message: "SUCCESS",
      taskId: result.taskId,
    });
  } catch (error) {
    console.error("Error creating task:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// DELETAR TAREFA
// ======================================================
async function deleteTask(req, res) {
  try {
    const taskId = Number(req.params.taskId);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        error: "INVALID_TASK_ID",
      });
    }

    const result = await tasksService.deleteTask(taskId, req.userId);

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
    });
  } catch (error) {
    console.error("Error deleting task:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// CONSEGUIR TAREFAS
// ======================================================
async function getTasks(req, res) {
  try {
    const columnId = Number(req.params.columnId);

    if (!Number.isInteger(columnId) || columnId <= 0) {
      return res.status(400).json({
        error: "INVALID_COLUMN_ID",
      });
    }

    const result = await tasksService.getTasks(columnId, req.userId);

    if (result.status === "COLUMN_NOT_FOUND") {
      return res.status(404).json({
        error: "COLUMN_NOT_FOUND",
      });
    }

    return res.json({
      message: "SUCCESS",
      tasks: result.tasks,
    });
  } catch (error) {
    console.error("Error getting tasks:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// ATUALIZAR POSIÇÃO DA TAREFA
// ======================================================
async function updateTaskPosition(req, res) {
  try {
    const taskId = Number(req.params.taskId);

    const { columnId, position } = req.body;

    const targetColumnId = Number(columnId);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        error: "INVALID_TASK_ID",
      });
    }

    if (!Number.isInteger(targetColumnId) || targetColumnId <= 0) {
      return res.status(400).json({
        error: "INVALID_COLUMN_ID",
      });
    }

    if (!Number.isInteger(position)) {
      return res.status(400).json({
        error: "INVALID_POSITION",
      });
    }

    const result = await tasksService.updateTaskPosition(
      taskId,
      req.userId,
      targetColumnId,
      position,
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

    if (result.status === "TARGET_COLUMN_NOT_FOUND") {
      return res.status(404).json({
        error: "TARGET_COLUMN_NOT_FOUND",
      });
    }

    if (result.status === "INVALID_POSITION") {
      return res.status(400).json({
        error: "INVALID_POSITION",
      });
    }

    return res.json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Error updating task position:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// TERMINAR TAREFA
// ======================================================
async function finishTask(req, res) {
  try {
    const taskId = Number(req.params.taskId);

    if (!Number.isInteger(taskId) || taskId <= 0) {
      return res.status(400).json({
        error: "INVALID_TASK_ID",
      });
    }

    const result = await tasksService.finishTask(taskId, req.userId);

    switch (result.status) {
      case "TASK_NOT_FOUND":
        return res.status(404).json({
          error: "TASK_NOT_FOUND",
        });

      case "FORBIDDEN":
        return res.status(403).json({
          error: "FORBIDDEN",
        });

      case "TASK_ALREADY_FINISHED":
        return res.status(409).json({
          error: "TASK_ALREADY_FINISHED",
        });

      case "SUCCESS":
        return res.json({
          message: "SUCCESS",
        });
    }
  } catch (error) {
    console.error("Error finishing task:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================

module.exports = {
  createTask,
  deleteTask,
  getTasks,
  updateTaskPosition,
  finishTask,
};
