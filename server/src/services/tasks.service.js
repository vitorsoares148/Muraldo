const db = require("../../db");
const { getProjectPermission } = require("../utils/projectPermissions");

// ======================================================
// CRIAR TAREFA
// ======================================================
async function createTask(
  columnId,
  assignedTo,
  userId,
  description,
  priority,
  dueDate,
) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Achar a coluna, quadro e projeto
    const [columns] = await connection.query(
      `
      SELECT
        c.id,
        c.board_id,
        b.project_id,
        p.owner_id
      FROM columns c
      JOIN boards b
        ON b.id = c.board_id
      JOIN projects p
        ON p.id = b.project_id
      WHERE c.id = ?
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

    if (!permission.isMember) {
      return { status: "FORBIDDEN" };
    }

    if (assignedTo) {
      const assignedUserPermission = await getProjectPermission(
        column.project_id,
        assignedTo,
      );

      if (!assignedUserPermission.isMember) {
        return { status: "FORBIDDEN" };
      }
    }

    // Conseguir a proxima posição
    const [lastTasks] = await connection.query(
      `
      SELECT position
      FROM tasks
      WHERE column_id = ?
      ORDER BY position DESC
      LIMIT 1
      `,
      [columnId],
    );

    const position = lastTasks.length > 0 ? lastTasks[0].position + 1 : 0;

    // Criar a tarefa
    const [result] = await connection.query(
      `
      INSERT INTO tasks
        (
          column_id,
          assigned_to,
          description,
          priority,
          due_date,
          position
        )
      VALUES (?, ?, ?, ?, ?, ?)
      `,
      [
        columnId,
        assignedTo || null,
        description,
        priority || "none",
        dueDate || null,
        position,
      ],
    );

    await connection.commit();

    return {
      status: "SUCCESS",
      taskId: result.insertId,
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// DELETAR TAREFA
// ======================================================
async function deleteTask(taskId, userId) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Achar a tarefa e o seu projeto
    const [tasks] = await connection.query(
      `
      SELECT
        t.id,
        t.column_id,
        t.position,
        b.project_id,
        p.owner_id
      FROM tasks t
      JOIN columns c
        ON c.id = t.column_id
      JOIN boards b
        ON b.id = c.board_id
      JOIN projects p
        ON p.id = b.project_id
      WHERE t.id = ?
      FOR UPDATE
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

      return { status: "FORBIDDEN" };
    }

    // Travar todas as tarefas antes de mudar as posições.
    await connection.query(
      `
      SELECT id
      FROM tasks
      WHERE column_id = ?
      ORDER BY position
      FOR UPDATE
      `,
      [task.column_id],
    );

    // Deletar a tarefa.
    await connection.query(
      `
      DELETE FROM tasks
      WHERE id = ?
      `,
      [taskId],
    );

    // Atualizar posição das outras tarefas.
    await connection.query(
      `
      UPDATE tasks
      SET position = position - 1
      WHERE column_id = ?
        AND position > ?
      `,
      [task.column_id, task.position],
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
// CONSEGUIR TAREFAS
// ======================================================
async function getTasks(columnId, userId) {
  // Checar se o usuário tem acesso ao projeto.
  const [columns] = await db.query(
    `
    SELECT c.id
    FROM columns c
    JOIN boards b
      ON b.id = c.board_id
    JOIN projects p
      ON p.id = b.project_id
    LEFT JOIN project_members pm
      ON pm.project_id = p.id
      AND pm.user_id = ?
    WHERE c.id = ?
      AND (
        p.owner_id = ?
        OR pm.user_id IS NOT NULL
      )
    `,
    [userId, columnId, userId],
  );

  if (columns.length === 0) {
    return {
      status: "COLUMN_NOT_FOUND",
    };
  }

  const [tasks] = await db.query(
    `
    SELECT
      t.id,
      t.column_id,
      t.assigned_to,
      t.description,
      t.priority,
      t.due_date,
      t.position,
      t.created_at,
      t.updated_at,
      t.finished,
      t.finish_date,
      t.read_by,
      u.username AS assigned_username
    FROM tasks t
    LEFT JOIN users u
      ON u.id = t.assigned_to
    WHERE t.column_id = ?
    ORDER BY t.position ASC
    `,
    [columnId],
  );

  return {
    status: "SUCCESS",
    tasks,
  };
}

// ======================================================
// ATUALIZAR POSIÇÃO
// ======================================================
async function updateTaskPosition(taskId, userId, targetColumnId, newPosition) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Achar a tarefa e o seu projeto.
    const [tasks] = await connection.query(
      `
      SELECT
        t.id,
        t.column_id,
        t.position,
        b.project_id,
        p.owner_id
      FROM tasks t
      JOIN columns c
        ON c.id = t.column_id
      JOIN boards b
        ON b.id = c.board_id
      JOIN projects p
        ON p.id = b.project_id
      WHERE t.id = ?
      FOR UPDATE
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

      return { status: "FORBIDDEN" };
    }

    // Travar todas as tarefas de ambas as colunas participantes da operação.
    const columnIds = [task.column_id, targetColumnId].sort((a, b) => a - b);
    await connection.query(
      `
      SELECT id
      FROM tasks
      WHERE column_id IN (?, ?)
      ORDER BY column_id, position
      FOR UPDATE
      `,
      columnIds,
    );

    // Verificar se a coluna alvo faz parte do mesmo projeto.
    const [targetColumns] = await connection.query(
      `
      SELECT c.id
      FROM columns c
      JOIN boards b
        ON b.id = c.board_id
      WHERE c.id = ?
        AND b.project_id = ?
      `,
      [targetColumnId, task.project_id],
    );

    if (targetColumns.length === 0) {
      await connection.rollback();

      return {
        status: "TARGET_COLUMN_NOT_FOUND",
      };
    }

    // ==================================================
    // MESMA COLUNA
    // ==================================================

    if (task.column_id === targetColumnId) {
      const [countResult] = await connection.query(
        `
        SELECT COUNT(*) AS count
        FROM tasks
        WHERE column_id = ?
        `,
        [task.column_id],
      );

      const taskCount = Number(countResult[0].count);

      if (
        !Number.isInteger(newPosition) ||
        newPosition < 0 ||
        newPosition > taskCount
      ) {
        await connection.rollback();

        return {
          status: "INVALID_POSITION",
        };
      }

      const oldPosition = task.position;

      if (oldPosition === newPosition) {
        await connection.commit();

        return {
          status: "SUCCESS",
        };
      }

      // Mover pra baixo.
      if (newPosition > oldPosition) {
        await connection.query(
          `
          UPDATE tasks
          SET position = position - 1
          WHERE column_id = ?
            AND position > ?
            AND position <= ?
          `,
          [task.column_id, oldPosition, newPosition],
        );
      }

      // Mover pra cima.
      else {
        await connection.query(
          `
          UPDATE tasks
          SET position = position + 1
          WHERE column_id = ?
            AND position >= ?
            AND position < ?
          `,
          [task.column_id, newPosition, oldPosition],
        );
      }

      await connection.query(
        `
        UPDATE tasks
        SET position = ?
        WHERE id = ?
        `,
        [newPosition, taskId],
      );

      await connection.commit();

      return {
        status: "SUCCESS",
      };
    }

    // ==================================================
    // COLUNA DIFERENTE
    // ==================================================

    const [targetCountResult] = await connection.query(
      `
      SELECT COUNT(*) AS count
      FROM tasks
      WHERE column_id = ?
      `,
      [targetColumnId],
    );

    const targetTaskCount = Number(targetCountResult[0].count);

    if (
      !Number.isInteger(newPosition) ||
      newPosition < 0 ||
      newPosition > targetTaskCount
    ) {
      await connection.rollback();

      return {
        status: "INVALID_POSITION",
      };
    }

    // Remover a tarefa da sua coluna antiga.
    await connection.query(
      `
      UPDATE tasks
      SET column_id = ?
      WHERE id = ?
      `,
      [targetColumnId, taskId],
    );

    // Mudar posição das outras tarefas na coluna antiga.
    await connection.query(
      `
      UPDATE tasks
      SET position = position - 1
      WHERE column_id = ?
        AND position > ?
      `,
      [task.column_id, task.position],
    );

    // Mudar posição das tarefas na coluna atual.
    await connection.query(
      `
      UPDATE tasks
      SET position = position + 1
      WHERE column_id = ?
        AND position >= ?
        AND id != ?
      `,
      [targetColumnId, newPosition, taskId],
    );

    // Colocar tarefa na nova posição.
    await connection.query(
      `
      UPDATE tasks
      SET position = ?
      WHERE id = ?
      `,
      [newPosition, taskId],
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
// TERMINAR TAREFA
// ======================================================
async function finishTask(taskId, userId) {
  const [tasks] = await db.query(
    `SELECT t.finished, b.project_id
     FROM tasks t
     JOIN columns c ON t.column_id = c.id
     JOIN boards b ON c.board_id = b.id
     WHERE t.id = ?`,
    [taskId],
  );

  const task = tasks[0];

  if (tasks.length === 0) {
    return { status: "TASK_NOT_FOUND" };
  }

  const permission = await getProjectPermission(task.project_id, userId);

  if (!permission.isMember) {
    return { status: "FORBIDDEN" };
  }

  if (tasks[0].finished) {
    return { status: "TASK_ALREADY_FINISHED" };
  }

  await db.query(
    `UPDATE tasks
     SET finished = TRUE,
         finish_date = CURRENT_TIMESTAMP
     WHERE id = ?`,
    [taskId],
  );

  return { status: "SUCCESS" };
}

// ======================================================

module.exports = {
  createTask,
  deleteTask,
  getTasks,
  updateTaskPosition,
  finishTask,
};
