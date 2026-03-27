export type TaskUser = {
  id: string;
  name: string | null;
  email: string | null;
};

export type TaskStatus = "TODO" | "DOING" | "DONE";

export type Task = {
  id: string;
  name: string;
  description: string;
  status: TaskStatus;
  statusAt: string;
  position: number;
  assignees: TaskUser[];
};
