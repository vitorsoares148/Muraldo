import api from "./axios";

export async function createComment(taskId: number, content: string) {
  const response = await api.post(`/api/tasks/${taskId}/comments`, {
    content,
  });

  return response.data;
}

export async function deleteComment(id: number) {
  const response = await api.delete(`/api/comments/${id}`);
  
  return response.data;
}

export async function getComments(taskId: number) {
  const response = await api.get(`/api/tasks/${taskId}/comments`);

  return response.data;
}