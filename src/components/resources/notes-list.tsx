"use client";

import { useState } from "react";
import {
  Search,
  Plus,
  Star,
  BookOpen,
  FolderKanban,
  Tag,
  Trash2,
} from "lucide-react";
import { Note } from "@/types/note";
import { useToggleNoteFavorite, useDeleteNote } from "@/hooks/use-notes";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";
import { toast } from "@/lib/toast";

interface Props {
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (note: Note) => void;
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

export function NotesList({
  notes,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  searchQuery,
  onSearchChange,
}: Props) {
  const toggleFavorite = useToggleNoteFavorite();
  const deleteNote = useDeleteNote();
  const [deletingNote, setDeletingNote] = useState<Note | null>(null);

  const handleToggleStar = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    toggleFavorite.mutate({
      id: note.id,
      favorite: !note.favorite,
    });
  };

  const handleDelete = (e: React.MouseEvent, note: Note) => {
    e.stopPropagation();
    setDeletingNote(note);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNote) return;
    try {
      await deleteNote.mutateAsync(deletingNote.id);
      toast.success("Note deleted", {
        description: `"${deletingNote.title}" removed from notes.`,
      });
      setDeletingNote(null);
    } catch {
      toast.error("Failed to delete note");
    }
  };

  // Starred notes stay pinned at the top, then newest updatedAt
  const sortedNotes = [...notes].sort((a, b) => {
    if (a.favorite === b.favorite) {
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
    return a.favorite ? -1 : 1;
  });

  return (
    <div className="w-80 shrink-0 border-r border-hairline flex flex-col bg-surface-1/40 h-full">
      {/* Top search & new note button */}
      <div className="p-3 border-b border-hairline flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
          <input
            type="text"
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-8 pr-2.5 py-1.5 rounded-md bg-surface-2 border border-hairline text-xs text-ink placeholder:text-ink-tertiary focus:border-primary focus:outline-none"
          />
        </div>
        <button
          onClick={() => {
            sound.playClick(900);
            onNewNote();
          }}
          className="p-1.5 rounded-md bg-primary hover:bg-primary-hover text-white transition-colors cursor-pointer shrink-0"
          title="New Note"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>

      {/* Notes List */}
      <div className="flex-1 overflow-y-auto divide-y divide-hairline/40">
        {sortedNotes.length === 0 ? (
          <div className="py-12 px-4 text-center text-xs text-ink-muted">
            <BookOpen className="w-6 h-6 text-primary/40 mx-auto mb-2" />
            <p>No notes found</p>
          </div>
        ) : (
          sortedNotes.map((note) => {
            const isSelected = note.id === selectedNoteId;

            return (
              <div
                key={note.id}
                onClick={() => {
                  sound.playClick(800);
                  onSelectNote(note);
                }}
                className={cn(
                  "p-3.5 pl-4 cursor-pointer transition-colors group relative border-l-2 select-none",
                  isSelected
                    ? "bg-surface-2 border-primary text-ink"
                    : "border-transparent hover:bg-surface-2/50 text-ink-muted hover:text-ink"
                )}
              >
                {/* Active note indicator bar */}
                {isSelected && (
                  <span className="absolute inset-y-0 left-0 w-0.5 bg-primary" />
                )}

                <div className="flex items-start justify-between gap-2 mb-1">
                  <div className="flex items-center gap-1.5 min-w-0 flex-1">
                    {note.favorite && (
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400 shrink-0" />
                    )}
                    <h4 className="text-xs font-semibold text-ink truncate flex-1">
                      {note.title}
                    </h4>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={(e) => handleToggleStar(e, note)}
                      className={cn(
                        "p-0.5 rounded transition-colors cursor-pointer",
                        note.favorite
                          ? "text-amber-400 hover:text-amber-300"
                          : "text-ink-tertiary opacity-0 group-hover:opacity-100 hover:text-ink-muted"
                      )}
                      title={note.favorite ? "Unstar note" : "Star note"}
                    >
                      <Star
                        className={cn(
                          "w-3.5 h-3.5",
                          note.favorite && "fill-amber-400"
                        )}
                      />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, note)}
                      className="p-0.5 rounded text-ink-tertiary opacity-0 group-hover:opacity-100 hover:text-semantic-error transition-all cursor-pointer"
                      title="Delete note"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Snippet preview */}
                <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed mb-2">
                  {note.content
                    .replace(/^#+\s+/gm, "")
                    .replace(/[`*_[\]]/g, "")
                    .trim() || "Empty note"}
                </p>

                {/* Footer metadata */}
                <div className="flex items-center justify-between text-[10px] text-ink-tertiary">
                  <span className="truncate">
                    {note.project ? note.project.title : "Workspace"}
                  </span>
                  <span>
                    {new Date(note.updatedAt).toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      <ConfirmModal
        isOpen={!!deletingNote}
        onClose={() => setDeletingNote(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        description={`Are you sure you want to delete note "${deletingNote?.title}"?`}
        confirmText="Delete Note"
        variant="danger"
        isLoading={deleteNote.isPending}
      />
    </div>
  );
}
