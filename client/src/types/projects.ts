import type { PriorityLevel } from "../constants/priorities";

export type Project = {
  id: number;
  name: string;
  description: string;
  owner_id: number;
};

export type Owner = {
  id: number;
  username: string;
};

export type Member = {
  id: number;
  username: string;
  role: "admin" | "member";
};

export type Board = {
  id: number;
  name: string;
};

export type Column = {
  id: number;
  name: string;
  position: number;
  tasks: Array<Task>;
};

export type Task = {
  id: number;
  assigned_to: number | null;
  assigned_username: string | null;
  column_id: number;
  position: number;
  description: string;
  priority: PriorityLevel;
  due_date: string | null;
  read_by: Array<number>;
  finished?: boolean;
  finish_date?: string;
};

export type Comment = {
  id: number;
  user_id: number;
  content: string;
  created_at: string;
  comment_username: string;
}

export type ProjectPage = {
  id: number;
  name: string;
  description: string;
  owner: Owner;
  members: Array<Member>;
  boards: Array<Board>;
};
