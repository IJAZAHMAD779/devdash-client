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
  tasks?: Array<{
    id: string;
    title: string;
    status: "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE";
    priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
    dueDate?: string | null;
    completedAt?: string | null;
  }>;
  snippets?: Array<{
    id: string;
    title: string;
    language: string;
  }>;
  components?: Array<{
    id: string;
    name: string;
    framework: string;
  }>;
  notes?: Array<{
    id: string;
    title: string;
    isPinned: boolean;
  }>;
  bookmarks?: Array<{
    id: string;
    title: string;
    url: string;
  }>;
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

export interface ProjectPreviewData {
  title: string;
  description: string;
  image: string | null;
  favicon: string;
  domain: string;
  url: string;
}

export interface GitHubRepoStats {
  owner: string;
  repo: string;
  fullName: string;
  stars: number;
  openIssues: number;
  forks: number;
  language: string | null;
  pushedAt: string | null;
  defaultBranch: string;
  description: string | null;
  htmlUrl: string;
}
