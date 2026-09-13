import type { PriorityLevel } from "../constants/priorities";
import api from "./axios";

export async function createTask(
  columnId: number,
  description: string,
  priority: PriorityLevel,
  dueDate: string | null,
  assignedTo: number | null,
) {
  const response = await api.post(`/api/columns/${columnId}/tasks`, {
    assignedTo,
    description,
    priority,
    dueDate,
  });

  return response.data;
}

export async function deleteTask(id: number) {
  const response = await api.delete(`/api/tasks/${id}`);

  return response.data;
}

export async function getTasks(columnId: number) {
  const response = await api.get(`/api/columns/${columnId}/tasks`);

  return response.data;
}

export async function finishTask(id: number) {
  const response = await api.put(`/api/tasks/${id}/finish`);

  return response.data;
}

export async function updateTasksPosition(
  id: number,
  columnId: number,
  position: number,
) {
  const response = await api.patch(`/api/tasks/${id}/position`, {
    columnId,
    position,
  });

  return response.data;
}
