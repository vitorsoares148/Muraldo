const boardsService = require("../services/boards.service");
const { isValidString } = require("../utils/validateString");

// ======================================================
// CRIAR QUADRO
// ======================================================
async function createBoard(req, res) {
  try {
    const projectId = Number(req.params.projectId);
    const { name } = req.body;

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        error: "INVALID_PROJECT_ID",
      });
    }

    if (!isValidString(name, 40)) {
      return res.status(400).json({
        error: "INVALID_BOARD_NAME",
      });
    }

    const result = await boardsService.createBoard(
      projectId,
      req.userId,
      name.trim(),
    );

    if (result.status === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: "PROJECT_NOT_FOUND",
      });
    }

    if (result.status === "FORBIDDEN") {
      return res.status(403).json({
        error: "FORBIDDEN",
      });
    }

    return res.status(201).json({
      message: "SUCCESS",
      boardId: result.boardId,
    });
  } catch (error) {
    console.error("Error creating board:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// DELETAR QUADRO
// ======================================================
async function deleteBoard(req, res) {
  try {
    const boardId = Number(req.params.boardId);

    if (!Number.isInteger(boardId) || boardId <= 0) {
      return res.status(400).json({
        error: "INVALID_BOARD_ID",
      });
    }

    const result = await boardsService.deleteBoard(boardId, req.userId);

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

    return res.json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Error deleting board:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================

module.exports = {
  createBoard,
  deleteBoard,
};
