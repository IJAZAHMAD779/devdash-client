export interface Reminder {
  id: string;
  userId: string;
  title: string;
  description?: string | null;
  remindAt: string;
  isSent: boolean;
  sentAt?: string | null;
  taskId?: string | null;
  task?: {
    id: string;
    title: string;
    status: string;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateReminderInput {
  title: string;
  description?: string;
  remindAt: string; // ISO string
  taskId?: string;
  recipientEmail?: string;
}
