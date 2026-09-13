const projectsService = require("../services/projects.service");
const { isValidString } = require("../utils/validateString");

// ======================================================
// CRIAR PROJETO
// ======================================================
async function createProject(req, res) {
  try {
    const { name, description } = req.body;

    if (!isValidString(name, 40)) {
      return res.status(400).json({
        error: "INVALID_PROJECT_NAME",
      });
    }

    if (!isValidString(description, 200)) {
      return res.status(400).json({
        error: "INVALID_PROJECT_DESCRIPTION",
      });
    }

    const projectId = await projectsService.createProject(
      req.userId,
      name.trim(),
      description?.trim() || null,
    );

    return res.status(201).json({
      message: "SUCCESS",
      projectId,
    });
  } catch (error) {
    console.error("Error creating project:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// DELETAR PROJETO
// ======================================================
async function deleteProject(req, res) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        error: "INVALID_PROJECT_ID",
      });
    }

    const deleted = await projectsService.deleteProject(projectId, req.userId);

    if (!deleted) {
      return res.status(404).json({
        error: "PROJECT_NOT_FOUND",
      });
    }

    return res.json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Error deleting project:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// CONSEGUIR PROJETOS
// ======================================================
async function getProjects(req, res) {
  try {
    const projects = await projectsService.getProjects(req.userId);

    return res.json({
      message: "SUCCESS",
      projects,
    });
  } catch (error) {
    console.error("Error getting projects:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// ATUALIZAR PROJETO
// ======================================================
async function updateProject(req, res) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        error: "INVALID_PROJECT_ID",
      });
    }

    const { name, description } = req.body;

    if (!isValidString(name, 40)) {
      return res.status(400).json({
        error: "INVALID_PROJECT_NAME",
      });
    }

    if (!isValidString(description, 100)) {
      return res.status(400).json({
        error: "INVALID_PROJECT_DESCRIPTION",
      });
    }

    const result = await projectsService.updateProject(
      projectId,
      req.userId,
      name.trim(),
      description?.trim() || null,
    );

    if (result.status === "NOT_FOUND") {
      return res.status(404).json({
        error: "PROJECT_NOT_FOUND",
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
    console.error("Error updating project:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// ADICIONAR MEMBRO
// ======================================================
async function addProjectMember(req, res) {
  try {
    const projectId = Number(req.params.id);
    const { username } = req.body;

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        error: "INVALID_PROJECT_ID",
      });
    }

    if (!username || typeof username !== "string" || !username.trim()) {
      return res.status(400).json({
        error: "USERNAME_REQUIRED",
      });
    }

    const result = await projectsService.addProjectMember(
      projectId,
      req.userId,
      username.trim(),
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

    if (result.status === "USER_NOT_FOUND") {
      return res.status(404).json({
        error: "USER_NOT_FOUND",
      });
    }

    if (result.status === "ALREADY_MEMBER") {
      return res.status(409).json({
        error: "ALREADY_MEMBER",
      });
    }

    return res.status(201).json({
      message: "SUCCESS",
      user: result.user,
    });
  } catch (error) {
    console.error("Error adding project member:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// REMOVER MEMBRO
// ======================================================
async function removeProjectMember(req, res) {
  try {
    const projectId = Number(req.params.id);
    const memberId = Number(req.params.userId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        error: "INVALID_PROJECT_ID",
      });
    }

    if (!Number.isInteger(memberId) || memberId <= 0) {
      return res.status(400).json({
        error: "INVALID_USER_ID",
      });
    }

    const result = await projectsService.removeProjectMember(
      projectId,
      req.userId,
      memberId,
    );

    if (result.status === "CANNOT_REMOVE_SELF") {
      return res.status(400).json({ error: "CANNOT_REMOVE_SELF" });
    }

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

    if (result.status === "CANNOT_REMOVE_OWNER") {
      return res.status(400).json({
        error: "CANNOT_REMOVE_OWNER",
      });
    }

    if (result.status === "MEMBER_NOT_FOUND") {
      return res.status(404).json({
        error: "MEMBER_NOT_FOUND",
      });
    }

    return res.json({
      message: "SUCCESS",
    });
  } catch (error) {
    console.error("Error removing project member:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// MUDAR CARGO DE UM MEMBRO
// ======================================================
async function changeProjectMemberRole(req, res) {
  try {
    const projectId = Number(req.params.id);
    const memberId = Number(req.params.userId);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        error: "INVALID_PROJECT_ID",
      });
    }

    if (!Number.isInteger(memberId) || memberId <= 0) {
      return res.status(400).json({
        error: "INVALID_USER_ID",
      });
    }

    const result = await projectsService.changeProjectMemberRole(
      projectId,
      req.userId,
      memberId,
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

    if (result.status === "CANNOT_CHANGE_OWNER") {
      return res.status(400).json({
        error: "CANNOT_CHANGE_OWNER",
      });
    }

    if (result.status === "MEMBER_NOT_FOUND") {
      return res.status(404).json({
        error: "MEMBER_NOT_FOUND",
      });
    }

    return res.json({
      message: "SUCCESS",
      role: result.role,
    });
  } catch (error) {
    console.error("Error changing project member role:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// SAIR DO PROJETO
// ======================================================
async function leaveProject(req, res) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        error: "INVALID_PROJECT_ID",
      });
    }

    const result = await projectsService.leaveProject(projectId, req.userId);

    if (result.status === "PROJECT_NOT_FOUND") {
      return res.status(404).json({
        error: "PROJECT_NOT_FOUND",
      });
    }

    if (result.status === "OWNER_CANNOT_LEAVE") {
      return res.status(400).json({
        error: "OWNER_CANNOT_LEAVE",
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
    console.error("Error leaving project:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
}

// ======================================================
// CONSEGUIR PÁGINA DO PROJETO
// ======================================================
async function getProjectPage(req, res) {
  try {
    const projectId = Number(req.params.id);

    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({
        error: "INVALID_PROJECT_ID",
      });
    }

    const project = await projectsService.getProjectPage(projectId, req.userId);

    if (!project) {
      return res.status(404).json({
        error: "PROJECT_NOT_FOUND",
      });
    }

    return res.json({
      message: "SUCCESS",
      project,
    });
  } catch (error) {
    console.error("Error getting project:", error);

    return res.status(500).json({
      error: "INTERNAL_SERVER_ERROR",
    });
  }
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
