import api from "./axios";

export async function getProjects() {
  const response = await api.get(`/api/projects`);

  return response.data;
}

export async function getProjectPage(id: number) {
  const response = await api.get(`/api/projects/${id}`);

  return response.data;
}

export async function createProject(name: string, description: string) {
  const response = await api.post(`/api/projects`, {
    name,
    description,
  });

  return response.data;
}

export async function deleteProject(id: number) {
  const response = await api.delete(`/api/projects/${id}`);

  return response.data;
}

export async function addProjectMember(id: number, username: string) {
  const response = await api.post(`/api/projects/${id}/members`, { username });

  return response.data;
}

export async function removeProjectMember(id: number, userId: number) {
  const response = await api.delete(`/api/projects/${id}/members/${userId}`);

  return response.data;
}

export async function changeProjectMemberRole(id: number, userId: number) {
  const response = await api.patch(
    `/api/projects/${id}/members/${userId}/role`,
  );

  return response.data;
}

export async function leaveProject(id: number) {
  const response = await api.delete(`/api/projects/${id}/leave`);

  return response.data;
}

export async function updateProject({
  id,
  name,
  description,
}: {
  id: number;
  name: string;
  description: string;
}) {
  const response = await api.put(`/api/projects/${id}`, {
    id,
    name,
    description,
  });

  return response.data;
}
