"use client";

import { useState, useEffect } from "react";
import {
  Save,
  Star,
  Eye,
  Edit3,
  Columns,
  FolderKanban,
  Tag,
  X,
  Loader2,
  Trash2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { Note } from "@/types/note";
import {
  useCreateNote,
  useUpdateNote,
  useDeleteNote,
} from "@/hooks/use-notes";
import { useProjects } from "@/hooks/use-projects";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

const MarkdownPreview = dynamic(
  () => import("./markdown-preview").then((mod) => mod.MarkdownPreview),
  {
    ssr: false,
    loading: () => (
      <div className="p-6 text-xs text-ink-muted">Loading preview...</div>
    ),
  }
);

interface Props {
  activeNote: Note | null;
  isNew: boolean;
  onSaved: (note: Note) => void;
  onDeleted: () => void;
}

export function NotesEditor({ activeNote, isNew, onSaved, onDeleted }: Props) {
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const { data: projects } = useProjects();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [favorite, setFavorite] = useState(false);
  const [viewMode, setViewMode] = useState<"edit" | "split" | "preview">("split");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setProjectId(activeNote.projectId || "");
      setTags(activeNote.tags || []);
      setFavorite(activeNote.favorite);
      setHasUnsavedChanges(false);
    } else if (isNew) {
      setTitle("Untitled Note");
      setContent("## Overview\n\nStart typing markdown here...\n\n- Key feature 1\n- Key feature 2\n\n```typescript\nconst message = 'Hello DevDash';\n```");
      setProjectId("");
      setTags([]);
      setFavorite(false);
      setHasUnsavedChanges(true);
    }
  }, [activeNote, isNew]);

  const handleAddTag = (e: React.KeyboardEvent) => {
    if ((e.key === "Enter" || e.key === ",") && tagInput.trim()) {
      e.preventDefault();
      const clean = tagInput.trim().replace(/^#/, "");
      if (clean && !tags.includes(clean)) {
        setTags([...tags, clean]);
        setHasUnsavedChanges(true);
      }
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    if (!title.trim()) {
      toast.warning("Note title required", { description: "Please enter a title for your note." });
      return;
    }

    sound.playClick(900);

    const saveAction = (isNew || !activeNote)
      ? createNote.mutateAsync({
          title: title.trim(),
          content,
          projectId: projectId || null,
          tags,
          favorite,
        })
      : updateNote.mutateAsync({
          id: activeNote.id,
          payload: {
            title: title.trim(),
            content,
            projectId: projectId || null,
            tags,
            favorite,
          },
        });

    try {
      const saved = await toast.promise(saveAction, {
        loading: "Saving note...",
        success: (res) => `Note "${res.title}" saved.`,
        error: "Failed to save note",
      });
      sound.playSuccess();
      setHasUnsavedChanges(false);
      onSaved(saved);
    } catch {
      // toast.promise displays error
    }
  };

  const handleDelete = () => {
    if (!activeNote) return;
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!activeNote) return;
    try {
      await deleteNote.mutateAsync(activeNote.id);
      toast.success("Note deleted", {
        description: `"${activeNote.title}" has been removed.`,
      });
      onDeleted();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  if (!activeNote && !isNew) {
    return (
      <div className="flex-1 flex items-center justify-center p-8 text-center text-ink-muted text-xs">
        Select a note from the left list or create a new note to start writing.
      </div>
    );
  }

  const isSaving = createNote.isPending || updateNote.isPending;

  return (
    <div className="flex-1 flex flex-col h-full bg-canvas overflow-hidden">
      {/* Top action toolbar */}
      <div className="px-6 py-3 border-b border-hairline bg-surface-1/60 flex items-center justify-between gap-4">
        {/* Title Input */}
        <input
          type="text"
          placeholder="Note title..."
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasUnsavedChanges(true);
          }}
          className="text-base font-semibold tracking-[-0.3px] text-ink bg-transparent focus:outline-none flex-1 placeholder:text-ink-tertiary"
        />

        <div className="flex items-center gap-2 shrink-0">
          {/* Mode Switcher */}
          <div className="flex items-center bg-surface-2 rounded-lg p-0.5 border border-hairline">
            <button
              onClick={() => {
                sound.playClick(800);
                setViewMode("edit");
              }}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                viewMode === "edit"
                  ? "bg-surface-3 text-ink shadow-xs"
                  : "text-ink-tertiary hover:text-ink"
              )}
              title="Markdown Editor"
            >
              <Edit3 className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playClick(800);
                setViewMode("split");
              }}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer hidden md:block",
                viewMode === "split"
                  ? "bg-surface-3 text-ink shadow-xs"
                  : "text-ink-tertiary hover:text-ink"
              )}
              title="Split View"
            >
              <Columns className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playClick(800);
                setViewMode("preview");
              }}
              className={cn(
                "p-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer",
                viewMode === "preview"
                  ? "bg-surface-3 text-ink shadow-xs"
                  : "text-ink-tertiary hover:text-ink"
              )}
              title="Rendered Preview"
            >
              <Eye className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Favorite Toggle */}
          <button
            onClick={() => {
              sound.playClick(800);
              setFavorite(!favorite);
              setHasUnsavedChanges(true);
            }}
            className={cn(
              "p-2 rounded-md border text-xs transition-colors cursor-pointer",
              favorite
                ? "bg-amber-500/15 border-amber-500/30 text-amber-300"
                : "bg-surface-2 border-hairline text-ink-muted hover:text-ink"
            )}
            title={favorite ? "Starred" : "Star note"}
          >
            <Star
              className={cn("w-3.5 h-3.5", favorite && "fill-amber-400")}
            />
          </button>

          {/* Delete Button (if existing note) */}
          {activeNote && (
            <button
              onClick={handleDelete}
              className="p-2 rounded-md bg-surface-2 hover:bg-semantic-error/15 border border-hairline hover:border-semantic-error/30 text-ink-tertiary hover:text-semantic-error transition-colors cursor-pointer"
              title="Delete note"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={isSaving || !title.trim()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-tight shadow-sm shadow-primary/25 disabled:opacity-50 transition-all duration-150 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>{hasUnsavedChanges ? "Save Changes" : "Saved"}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Secondary Meta Row: Project & Tags */}
      <div className="px-6 py-2.5 border-b border-hairline bg-surface-1/30 flex items-center gap-4 flex-wrap text-xs">
        {/* Project Selector */}
        <div className="flex items-center gap-1.5">
          <FolderKanban className="w-3.5 h-3.5 text-ink-tertiary" />
          <select
            value={projectId}
            onChange={(e) => {
              setProjectId(e.target.value);
              setHasUnsavedChanges(true);
            }}
            className="px-2 py-1 rounded bg-surface-2 border border-hairline text-xs text-ink focus:border-primary focus:outline-none"
          >
            <option value="">No Project Linked</option>
            {projects?.map((p) => (
              <option key={p.id} value={p.id}>
                {p.title}
              </option>
            ))}
          </select>
        </div>

        {/* Tags */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag className="w-3.5 h-3.5 text-ink-tertiary" />
          {tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded bg-surface-2 text-ink border border-hairline"
            >
              #{tag}
              <button
                type="button"
                onClick={() => handleRemoveTag(tag)}
                className="text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
          <input
            type="text"
            placeholder="Add tag (Enter)..."
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
            className="bg-transparent text-xs text-ink placeholder:text-ink-tertiary focus:outline-none min-w-[100px]"
          />
        </div>
      </div>

      {/* Editor / Preview Work Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Source Markdown Editor */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div
            className={cn(
              "flex-1 flex flex-col p-6 overflow-y-auto",
              viewMode === "split" && "border-r border-hairline"
            )}
          >
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Write your markdown note here..."
              className="w-full flex-1 bg-transparent text-xs font-mono text-ink placeholder:text-ink-tertiary focus:outline-none resize-none leading-relaxed"
            />
          </div>
        )}

        {/* Rendered Preview Panel */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="flex-1 p-6 overflow-y-auto bg-surface-1/10">
            <MarkdownPreview content={content} />
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        description={`Are you sure you want to delete note "${activeNote?.title}"?`}
        confirmText="Delete Note"
        variant="danger"
        isLoading={deleteNote.isPending}
      />
    </div>
  );
}
