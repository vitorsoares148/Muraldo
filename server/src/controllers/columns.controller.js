const columnsService = require("../services/columns.service");
const { isValidString } = require("../utils/validateString");

// ======================================================
// CRIAR COLUNA
// ======================================================
async function createColumn(req, res) {
  try {
    const boardId = Number(req.params.boardId);
    const { name } = req.body;

    if (!Number.isInteger(boardId) || boardId <= 0) {
      return res.status(400).json({
        error: "INVALID_BOARD_ID",
      });
    }

    if (!isValidString(name, 20)) {
      return res.status(400).json({
        error: "INVALID_COLUMN_NAME",
      });
    }

    const result = await columnsService.createColumn(
      boardId,
      req.userId,
      name.trim(),
    );

    if (result.status === "BOARD_NOT_FOUND") {
      return res.status(404).json({
        error: "BOARD_NOT_FOUND",
      });
    }

    if (result.status === "FORBIDDEN") {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    return res.status(201).json({
      message: "SUCCESS",
      columnId: result.columnId,
    });
  } catch (error) {
    console.error("Error creating column:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// DELETAR COLUNA
// ======================================================
async function deleteColumn(req, res) {
  try {
    const columnId = Number(req.params.columnId);

    if (!Number.isInteger(columnId) || columnId <= 0) {
      return res.status(400).json({
        error: "INVALID_COLUMN_ID",
      });
    }

    const result = await columnsService.deleteColumn(columnId, req.userId);

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

    return res.json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Error deleting column:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// CONSEGUIR COLUNAS
// ======================================================
async function getColumns(req, res) {
  try {
    const boardId = Number(req.params.boardId);

    if (!Number.isInteger(boardId) || boardId <= 0) {
      return res.status(400).json({
        error: "INVALID_BOARD_ID",
      });
    }

    const result = await columnsService.getColumns(boardId, req.userId);

    if (result.status === "BOARD_NOT_FOUND") {
      return res.status(404).json({
        error: "BOARD_NOT_FOUND",
      });
    }

    return res.json({
      message: "SUCCESS",
      columns: result.columns,
    });
  } catch (error) {
    console.error("Error getting columns:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// ATUALIZAR POSIÇÃO
// ======================================================
async function updateColumnPosition(req, res) {
  try {
    const columnId = Number(req.params.columnId);
    const { position } = req.body;

    if (!Number.isInteger(columnId) || columnId <= 0) {
      return res.status(400).json({
        error: "INVALID_COLUMN_ID",
      });
    }

    if (!Number.isInteger(position)) {
      return res.status(400).json({
        error: "INVALID_POSITION",
      });
    }

    const result = await columnsService.updateColumnPosition(
      columnId,
      req.userId,
      position,
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

    if (result.status === "INVALID_POSITION") {
      return res.status(400).json({
        error: "INVALID_POSITION",
      });
    }

    return res.json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Error updating column position:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================

module.exports = {
  createColumn,
  deleteColumn,
  getColumns,
  updateColumnPosition,
};
