import {
  createComment as apiCreateComment,
  deleteComment as apiDeleteComment,
  getComments as apiGetComments,
} from "../api/comments.api";

export function createComment(taskId: number, content: string) {
  return apiCreateComment(taskId, content);
}

export function deleteComment(id: number) {
  return apiDeleteComment(id);
}

export function getComments(taskId: number) {
  return apiGetComments(taskId);
}

