import api from "./axios";

export async function createBoard(projectId: number, name: string) {
  const response = await api.post(`/api/projects/${projectId}/boards`, {
    name,
  });

  return response.data;
}

export async function deleteBoard(id: number) {
  const response = await api.delete(`/api/boards/${id}`);

  return response.data;
}
