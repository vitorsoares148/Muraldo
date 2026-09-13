import {
  createBoard as apiCreateBoard,
  deleteBoard as apiDeleteBoard,
} from "../api/boards.api";

export function createBoard(projectId: number, name: string) {
  return apiCreateBoard(projectId, name);
}

export function deleteBoard(id: number) {
  return apiDeleteBoard(id);
}
