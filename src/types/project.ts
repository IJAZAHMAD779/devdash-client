export type ProjectStatus =
  | "PLANNING"
  | "IN_PROGRESS"
  | "ON_HOLD"
  | "COMPLETED"
  | "ARCHIVED";

export interface ProjectCount {
  tasks: number;
  snippets: number;
  components: number;
  notes: number;
  bookmarks: number;
}

export interface Project {
  id: string;
  userId: string;
  title: string;
  description: string | null;
  status: ProjectStatus;
  repositoryUrl: string | null;
  liveUrl: string | null;
  techStack: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: ProjectCount;
}

export interface CreateProjectPayload {
  title: string;
  description?: string;
  status?: ProjectStatus;
  repositoryUrl?: string;
  liveUrl?: string;
  techStack?: string[];
  favorite?: boolean;
}

export interface UpdateProjectPayload extends Partial<CreateProjectPayload> {}
