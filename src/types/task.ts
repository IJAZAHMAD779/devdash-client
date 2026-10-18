export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
export type Priority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

export interface TaskProjectRef {
  id: string;
  title: string;
}

export interface Task {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: Priority;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  project?: TaskProjectRef | null;
}

export interface CreateTaskPayload {
  title: string;
  description?: string;
  projectId?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
}

export interface UpdateTaskPayload {
  title?: string;
  description?: string | null;
  projectId?: string | null;
  status?: TaskStatus;
  priority?: Priority;
  dueDate?: string | null;
  completedAt?: string | null;
}
