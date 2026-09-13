import {
  getProjects as apiGetProjects,
  getProjectPage as apiGetProjectPage,
  createProject as apiCreateProject,
  addProjectMember as apiAddProjectMember,
  removeProjectMember as apiRemoveProjectMember,
  leaveProject as apiLeaveProject,
  changeProjectMemberRole as apiChangeProjectMemberRole,
  deleteProject as apiDeleteProject,
  updateProject as apiUpdateProject,
} from "../api/projects.api";

export function getProjects() {
  return apiGetProjects();
}

export function getProjectPage(id: number) {
  return apiGetProjectPage(id);
}

export function createProject(name: string, description: string) {
  return apiCreateProject(name, description);
}

export function deleteProject(id: number) {
  return apiDeleteProject(id);
}

export function addProjectMember(id: number, username: string) {
  return apiAddProjectMember(id, username);
}

export function removeProjectMember(id: number, userId: number) {
  return apiRemoveProjectMember(id, userId);
}

export function leaveProject(id: number) {
  return apiLeaveProject(id);
}

export function changeProjectMemberRole(id: number, userId: number) {
  return apiChangeProjectMemberRole(id, userId);
}

export function updateProject(id: number, name: string, description: string) {
  return apiUpdateProject({
    id,
    name,
    description,
  });
}
