export type AiRole = "user" | "assistant" | "system";

export type AiActionType =
  | "TASK"
  | "REMINDER"
  | "NOTE"
  | "SNIPPET"
  | "BOOKMARK"
  | "QUERY";

export interface ExecutedAction {
  type: AiActionType;
  title: string;
  id?: string;
  details?: Record<string, any>;
  url?: string;
}

export interface AiMessage {
  id: string;
  role: AiRole;
  content: string;
  timestamp: string;
  actions?: ExecutedAction[];
}

export interface AiCommandPayload {
  message: string;
  clientTime?: string;
  timezone?: string;
  history?: Array<{
    role: "user" | "assistant" | "system";
    content: string;
  }>;
}

export interface AiCommandResponse {
  reply: string;
  actions: ExecutedAction[];
  modelUsed: string;
}

export interface AiStatusResponse {
  configured: boolean;
  model: string;
  provider: string;
}
