import {
  createColumn as apiCreateColumn,
  deleteColumn as apiDeleteColumn,
  getColumns as apiGetColumns,
  updateColumnsPosition as apiUpdateColumnsPosition,
} from "../api/columns.api";

export function createColumn(boardId: number, name: string) {
  return apiCreateColumn(boardId, name);
}

export function deleteColumn(id: number) {
  return apiDeleteColumn(id);
}

export function getColumns(boardId: number) {
  return apiGetColumns(boardId);
}

export function updateColumnsPosition(id: number, position: number) {
  return apiUpdateColumnsPosition(id, position);
}
