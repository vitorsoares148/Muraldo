const db = require("../../db");
const { getProjectPermission } = require("../utils/projectPermissions");

// ======================================================
// CRIAR COMENTÁRIO
// ======================================================
async function createComment(taskId, userId, content) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [tasks] = await connection.query(
      `
      SELECT
        t.id,
        b.project_id
      FROM tasks t
      JOIN columns c
        ON c.id = t.column_id
      JOIN boards b
        ON b.id = c.board_id
      WHERE t.id = ?
      `,
      [taskId],
    );

    if (tasks.length === 0) {
      await connection.rollback();

      return {
        status: "TASK_NOT_FOUND",
      };
    }

    const task = tasks[0];

    const permission = await getProjectPermission(task.project_id, userId);

    if (!permission.isMember) {
      await connection.rollback();

      return {
        status: "FORBIDDEN",
      };
    }

    await connection.query(
      `
      UPDATE tasks
      SET read_by = JSON_ARRAY(?)
      WHERE id = ?
      `,
      [userId, taskId],
    );

    const [result] = await connection.query(
      `
      INSERT INTO comments
        (
          task_id,
          user_id,
          content
        )
      VALUES (?, ?, ?)
      `,
      [taskId, userId, content],
    );

    const [comments] = await connection.query(
      `
      SELECT *
      FROM comments
      WHERE id = ?
      `,
      [result.insertId],
    );

    await connection.commit();

    return {
      status: "SUCCESS",
      comment: comments[0],
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// CONSEGUIR COMENTÁRIOS
// ======================================================
async function getComments(taskId, userId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [tasks] = await connection.query(
      `
      SELECT
        t.id,
        b.project_id
      FROM tasks t
      JOIN columns c
        ON c.id = t.column_id
      JOIN boards b
        ON b.id = c.board_id
      WHERE t.id = ?
      `,
      [taskId],
    );

    if (tasks.length === 0) {
      await connection.rollback();

      return {
        status: "TASK_NOT_FOUND",
      };
    }

    const permission = await getProjectPermission(tasks[0].project_id, userId);

    if (!permission.isMember) {
      await connection.rollback();

      return {
        status: "FORBIDDEN",
      };
    }

    const [comments] = await connection.query(
      `
      SELECT
        c.id,
        c.task_id,
        c.user_id,
        u.username,
        c.content,
        c.created_at,
        u.username AS comment_username
      FROM comments c
      JOIN users u
        ON u.id = c.user_id
      WHERE c.task_id = ?
      ORDER BY c.created_at ASC
      `,
      [taskId],
    );

    if (comments.length > 0) {
      await connection.query(
        `
      UPDATE tasks
      SET read_by = JSON_ARRAY_APPEND(read_by, '$', ?)
      WHERE id = ?
      AND JSON_SEARCH(read_by, 'one', CAST(? AS CHAR)) IS NULL
      `,
        [userId, taskId, userId],
      );
    }

    await connection.commit();

    return {
      status: "SUCCESS",
      comments,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// DELETAR COMENTÁRIO
// ======================================================
async function deleteComment(commentId, userId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const [comments] = await connection.query(
      `
      SELECT
        c.id,
        c.user_id,
        b.project_id
      FROM comments c
      JOIN tasks t
        ON t.id = c.task_id
      JOIN columns col
        ON col.id = t.column_id
      JOIN boards b
        ON b.id = col.board_id
      WHERE c.id = ?
      `,
      [commentId],
    );

    if (comments.length === 0) {
      await connection.rollback();

      return {
        status: "COMMENT_NOT_FOUND",
      };
    }

    const comment = comments[0];

    const permission = await getProjectPermission(comment.project_id, userId);

    if (!permission.isMember) {
      await connection.rollback();

      return {
        status: "FORBIDDEN",
      };
    }

    const canDelete =
      comment.user_id === userId ||
      permission.role === "admin" ||
      permission.role === "owner";

    if (!canDelete) {
      await connection.rollback();

      return {
        status: "NOT_AUTHORIZED",
      };
    }

    await connection.query(
      `
      DELETE FROM comments
      WHERE id = ?
      `,
      [commentId],
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

module.exports = {
  createComment,
  getComments,
  deleteComment,
};
