export interface BookmarkCategoryConfig {
  id: string;
  label: string;
  badgeClass: string;
}

export const PRESET_BOOKMARK_CATEGORIES: BookmarkCategoryConfig[] = [
  { id: "tools", label: "Tools", badgeClass: "bg-amber-500/10 text-amber-300 border-amber-500/20" },
  { id: "repo", label: "Repo", badgeClass: "bg-purple-500/10 text-purple-300 border-purple-500/20" },
  { id: "design", label: "Design", badgeClass: "bg-pink-500/10 text-pink-300 border-pink-500/20" },
  { id: "hosting", label: "Hosting", badgeClass: "bg-cyan-500/10 text-cyan-300 border-cyan-500/20" },
  { id: "prompts", label: "Prompts", badgeClass: "bg-indigo-500/10 text-indigo-300 border-indigo-500/20" },
  { id: "cloud", label: "Cloud", badgeClass: "bg-sky-500/10 text-sky-300 border-sky-500/20" },
  { id: "docs", label: "Docs", badgeClass: "bg-emerald-500/10 text-emerald-300 border-emerald-500/20" },
  { id: "libraries", label: "Libraries", badgeClass: "bg-violet-500/10 text-violet-300 border-violet-500/20" },
  { id: "tutorials", label: "Tutorials", badgeClass: "bg-teal-500/10 text-teal-300 border-teal-500/20" },
  { id: "videos", label: "Videos", badgeClass: "bg-rose-500/10 text-rose-300 border-rose-500/20" },
  { id: "articles", label: "Articles", badgeClass: "bg-blue-500/10 text-blue-300 border-blue-500/20" },
];

export type BookmarkCategory = string;

export interface BookmarkPreviewData {
  title: string;
  description: string;
  favicon: string;
  domain: string;
  url: string;
}

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
  favorite: boolean;
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
  favorite?: boolean;
}

export interface UpdateBookmarkPayload {
  title?: string;
  url?: string;
  category?: BookmarkCategory;
  tags?: string[];
  notes?: string | null;
  projectId?: string | null;
  favorite?: boolean;
}

export interface BatchCreateBookmarksPayload {
  bookmarks: CreateBookmarkPayload[];
}

export interface ImportedBookmarkItem {
  id: string;
  title: string;
  url: string;
  category: string;
  folderPath: string[];
  addDate?: string;
  icon?: string;
  selected: boolean;
}

export interface BatchEnrichPayload {
  category?: string;
  limit?: number;
  bookmarkIds?: string[];
}

export interface BatchEnrichResponse {
  enrichedCount: number;
  bookmarks: Bookmark[];
}

export interface ClearBookmarkNotesPayload {
  category?: string;
  bookmarkIds?: string[];
}

export interface ClearBookmarkNotesResponse {
  clearedCount: number;
}

