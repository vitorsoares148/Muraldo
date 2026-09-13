const db = require("../../db");
const { getProjectPermission } = require("../utils/projectPermissions");

// ======================================================
// CRIAR COLUNA
// ======================================================
async function createColumn(boardId, userId, name) {
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

  if (!permission.isMember) {
    return {
      status: "FORBIDDEN",
    };
  }

  const [lastColumns] = await db.query(
    `
    SELECT position
    FROM columns
    WHERE board_id = ?
    ORDER BY position DESC
    LIMIT 1
    `,
    [boardId],
  );

  const position = lastColumns.length > 0 ? lastColumns[0].position + 1 : 0;

  const [result] = await db.query(
    `
    INSERT INTO columns
      (board_id, name, position)
    VALUES (?, ?, ?)
    `,
    [boardId, name, position],
  );

  return {
    status: "SUCCESS",
    columnId: result.insertId,
  };
}

// ======================================================
// DELETAR COLUNA
// ======================================================
async function deleteColumn(columnId, userId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Achar a coluna e o seu projeto.
    const [columns] = await connection.query(
      `
      SELECT
        c.id,
        c.board_id,
        c.position,
        b.project_id
      FROM columns c
      JOIN boards b
        ON b.id = c.board_id
      WHERE c.id = ?
      FOR UPDATE
      `,
      [columnId],
    );

    if (columns.length === 0) {
      await connection.rollback();

      return {
        status: "COLUMN_NOT_FOUND",
      };
    }

    const column = columns[0];

    const permission = await getProjectPermission(column.project_id, userId);

    if (!permission.isOwner && !permission.isAdmin) {
      await connection.rollback();

      return {
        status: "FORBIDDEN",
      };
    }

    // Travar todas as colunas do quadro antes de mudar as posições.
    await connection.query(
      `
      SELECT id
      FROM columns
      WHERE board_id = ?
      ORDER BY position
      FOR UPDATE
      `,
      [column.board_id],
    );

    // Deletar a coluna.
    await connection.query(
      `
      DELETE FROM columns
      WHERE id = ?
      `,
      [columnId],
    );

    // Mudar a posição das outras colunas após deletar.
    await connection.query(
      `
      UPDATE columns
      SET position = position - 1
      WHERE board_id = ?
        AND position > ?
      `,
      [column.board_id, column.position],
    );

    await connection.commit();

    return {
      status: "SUCCESS",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// CONSEGUIR COLUNAS
// ======================================================
async function getColumns(boardId, userId) {
  const [boards] = await db.query(
    `
    SELECT
      b.id
    FROM boards b
    JOIN projects p
      ON p.id = b.project_id
    LEFT JOIN project_members pm
      ON pm.project_id = p.id
      AND pm.user_id = ?
    WHERE b.id = ?
      AND (
        p.owner_id = ?
        OR pm.user_id IS NOT NULL
      )
    `,
    [userId, boardId, userId],
  );

  if (boards.length === 0) {
    return { status: "BOARD_NOT_FOUND" };
  }

  const [columns] = await db.query(
    `
    SELECT
      id,
      name,
      position,
      created_at,
      updated_at
    FROM columns
    WHERE board_id = ?
    ORDER BY position ASC
    `,
    [boardId],
  );

  return {
    status: "SUCCESS",
    columns,
  };
}

// ======================================================
// ATUALIZAR POSIÇÃO
// ======================================================
async function updateColumnPosition(columnId, userId, newPosition) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Achar a coluna e o seu projeto.
    const [columns] = await connection.query(
      `
      SELECT
        c.id,
        c.board_id,
        c.position,
        b.project_id,
        p.owner_id
      FROM columns c
      JOIN boards b
        ON b.id = c.board_id
      JOIN projects p
        ON p.id = b.project_id
      WHERE c.id = ?
      FOR UPDATE
      `,
      [columnId],
    );

    if (columns.length === 0) {
      await connection.rollback();
      return { status: "COLUMN_NOT_FOUND" };
    }

    const column = columns[0];

    const permission = await getProjectPermission(column.project_id, userId);

    if (!permission.isMember) {
      await connection.rollback();

      return {
        status: "FORBIDDEN",
      };
    }

    // Travar todas as colunas participando da ordenação.
    await connection.query(
      `
      SELECT id
      FROM columns
      WHERE board_id = ?
      ORDER BY position
      FOR UPDATE
      `,
      [column.board_id],
    );

    // Conseguir o número de colunas no quadro.
    const [countResult] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM columns
      WHERE board_id = ?
      `,
      [column.board_id],
    );

    const columnCount = Number(countResult[0].count);

    // Validar a nova posição.
    if (
      !Number.isInteger(newPosition) ||
      newPosition < 0 ||
      newPosition >= columnCount
    ) {
      await connection.rollback();
      return { status: "INVALID_POSITION" };
    }

    const oldPosition = column.position;

    // Nada para mudar.
    if (oldPosition === newPosition) {
      await connection.commit();

      return {
        status: "SUCCESS",
      };
    }

    // Mover coluna para direita.
    if (newPosition > oldPosition) {
      await connection.query(
        `
        UPDATE columns
        SET position = position - 1
        WHERE board_id = ?
          AND position > ?
          AND position <= ?
        `,
        [column.board_id, oldPosition, newPosition],
      );
    }

    // Mover coluna para esquerda.
    else {
      await connection.query(
        `
        UPDATE columns
        SET position = position + 1
        WHERE board_id = ?
          AND position >= ?
          AND position < ?
        `,
        [column.board_id, newPosition, oldPosition],
      );
    }

    // Nova posição da coluna.
    await connection.query(
      `
      UPDATE columns
      SET position = ?
      WHERE id = ?
      `,
      [newPosition, columnId],
    );

    await connection.commit();

    return {
      status: "SUCCESS",
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================

module.exports = {
  createColumn,
  deleteColumn,
  getColumns,
  updateColumnPosition,
};
