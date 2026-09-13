import api from "./axios";

export async function createColumn(boardId: number, name: string) {
  const response = await api.post(`/api/boards/${boardId}/columns`, {
    name,
  });

  return response.data;
}

export async function deleteColumn(id: number) {
  const response = await api.delete(`/api/columns/${id}`);
  
  return response.data;
}

export async function getColumns(boardId: number) {
  const response = await api.get(`/api/boards/${boardId}/columns`);

  return response.data;
}

export async function updateColumnsPosition(id: number, position: number) {
  const response = await api.patch(`/api/columns/${id}/position`, {
    position,
  });

  return response.data;
}
