export interface NoteProjectRef {
  id: string;
  title: string;
}

export interface Note {
  id: string;
  userId: string;
  projectId: string | null;
  title: string;
  content: string; // Markdown
  tags: string[];
  favorite: boolean;
  createdAt: string;
  updatedAt: string;
  project?: NoteProjectRef | null;
}

export interface CreateNotePayload {
  title: string;
  content: string;
  tags?: string[];
  favorite?: boolean;
  projectId?: string | null;
}

export interface UpdateNotePayload {
  title?: string;
  content?: string;
  tags?: string[];
  favorite?: boolean;
  projectId?: string | null;
}
