const db = require("../../db");
const { getProjectPermission } = require("../utils/projectPermissions");

// ======================================================
// CRIAR QUADRO
// ======================================================
async function createBoard(projectId, userId, name) {
  const [projects] = await db.query(
    `
    SELECT id, owner_id
    FROM projects
    WHERE id = ?
    `,
    [projectId],
  );

  if (projects.length === 0) {
    return { status: "PROJECT_NOT_FOUND" };
  }

  const permission = await getProjectPermission(projectId, userId);

  if (!permission.isOwner && !permission.isAdmin) {
    return {
      status: "FORBIDDEN",
    };
  }

  const [lastBoards] = await db.query(
    `
    SELECT position
    FROM boards
    WHERE project_id = ?
    ORDER BY position DESC
    LIMIT 1
    `,
    [projectId],
  );

  const position = lastBoards.length > 0 ? lastBoards[0].position + 1 : 0;

  const [result] = await db.query(
    `
    INSERT INTO boards
      (project_id, name, position)
    VALUES (?, ?, ?)
    `,
    [projectId, name, position],
  );

  return {
    status: "SUCCESS",
    boardId: result.insertId,
  };
}

// ======================================================
// DELETAR QUADRO
// ======================================================
async function deleteBoard(boardId, userId) {
  const [boards] = await db.query(
    `
    SELECT
      b.id,
      b.project_id,
      p.owner_id
    FROM boards b
    JOIN projects p
      ON p.id = b.project_id
    WHERE b.id = ?
    `,
    [boardId],
  );

  if (boards.length === 0) {
    return { status: "BOARD_NOT_FOUND" };
  }

  const board = boards[0];

  const permission = await getProjectPermission(board.project_id, userId);

  if (!permission.isOwner && !permission.isAdmin) {
    return {
      status: "FORBIDDEN",
    };
  }

  await db.query(
    `
    DELETE FROM boards
    WHERE id = ?
    `,
    [boardId],
  );

  return { status: "SUCCESS" };
}

// ======================================================

module.exports = {
  createBoard,
  deleteBoard,
};
