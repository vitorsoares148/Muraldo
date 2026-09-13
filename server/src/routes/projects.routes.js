const express = require("express");

const {
  createProject,
  deleteProject,
  updateProject,
  getProjects,
  addProjectMember,
  changeProjectMemberRole,
  removeProjectMember,
  leaveProject,
  getProjectPage,
} = require("../controllers/projects.controller");

const { authenticateToken } = require("../middleware/authenticateToken");

const router = express.Router();

router.get("/", authenticateToken, getProjects);

router.get("/:id", authenticateToken, getProjectPage);

router.post("/:id/members", authenticateToken, addProjectMember);

router.delete("/:id/members/:userId", authenticateToken, removeProjectMember);

router.delete("/:id/leave", authenticateToken, leaveProject);

router.patch(
  "/:id/members/:userId/role",
  authenticateToken,
  changeProjectMemberRole,
);

router.post("/", authenticateToken, createProject);

router.put("/:id", authenticateToken, updateProject);

router.delete("/:id", authenticateToken, deleteProject);

module.exports = router;
