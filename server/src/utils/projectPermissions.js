const db = require("../../db");

async function getProjectPermission(projectId, userId) {
  const [projects] = await db.query(
    `
    SELECT owner_id
    FROM projects
    WHERE id = ?
    `,
    [projectId],
  );

  if (projects.length === 0) {
    return null;
  }

  const isOwner = projects[0].owner_id === userId;

  if (isOwner) {
    return {
      role: "owner",
      isOwner: true,
      isAdmin: false,
      isMember: true,
    };
  }

  const [members] = await db.query(
    `
    SELECT role
    FROM project_members
    WHERE project_id = ?
      AND user_id = ?
    `,
    [projectId, userId],
  );

  if (members.length === 0) {
    return {
      role: null,
      isOwner: false,
      isAdmin: false,
      isMember: false,
    };
  }

  const isAdmin = members[0].role === "admin";

  return {
    role: members[0].role,
    isOwner: false,
    isAdmin,
    isMember: true,
  };
}

module.exports = {
  getProjectPermission,
};
