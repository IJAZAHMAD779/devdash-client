"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Bookmark as BookmarkIcon,
  Mail,
  Sparkles,
} from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { Note } from "@/types/note";
import { NotesList } from "@/components/resources/notes-list";
import { NotesEditor } from "@/components/resources/notes-editor";
import { BookmarksCatalog } from "@/components/resources/bookmarks-catalog";
import { DigestModal } from "@/components/resources/digest-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

export default function ResourcesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "bookmarks" ? "bookmarks" : "notes";
  const initialNoteId = searchParams.get("noteId");

  const [activeTab, setActiveTab] = useState<"notes" | "bookmarks">(initialTab);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNoteId);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState("");
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);

  const { data: notes } = useNotes({
    search: notesSearchQuery,
  });

  // Auto-select first note if none selected or if selected note is missing
  useEffect(() => {
    if (!isCreatingNewNote && notes && notes.length > 0) {
      if (!selectedNoteId || !notes.some((n) => n.id === selectedNoteId)) {
        const sorted = [...notes].sort((a, b) => {
          if (a.favorite === b.favorite) {
            return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
          }
          return a.favorite ? -1 : 1;
        });
        setSelectedNoteId(sorted[0].id);
      }
    }
  }, [notes, selectedNoteId, isCreatingNewNote]);

  const activeNote = notes?.find((n) => n.id === selectedNoteId) || null;

  const handleSelectNote = (note: Note) => {
    setIsCreatingNewNote(false);
    setSelectedNoteId(note.id);
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsCreatingNewNote(true);
  };

  const handleNoteSaved = (savedNote: Note) => {
    setIsCreatingNewNote(false);
    setSelectedNoteId(savedNote.id);
  };

  const handleNoteDeleted = () => {
    setSelectedNoteId(null);
    setIsCreatingNewNote(false);
  };

  return (
    <div className="flex-1 h-screen max-h-screen bg-canvas text-ink flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-8 pt-6 pb-4 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-surface-1/40 shrink-0">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold tracking-[-0.6px] text-ink">
              Resources & Knowledge
            </h1>
          </div>
          <p className="text-xs text-ink-muted">
            Personal markdown knowledge base, curated developer bookmarks, and automated Weekly Digest.
          </p>
        </div>

        {/* Right side: Digest trigger */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick(900);
              setIsDigestModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
          >
            <Mail className="w-3.5 h-3.5 text-primary" />
            <span>Weekly Digest</span>
          </button>
        </div>
      </div>

      {/* Sliding Pill Tabs Bar */}
      <div className="px-8 py-3 border-b border-hairline bg-surface-1/20 flex items-center gap-2 shrink-0">
        <button
          onClick={() => {
            sound.playClick(850);
            setActiveTab("notes");
          }}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium tracking-tight transition-all duration-150 cursor-pointer",
            activeTab === "notes"
              ? "bg-surface-3 text-ink font-semibold shadow-xs border border-hairline"
              : "text-ink-muted hover:text-ink hover:bg-surface-2"
          )}
        >
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          <span>Technical Notes</span>
          {notes && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-surface-2 text-ink-tertiary">
              {notes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => {
            sound.playClick(850);
            setActiveTab("bookmarks");
          }}
          className={cn(
            "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-md text-xs font-medium tracking-tight transition-all duration-150 cursor-pointer",
            activeTab === "bookmarks"
              ? "bg-surface-3 text-ink font-semibold shadow-xs border border-hairline"
              : "text-ink-muted hover:text-ink hover:bg-surface-2"
          )}
        >
          <BookmarkIcon className="w-3.5 h-3.5 text-rose-400" />
          <span>URL Bookmarks</span>
        </button>
      </div>

      {/* Main Workspace Body */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        {activeTab === "notes" ? (
          <div className="flex-1 min-h-0 flex flex-col md:flex-row h-full overflow-hidden">
            <NotesList
              notes={notes || []}
              selectedNoteId={selectedNoteId}
              onSelectNote={handleSelectNote}
              onNewNote={handleNewNote}
              searchQuery={notesSearchQuery}
              onSearchChange={setNotesSearchQuery}
            />
            <NotesEditor
              activeNote={activeNote}
              isNew={isCreatingNewNote}
              onSaved={handleNoteSaved}
              onDeleted={handleNoteDeleted}
            />
          </div>
        ) : (
          <div className="flex-1 min-h-0 flex flex-col h-full overflow-hidden">
            <BookmarksCatalog />
          </div>
        )}
      </div>

      {/* Weekly Digest Modal */}
      <DigestModal
        isOpen={isDigestModalOpen}
        onClose={() => setIsDigestModalOpen(false)}
      />
    </div>
  );
}
