const db = require("../../db");
const { getProjectPermission } = require("../utils/projectPermissions");

// ======================================================
// CRIAR PROJETO
// ======================================================
async function createProject(userId, name, description) {
  const [result] = await db.query(
    `INSERT INTO projects
      (owner_id, name, description)
     VALUES (?, ?, ?)`,
    [userId, name, description || null],
  );

  return result.insertId;
}

// ======================================================
// DELETAR PROJETO
// ======================================================
async function deleteProject(projectId, userId) {
  const [result] = await db.query(
    `DELETE FROM projects
     WHERE id = ? AND owner_id = ?`,
    [projectId, userId],
  );

  if (result.affectedRows === 0) {
    return false;
  }

  return true;
}

// ======================================================
// CONSEGUIR PROJETOS
// ======================================================
async function getProjects(userId) {
  const [rows] = await db.query(
    `
    SELECT
      p.id,
      p.name,
      p.description,
      p.owner_id,
      p.created_at,
      p.updated_at
    FROM projects p
    LEFT JOIN project_members pm
      ON pm.project_id = p.id
    WHERE p.owner_id = ?
       OR pm.user_id = ?
    GROUP BY p.id
    ORDER BY p.updated_at DESC
    `,
    [userId, userId],
  );

  return rows;
}

// ======================================================
// ATUALIZAR PROJETO
// ======================================================
async function updateProject(projectId, userId, name, description) {
  const [projects] = await db.query(
    `
    SELECT id, owner_id
    FROM projects
    WHERE id = ?
    `,
    [projectId],
  );

  if (projects.length === 0) {
    return { status: "NOT_FOUND" };
  }

  const permission = await getProjectPermission(projectId, userId);

  if (!permission.isOwner && !permission.isAdmin) {
    return {
      status: "FORBIDDEN",
    };
  }

  await db.query(
    `
    UPDATE projects
    SET name = ?, description = ?
    WHERE id = ?
    `,
    [name, description, projectId],
  );

  return { status: "SUCCESS" };
}

// ======================================================
// ADICIONAR MEMBRO
// ======================================================
async function addProjectMember(projectId, userId, username) {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    // Achar o projeto.
    const [projects] = await connection.query(
      `
      SELECT id, owner_id
      FROM projects
      WHERE id = ?
      `,
      [projectId],
    );

    if (projects.length === 0) {
      await connection.rollback();
      return { status: "PROJECT_NOT_FOUND" };
    }

    const project = projects[0];

    const permission = await getProjectPermission(projectId, userId);

    if (!permission.isOwner) {
      await connection.rollback();

      return {
        status: "FORBIDDEN",
      };
    }

    // Achar o usuário por nome.
    const [users] = await connection.query(
      `
      SELECT id, username
      FROM users
      WHERE username = ?
      `,
      [username],
    );

    if (users.length === 0) {
      await connection.rollback();
      return { status: "USER_NOT_FOUND" };
    }

    const user = users[0];

    // O dono já faz parte do projeto.
    if (user.id === project.owner_id) {
      await connection.rollback();
      return { status: "ALREADY_MEMBER" };
    }

    // Checar se usuário já faz parte do projeto.
    const [members] = await connection.query(
      `
      SELECT id
      FROM project_members
      WHERE project_id = ?
        AND user_id = ?
      `,
      [projectId, user.id],
    );

    if (members.length > 0) {
      await connection.rollback();
      return { status: "ALREADY_MEMBER" };
    }

    // Adicionar usuário ao projeto.
    await connection.query(
      `
      INSERT INTO project_members
        (project_id, user_id, role)
      VALUES (?, ?, 'member')
      `,
      [projectId, user.id],
    );

    await connection.commit();

    return {
      status: "SUCCESS",
      user: {
        id: user.id,
        username: user.username,
      },
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

// ======================================================
// REMOVER MEMBRO
// ======================================================
async function removeProjectMember(projectId, requesterId, memberId) {
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

  const project = projects[0];

  const permission = await getProjectPermission(projectId, requesterId);

  if (memberId === project.owner_id) {
    return { status: "CANNOT_REMOVE_OWNER" };
  }

  if (requesterId === memberId) {
    return { status: "CANNOT_REMOVE_SELF" };
  }

  if (!permission.isOwner) {
    return {
      status: "FORBIDDEN",
    };
  }

  const [members] = await db.query(
    `
    SELECT id
    FROM project_members
    WHERE project_id = ?
      AND user_id = ?
    `,
    [projectId, memberId],
  );

  if (members.length === 0) {
    return { status: "MEMBER_NOT_FOUND" };
  }

  await db.query(
    `
    DELETE FROM project_members
    WHERE project_id = ?
      AND user_id = ?
    `,
    [projectId, memberId],
  );

  return { status: "SUCCESS" };
}

// ======================================================
// MUDAR CARGO DE UM MEMBRO
// ======================================================
async function changeProjectMemberRole(projectId, requesterId, memberId) {
  // Checar se projeto existe.
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

  const project = projects[0];

  // Checar se usuário é dono.
  const permission = await getProjectPermission(projectId, requesterId);

  if (!permission.isOwner) {
    return {
      status: "FORBIDDEN",
    };
  }

  if (memberId === project.owner_id) {
    return { status: "CANNOT_CHANGE_OWNER" };
  }

  // Achar o membro e seu cargo atual.
  const [members] = await db.query(
    `
    SELECT role
    FROM project_members
    WHERE project_id = ?
      AND user_id = ?
    `,
    [projectId, memberId],
  );

  if (members.length === 0) {
    return { status: "MEMBER_NOT_FOUND" };
  }

  const currentRole = members[0].role;

  const newRole = currentRole === "admin" ? "member" : "admin";

  await db.query(
    `
    UPDATE project_members
    SET role = ?
    WHERE project_id = ?
      AND user_id = ?
    `,
    [newRole, projectId, memberId],
  );

  return {
    status: "SUCCESS",
    role: newRole,
  };
}

// ======================================================
// SAIR DO PROJETO
// ======================================================
async function leaveProject(projectId, userId) {
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

  const project = projects[0];

  const permission = await getProjectPermission(projectId, userId);

  if (!permission.isMember) {
    return { status: "FORBIDDEN" };
  }

  if (project.owner_id === userId) {
    return { status: "OWNER_CANNOT_LEAVE" };
  }

  await db.query(
    `
    DELETE FROM project_members
    WHERE project_id = ?
      AND user_id = ?
    `,
    [projectId, userId],
  );

  return { status: "SUCCESS" };
}

// ======================================================
// CONSEGUIR PÁGINA DO PROJETO
// ======================================================
async function getProjectPage(projectId, userId) {
  // Conseguir projeto e verificar acesso do usuário
  const [projects] = await db.query(
    `
    SELECT
      p.id,
      p.name,
      p.description,
      p.owner_id,
      u.username AS owner_name
    FROM projects p
    JOIN users u
      ON u.id = p.owner_id
    LEFT JOIN project_members pm
      ON pm.project_id = p.id
      AND pm.user_id = ?
    WHERE p.id = ?
      AND (
        p.owner_id = ?
        OR pm.user_id IS NOT NULL
      )
    `,
    [userId, projectId, userId],
  );

  if (projects.length === 0) {
    return null;
  }

  const project = projects[0];

  // Conseguir membros do projeto.
  const [members] = await db.query(
    `
    SELECT
      u.id,
      u.username,
      pm.role
    FROM project_members pm
    JOIN users u
      ON u.id = pm.user_id
    WHERE pm.project_id = ?
    ORDER BY u.username ASC
    `,
    [projectId],
  );

  // Conseguir quadros do projeto.
  const [boards] = await db.query(
    `
    SELECT
      id,
      name,
      created_at,
      updated_at
    FROM boards
    WHERE project_id = ?
    ORDER BY created_at ASC
    `,
    [projectId],
  );

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    owner: {
      id: project.owner_id,
      username: project.owner_name,
    },
    members,
    boards,
  };
}

// ======================================================

module.exports = {
  createProject,
  deleteProject,
  getProjects,
  updateProject,
  addProjectMember,
  removeProjectMember,
  changeProjectMemberRole,
  leaveProject,
  getProjectPage,
};
