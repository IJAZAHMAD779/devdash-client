export interface SnippetProjectRef {
  id: string;
  title: string;
}

export interface Snippet {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  description: string | null;
  language: string;
  code: string;
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  project?: SnippetProjectRef | null;
}

export interface CreateSnippetPayload {
  title: string;
  description?: string;
  language: string;
  code: string;
  tags?: string[];
  projectId?: string | null;
  favorite?: boolean;
}

export interface UpdateSnippetPayload {
  title?: string;
  description?: string | null;
  language?: string;
  code?: string;
  tags?: string[];
  projectId?: string | null;
  favorite?: boolean;
}
