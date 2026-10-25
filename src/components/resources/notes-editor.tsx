"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Star,
  FolderKanban,
  Trash2,
  ChevronLeft,
  PanelLeftOpen,
  MoreHorizontal,
  Check,
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
import { TagInput } from "@/components/snippets/tag-input";
import { SaveStatus } from "./save-status";
import { ModeSegmented, NoteViewMode } from "./mode-segmented";

const MarkdownPreview = dynamic(
  () => import("./markdown-preview").then((mod) => mod.MarkdownPreview),
  {
    ssr: false,
    loading: () => (
      <div className="p-8 text-xs text-ink-subtle italic">Loading preview…</div>
    ),
  }
);

interface Props {
  activeNote: Note | null;
  isNew: boolean;
  onSaved: (note: Note) => void;
  onDeleted: () => void;
  onBackToList?: () => void;
  isSidebarCollapsed?: boolean;
  onToggleSidebar?: () => void;
}

export function NotesEditor({
  activeNote,
  isNew,
  onSaved,
  onDeleted,
  onBackToList,
  isSidebarCollapsed,
  onToggleSidebar,
}: Props) {
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  const { data: projects } = useProjects();

  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [projectId, setProjectId] = useState<string>("");
  const [tags, setTags] = useState<string[]>([]);
  const [favorite, setFavorite] = useState(false);
  const [viewMode, setViewMode] = useState<NoteViewMode>("edit");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isProjectMenuOpen, setIsProjectMenuOpen] = useState(false);
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);

  const titleInputRef = useRef<HTMLInputElement>(null);
  const projectMenuRef = useRef<HTMLDivElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Sync state on note selection or creating new
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title);
      setContent(activeNote.content);
      setProjectId(activeNote.projectId || "");
      setTags(activeNote.tags || []);
      setFavorite(activeNote.favorite);
      setHasUnsavedChanges(false);
    } else if (isNew) {
      setTitle("");
      setContent("");
      setProjectId("");
      setTags([]);
      setFavorite(false);
      setHasUnsavedChanges(true);
      setTimeout(() => titleInputRef.current?.focus(), 50);
    } else {
      setTitle("");
      setContent("");
      setProjectId("");
      setTags([]);
      setFavorite(false);
      setHasUnsavedChanges(false);
    }
  }, [activeNote, isNew]);

  // Close menus on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (
        projectMenuRef.current &&
        !projectMenuRef.current.contains(e.target as Node)
      ) {
        setIsProjectMenuOpen(false);
      }
      if (
        moreMenuRef.current &&
        !moreMenuRef.current.contains(e.target as Node)
      ) {
        setIsMoreMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  const isSaving = createNote.isPending || updateNote.isPending;

  const handleSave = async () => {
    if (!title.trim() || isSaving) return;
    sound.playClick(950);

    try {
      if (isNew || !activeNote) {
        const created = await createNote.mutateAsync({
          title: title.trim(),
          content,
          projectId: projectId || null,
          tags,
          favorite,
        });
        sound.playSuccess();
        toast.success("Note created", { description: `"${created.title}" saved.` });
        setHasUnsavedChanges(false);
        onSaved(created);
      } else {
        const updated = await updateNote.mutateAsync({
          id: activeNote.id,
          payload: {
            title: title.trim(),
            content,
            projectId: projectId || null,
            tags,
            favorite,
          },
        });
        sound.playSuccess();
        toast.success("Note saved", { description: `Changes to "${updated.title}" saved.` });
        setHasUnsavedChanges(false);
        onSaved(updated);
      }
    } catch {
      toast.error("Failed to save note");
    }
  };

  // Keyboard shortcut Cmd/Ctrl + S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === "s" || e.key === "S")) {
        if (activeNote || isNew) {
          e.preventDefault();
          handleSave();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeNote, isNew, title, content, projectId, tags, favorite, isSaving]);

  const handleConfirmDelete = async () => {
    if (!activeNote) return;
    try {
      await deleteNote.mutateAsync(activeNote.id);
      sound.playSuccess();
      toast.success("Note deleted", {
        description: `"${activeNote.title}" removed.`,
      });
      setShowDeleteConfirm(false);
      onDeleted();
    } catch {
      toast.error("Failed to delete note");
    }
  };

  const handleToggleStar = () => {
    sound.playClick(favorite ? 600 : 850);
    const next = !favorite;
    setFavorite(next);
    setHasUnsavedChanges(true);
  };

  if (!activeNote && !isNew) {
    return (
      <div className="flex-1 h-full flex flex-col items-center justify-center p-8 text-center select-none bg-surface-1/20">
        <div className="max-w-sm space-y-2">
          <p className="text-xs text-ink-subtle">
            Select a note from the sidebar or create a new one.
          </p>
        </div>
      </div>
    );
  }

  const selectedProject = projects?.find((p) => p.id === projectId);

  return (
    <div className="flex-1 h-full flex flex-col overflow-hidden bg-surface-1/10">
      {/* Row 1: Title Input Alone (full width, 18-20px semibold, accent underline on focus) */}
      <div className="px-6 pt-5 pb-2 flex items-center gap-3 shrink-0">
        {onBackToList && (
          <button
            type="button"
            onClick={onBackToList}
            className="md:hidden p-1.5 rounded-[6px] hover:bg-surface-2 text-ink-muted hover:text-ink cursor-pointer shrink-0"
            title="Back to notes list"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
        )}

        {isSidebarCollapsed && onToggleSidebar && (
          <button
            type="button"
            onClick={onToggleSidebar}
            className="hidden md:flex p-1.5 rounded-[6px] hover:bg-surface-2 text-ink-muted hover:text-ink cursor-pointer shrink-0"
            title="Show note list"
            aria-label="Show note list"
          >
            <PanelLeftOpen className="w-4 h-4" />
          </button>
        )}

        <input
          ref={titleInputRef}
          type="text"
          placeholder="Note title…"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            setHasUnsavedChanges(true);
          }}
          className="flex-1 min-w-0 bg-transparent text-[19px] font-semibold tracking-card-title text-ink placeholder:text-ink-subtle focus:outline-none border-b border-transparent focus:border-accent pb-1 transition-colors leading-tight"
        />
      </div>

      {/* Row 2: Toolbar (36px high, wraps on narrow screens) */}
      <div className="px-6 py-2 border-b border-hairline bg-surface-1/40 flex items-center justify-between gap-3 flex-wrap shrink-0 min-h-[44px]">
        {/* Left: Project Popover + TagInput */}
        <div className="flex items-center gap-2.5 flex-wrap min-w-0">
          {/* Project Popover */}
          <div className="relative" ref={projectMenuRef}>
            <button
              type="button"
              onClick={() => setIsProjectMenuOpen(!isProjectMenuOpen)}
              className={cn(
                "h-7 px-2 rounded-[6px] text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer border select-none",
                selectedProject
                  ? "bg-surface-2 text-ink border-hairline"
                  : "bg-transparent text-ink-subtle hover:text-ink hover:bg-surface-2 border-hairline/60"
              )}
              title="Link project"
            >
              <FolderKanban className="w-3 h-3 text-ink-subtle shrink-0" />
              <span className="truncate max-w-[140px]">
                {selectedProject ? selectedProject.title : "No project"}
              </span>
            </button>

            {isProjectMenuOpen && (
              <div className="absolute left-0 top-full mt-1 w-52 rounded-[8px] bg-surface-1 border border-hairline-strong shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setProjectId("");
                    setHasUnsavedChanges(true);
                    setIsProjectMenuOpen(false);
                  }}
                  className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-surface-2 cursor-pointer text-ink-muted hover:text-ink"
                >
                  <span className="font-mono">No project</span>
                  {!projectId && <Check className="w-3.5 h-3.5 text-accent" />}
                </button>
                {projects?.map((p) => {
                  const isCur = p.id === projectId;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => {
                        setProjectId(p.id);
                        setHasUnsavedChanges(true);
                        setIsProjectMenuOpen(false);
                      }}
                      className="w-full px-3 py-1.5 flex items-center justify-between text-left hover:bg-surface-2 cursor-pointer text-ink-muted hover:text-ink truncate"
                    >
                      <span className="truncate">{p.title}</span>
                      {isCur && <Check className="w-3.5 h-3.5 text-accent shrink-0 ml-1.5" />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Tags via TagInput */}
          <div className="max-w-md">
            <TagInput
              tags={tags}
              onChange={(newTags) => {
                setTags(newTags);
                setHasUnsavedChanges(true);
              }}
              placeholder="Add tag…"
              className="py-0.5 px-1.5 min-h-[28px] border-hairline/60 bg-transparent hover:border-hairline"
            />
          </div>
        </div>

        {/* Right: ModeSegmented + Star + SaveStatus + More "⋯" menu */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Segmented Mode Control */}
          <ModeSegmented viewMode={viewMode} onChange={setViewMode} />

          {/* Star (ghost icon, filled --warn when starred, no box) */}
          <button
            type="button"
            onClick={handleToggleStar}
            className={cn(
              "p-1.5 rounded-[6px] hover:bg-surface-2 transition-colors cursor-pointer",
              favorite
                ? "text-warn"
                : "text-ink-subtle hover:text-warn"
            )}
            title={favorite ? "Unstar note" : "Star note"}
            aria-label={favorite ? "Unstar note" : "Star note"}
          >
            <Star
              className={cn("w-3.5 h-3.5", favorite && "fill-warn")}
            />
          </button>

          {/* Save Status Control */}
          <SaveStatus
            hasUnsavedChanges={hasUnsavedChanges}
            isSaving={isSaving}
            disabled={!title.trim()}
            onSave={handleSave}
          />

          {/* "⋯" Menu (Delete with Confirm) */}
          {activeNote && (
            <div className="relative" ref={moreMenuRef}>
              <button
                type="button"
                onClick={() => setIsMoreMenuOpen(!isMoreMenuOpen)}
                className="p-1.5 rounded-[6px] text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
                title="More actions"
                aria-label="More actions"
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </button>

              {isMoreMenuOpen && (
                <div className="absolute right-0 top-full mt-1 w-36 rounded-[8px] bg-surface-1 border border-hairline-strong shadow-xl py-1 z-50 animate-in fade-in zoom-in-95 duration-100 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setIsMoreMenuOpen(false);
                      setShowDeleteConfirm(true);
                    }}
                    className="w-full px-3 py-1.5 flex items-center gap-2 text-danger hover:bg-danger/10 text-left transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Editor / Preview Work Area */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {/* Source Markdown Editor */}
        {(viewMode === "edit" || viewMode === "split") && (
          <div
            className={cn(
              "flex-1 min-h-0 flex flex-col p-6 overflow-y-auto overscroll-contain touch-pan-y bg-surface-1",
              viewMode === "split" && "border-r border-hairline"
            )}
          >
            <textarea
              value={content}
              onChange={(e) => {
                setContent(e.target.value);
                setHasUnsavedChanges(true);
              }}
              placeholder="Write your markdown note here…"
              spellCheck={false}
              className="w-full flex-1 bg-transparent font-mono text-[13px] leading-[1.6] text-ink placeholder:text-ink-subtle focus:outline-none resize-none caret-accent"
            />
          </div>
        )}

        {/* Rendered Preview Panel (72ch column, 32px padding) */}
        {(viewMode === "preview" || viewMode === "split") && (
          <div className="flex-1 min-h-0 p-8 overflow-y-auto overscroll-contain touch-pan-y bg-surface-1/20">
            <MarkdownPreview content={content} noteTitle={title} />
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        description={`Are you sure you want to delete "${activeNote?.title}"? This action cannot be undone.`}
        confirmText="Delete Note"
        variant="danger"
        isLoading={deleteNote.isPending}
      />
    </div>
  );
}
