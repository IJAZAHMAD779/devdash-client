export type BookmarkCategory =
  | "DOCS"
  | "ARTICLE"
  | "TOOL"
  | "LIBRARY"
  | "VIDEO"
  | "TUTORIAL";

export interface BookmarkProjectRef {
  id: string;
  title: string;
}

export interface Bookmark {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  url: string;
  category: BookmarkCategory;
  tags: string[];
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  project?: BookmarkProjectRef | null;
}

export interface CreateBookmarkPayload {
  title: string;
  url: string;
  category?: BookmarkCategory;
  tags?: string[];
  notes?: string | null;
  projectId?: string | null;
}

export interface UpdateBookmarkPayload {
  title?: string;
  url?: string;
  category?: BookmarkCategory;
  tags?: string[];
  notes?: string | null;
  projectId?: string | null;
}
