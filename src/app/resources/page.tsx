"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  Bookmark as BookmarkIcon,
  Mail,
} from "lucide-react";
import { useNotes } from "@/hooks/use-notes";
import { useBookmarks } from "@/hooks/use-bookmarks";
import { Note } from "@/types/note";
import { NotesList } from "@/components/resources/notes-list";
import { NotesEditor } from "@/components/resources/notes-editor";
import dynamic from "next/dynamic";
import { BookmarksCatalog } from "@/components/resources/bookmarks-catalog";

const DigestModal = dynamic(
  () => import("@/components/resources/digest-modal").then((m) => m.DigestModal),
  { ssr: false }
);
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { useDebounce } from "@/hooks/use-debounce";

export default function ResourcesPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams.get("tab") === "bookmarks" ? "bookmarks" : "notes";
  const initialNoteId = searchParams.get("noteId");

  const [activeTab, setActiveTab] = useState<"notes" | "bookmarks">(initialTab);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(initialNoteId);
  const [isCreatingNewNote, setIsCreatingNewNote] = useState(false);
  const [notesSearchQuery, setNotesSearchQuery] = useState("");
  const [isDigestModalOpen, setIsDigestModalOpen] = useState(false);
  const [isNotesSidebarCollapsed, setIsNotesSidebarCollapsed] = useState(false);

  const [mobileNoteView, setMobileNoteView] = useState<"list" | "editor">("list");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_notes_sidebar_collapsed");
      if (saved === "true") setIsNotesSidebarCollapsed(true);
    }
  }, []);

  const handleToggleNotesSidebar = () => {
    sound.playClick(700);
    setIsNotesSidebarCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("devdash_notes_sidebar_collapsed", String(next));
      }
      return next;
    });
  };

  const debouncedNotesSearch = useDebounce(notesSearchQuery, 300);

  const { data: notes } = useNotes({
    search: debouncedNotesSearch,
  });

  const { data: allBookmarks } = useBookmarks();

  // Keyboard shortcuts: 1 switch to Notes, 2 switch to Bookmarks
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      if (e.key === "1") {
        e.preventDefault();
        sound.playClick(850);
        setActiveTab("notes");
      } else if (e.key === "2") {
        e.preventDefault();
        sound.playClick(850);
        setActiveTab("bookmarks");
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Auto-select first note if none selected or if selected note is missing
  useEffect(() => {
    if (!isCreatingNewNote && notes && notes.length > 0) {
      if (!selectedNoteId || !notes.some((n) => n.id === selectedNoteId)) {
        const sorted = [...notes].sort((a, b) => {
          if (a.favorite === b.favorite) {
            const timeA = new Date(a.updatedAt || a.createdAt).getTime();
            const timeB = new Date(b.updatedAt || b.createdAt).getTime();
            return timeB - timeA;
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
    setMobileNoteView("editor");
  };

  const handleNewNote = () => {
    setSelectedNoteId(null);
    setIsCreatingNewNote(true);
    setMobileNoteView("editor");
  };

  const handleNoteSaved = (savedNote: Note) => {
    setIsCreatingNewNote(false);
    setSelectedNoteId(savedNote.id);
    setMobileNoteView("editor");
  };

  const handleNoteDeleted = () => {
    setSelectedNoteId(null);
    setIsCreatingNewNote(false);
    setMobileNoteView("list");
  };

  return (
    <div className="flex-1 h-screen max-h-screen bg-canvas text-ink flex flex-col overflow-hidden">
      {/* Top Header — unified h-14 height matching sidebar brand header */}
      <div className="h-14 px-4 sm:px-6 border-b border-hairline flex items-center justify-between gap-6 bg-surface-1/40 flex-shrink-0 select-none">
        <div className="flex items-center gap-8 h-full min-w-0">
          <h1 className="text-sm font-semibold tracking-[-0.3px] text-ink shrink-0">
            Resources
          </h1>

          {/* Underline Tabs: Notes and Bookmarks with neutral icons and mono counts */}
          <nav
            role="tablist"
            aria-label="Resources navigation"
            className="flex items-center gap-6 h-full"
          >
            <button
              role="tab"
              aria-selected={activeTab === "notes"}
              onClick={() => {
                sound.playClick(850);
                setActiveTab("notes");
              }}
              className={cn(
                "h-full inline-flex items-center gap-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap",
                activeTab === "notes"
                  ? "border-accent text-ink font-semibold"
                  : "border-transparent text-ink-muted hover:text-ink"
              )}
            >
              <BookOpen className="w-4 h-4 text-ink-subtle" />
              <span>Notes</span>
              {typeof notes?.length === "number" && (
                <span className="font-mono text-[11px] text-ink-subtle">
                  {notes.length}
                </span>
              )}
            </button>

            <button
              role="tab"
              aria-selected={activeTab === "bookmarks"}
              onClick={() => {
                sound.playClick(850);
                setActiveTab("bookmarks");
              }}
              className={cn(
                "h-full inline-flex items-center gap-2 text-xs font-medium border-b-2 transition-colors cursor-pointer whitespace-nowrap",
                activeTab === "bookmarks"
                  ? "border-accent text-ink font-semibold"
                  : "border-transparent text-ink-muted hover:text-ink"
              )}
            >
              <BookmarkIcon className="w-4 h-4 text-ink-subtle" />
              <span>Bookmarks</span>
              {typeof allBookmarks?.length === "number" && (
                <span className="font-mono text-[11px] text-ink-subtle">
                  {allBookmarks.length}
                </span>
              )}
            </button>
          </nav>
        </div>

        {/* Right side: Weekly Digest as a ghost button with a neutral icon */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onMouseEnter={() => import("@/components/resources/digest-modal")}
            onFocus={() => import("@/components/resources/digest-modal")}
            onClick={() => {
              sound.playClick(900);
              setIsDigestModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer px-2.5 py-1.5 rounded-[6px] hover:bg-surface-2"
            title="Weekly productivity digest"
          >
            <Mail className="w-3.5 h-3.5 text-ink-subtle" />
            <span>Weekly Digest</span>
          </button>
        </div>
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
              onToggleCollapse={handleToggleNotesSidebar}
              className={cn(
                mobileNoteView === "editor" ? "hidden md:flex" : "flex",
                isNotesSidebarCollapsed && "md:hidden"
              )}
            />
            <div
              className={cn(
                "flex-1 h-full min-w-0 overflow-hidden",
                mobileNoteView === "list" ? "hidden md:flex flex-col" : "flex flex-col"
              )}
            >
              <NotesEditor
                activeNote={activeNote}
                isNew={isCreatingNewNote}
                onSaved={handleNoteSaved}
                onDeleted={handleNoteDeleted}
                onBackToList={() => setMobileNoteView("list")}
                isSidebarCollapsed={isNotesSidebarCollapsed}
                onToggleSidebar={handleToggleNotesSidebar}
              />
            </div>
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
