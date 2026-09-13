import {
  createTask as apiCreateTask,
  deleteTask as apiDeleteTask,
  getTasks as apiGetTasks,
  finishTask as apiFinishTask,
  updateTasksPosition as apiUpdateTasksPosition,
} from "../api/tasks.api";
import type { PriorityLevel } from "../constants/priorities";

export function createTask(
  columnId: number,
  description: string,
  priority: PriorityLevel,
  dueDate: string | null,
  assignedTo: number | null,
) {
  return apiCreateTask(
    columnId,
    description,
    priority,
    dueDate,
    assignedTo,
  );
}

export function deleteTask(id: number) {
  return apiDeleteTask(id);
}

export function getTasks(columnId: number) {
  return apiGetTasks(columnId);
}

export function finishTask(id: number) {
  return apiFinishTask(id);
}

export function updateTasksPosition(
  id: number,
  columnId: number,
  position: number,
) {
  return apiUpdateTasksPosition(id, columnId, position);
}
