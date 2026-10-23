"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Upload,
  FileCode,
  FolderKanban,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Folder,
  Globe,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { parseNetscapeBookmarks, ParseResult } from "@/lib/bookmark-parser";
import { ImportedBookmarkItem, CreateBookmarkPayload } from "@/types/bookmark";
import { useBatchCreateBookmarks } from "@/hooks/use-bookmarks";
import { useProjects } from "@/hooks/use-projects";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportBookmarksModal({ isOpen, onClose }: Props) {
  const batchCreate = useBatchCreateBookmarks();
  const { data: projects } = useProjects();

  const [isClosing, setIsClosing] = useState(false);
  const [step, setStep] = useState<"upload" | "preview">("upload");
  const [fileName, setFileName] = useState<string>("");
  const [parsedItems, setParsedItems] = useState<ImportedBookmarkItem[]>([]);
  const [discoveredFolders, setDiscoveredFolders] = useState<string[]>([]);
  const [folderMappings, setFolderMappings] = useState<Record<string, string>>({});
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isDragging, setIsDragging] = useState(false);
  const [isParsing, setIsParsing] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setStep("upload");
      setFileName("");
      setParsedItems([]);
      setDiscoveredFolders([]);
      setFolderMappings({});
      setSelectedProjectId("");
      setIsDragging(false);
      setIsParsing(false);
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen && !isClosing) return null;

  const handleClose = () => {
    if (batchCreate.isPending) return;
    sound.playClick(600);
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      onClose();
    }, 150);
  };

  const processFile = async (file: File) => {
    if (!file.name.endsWith(".html") && !file.name.endsWith(".htm")) {
      toast.error("Invalid file format", {
        description: "Please upload an HTML bookmark file exported from your browser.",
      });
      return;
    }

    setIsParsing(true);
    setFileName(file.name);

    try {
      const text = await file.text();
      const result: ParseResult = parseNetscapeBookmarks(text);

      if (result.items.length === 0) {
        toast.warning("No bookmarks found", {
          description: "Could not find any valid bookmark links in this file.",
        });
        setIsParsing(false);
        return;
      }

      setParsedItems(result.items);
      setDiscoveredFolders(result.folders);

      // Default 1:1 folder mapping
      const initialMap: Record<string, string> = {};
      result.folders.forEach((f) => {
        initialMap[f] = f.toLowerCase();
      });
      setFolderMappings(initialMap);

      sound.playSuccess();
      setStep("preview");
    } catch (err) {
      toast.error("Failed to parse bookmark file");
    } finally {
      setIsParsing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const toggleSelectAll = (checked: boolean) => {
    sound.playClick(700);
    setParsedItems((prev) => prev.map((item) => ({ ...item, selected: checked })));
  };

  const toggleItemSelect = (id: string) => {
    sound.playClick(650);
    setParsedItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const handleFolderMappingChange = (folder: string, targetCategory: string) => {
    setFolderMappings((prev) => ({
      ...prev,
      [folder]: targetCategory.trim().toLowerCase() || "tools",
    }));
  };

  const selectedCount = parsedItems.filter((i) => i.selected).length;

  const handleImport = async () => {
    const itemsToImport = parsedItems.filter((i) => i.selected);
    if (itemsToImport.length === 0) {
      toast.warning("No bookmarks selected", {
        description: "Please check at least one bookmark to import.",
      });
      return;
    }

    sound.playClick(900);

    const payloads: CreateBookmarkPayload[] = itemsToImport.map((item) => {
      const origFolder = item.folderPath[item.folderPath.length - 1] || item.category;
      const targetCategory = folderMappings[origFolder] || item.category || "tools";

      return {
        title: item.title,
        url: item.url,
        category: targetCategory.toLowerCase(),
        projectId: selectedProjectId || null,
        tags: item.folderPath.length > 1 ? [item.folderPath[0].toLowerCase()] : [],
        favorite: false,
      };
    });

    try {
      // Chunk into batches of 200 if necessary
      const chunkSize = 200;
      let totalImported = 0;

      for (let i = 0; i < payloads.length; i += chunkSize) {
        const chunk = payloads.slice(i, i + chunkSize);
        const res = await batchCreate.mutateAsync({ bookmarks: chunk });
        totalImported += res.count;
      }

      toast.success("Bookmarks imported!", {
        description: `Successfully added ${totalImported} bookmarks to your vault.`,
      });
      handleClose();
    } catch (err: any) {
      toast.error("Import failed", {
        description: err.message || "Failed to import bookmarks. Please try again.",
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 select-none">
      {/* Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/75 backdrop-blur-xs transition-opacity duration-150",
          isClosing ? "opacity-0" : "opacity-100 animate-in fade-in"
        )}
        onClick={handleClose}
      />

      {/* Modal Surface */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Import Browser Bookmarks"
        className={cn(
          "relative w-full max-w-2xl bg-surface-1 border border-hairline rounded-2xl shadow-2xl overflow-hidden transition-all duration-150 z-10 flex flex-col max-h-[90vh]",
          isClosing ? "opacity-0 scale-95" : "opacity-100 scale-100 animate-in fade-in zoom-in-95"
        )}
      >
        {/* Header */}
        <div className="px-5 py-4 border-b border-hairline flex items-center justify-between bg-surface-1/90 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold tracking-[-0.3px] text-ink">
                Import Browser Bookmarks
              </h3>
              <p className="text-[11px] text-ink-muted">
                Import exported HTML bookmarks from Chrome, Arc, Safari, Firefox, or Edge.
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-1.5 rounded-lg text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {step === "upload" ? (
            <div className="space-y-4">
              {/* Dropzone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  "p-8 sm:p-12 border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-150",
                  isDragging
                    ? "border-primary bg-primary/5"
                    : "border-hairline hover:border-hairline-strong bg-surface-2/40 hover:bg-surface-2/70"
                )}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".html,.htm"
                  onChange={handleFileChange}
                  className="hidden"
                />

                {isParsing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 className="w-8 h-8 text-primary animate-spin" />
                    <span className="text-xs font-medium text-ink">
                      Parsing bookmarks & folder structure...
                    </span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-xl bg-surface-3 border border-hairline flex items-center justify-center text-primary mb-3 shadow-xs">
                      <FileCode className="w-6 h-6" />
                    </div>
                    <span className="text-sm font-semibold text-ink tracking-tight mb-1">
                      Choose bookmark HTML file or drag & drop here
                    </span>
                    <span className="text-xs text-ink-muted max-w-sm leading-relaxed">
                      Accepts standard <code className="text-[11px] font-mono text-primary bg-surface-3 px-1 py-0.5 rounded">.html</code> bookmark files exported from any modern browser.
                    </span>
                  </>
                )}
              </div>

              {/* Instructions Callout */}
              <div className="p-3.5 rounded-xl bg-surface-2/60 border border-hairline text-xs space-y-1.5 text-ink-muted">
                <div className="flex items-center gap-1.5 text-ink font-medium">
                  <HelpCircle className="w-3.5 h-3.5 text-primary" />
                  <span>How to export bookmarks from your browser:</span>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-[11px] text-ink-subtle">
                  <li>
                    <strong className="text-ink">Chrome / Edge / Brave</strong>: Press <kbd className="px-1 py-0.2 bg-surface-3 rounded font-mono text-[10px]">Ctrl+Shift+O</kbd> (or <kbd className="px-1 py-0.2 bg-surface-3 rounded font-mono text-[10px]">⌘+Option+B</kbd>) → Click 3 dots at top right → "Export bookmarks".
                  </li>
                  <li>
                    <strong className="text-ink">Safari</strong>: File → "Export" → "Bookmarks".
                  </li>
                  <li>
                    <strong className="text-ink">Arc</strong>: Help → "Export Bookmarks" or Settings → Import/Export.
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Summary Bar */}
              <div className="p-3 rounded-xl bg-surface-2/80 border border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span className="text-ink font-medium">
                    Found <strong className="text-primary">{parsedItems.length}</strong> bookmarks across{" "}
                    <strong className="text-ink">{discoveredFolders.length}</strong> folders in{" "}
                    <span className="font-mono text-[11px] text-ink-muted">{fileName}</span>
                  </span>
                </div>

                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => toggleSelectAll(selectedCount !== parsedItems.length)}
                    className="text-[11px] text-primary hover:text-primary-hover font-medium cursor-pointer"
                  >
                    {selectedCount === parsedItems.length ? "Deselect All" : "Select All"}
                  </button>
                  <span className="text-ink-tertiary">•</span>
                  <span className="font-mono text-[11px] text-ink-muted">
                    {selectedCount} selected
                  </span>
                </div>
              </div>

              {/* Folder Mapping Configuration */}
              {discoveredFolders.length > 0 && (
                <div className="space-y-2 p-3.5 rounded-xl bg-surface-2/40 border border-hairline">
                  <div className="flex items-center gap-1.5 text-xs font-semibold text-ink">
                    <Folder className="w-3.5 h-3.5 text-primary" />
                    <span>Map Browser Folders to DevDash Categories:</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-36 overflow-y-auto pr-1">
                    {discoveredFolders.map((folder) => {
                      const count = parsedItems.filter(
                        (i) => (i.folderPath[i.folderPath.length - 1] || i.category) === folder
                      ).length;

                      return (
                        <div
                          key={folder}
                          className="flex items-center justify-between gap-2 p-2 rounded-lg bg-surface-1 border border-hairline text-xs"
                        >
                          <span className="truncate font-medium text-ink flex items-center gap-1.5 min-w-0">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            <span className="truncate">{folder}</span>
                            <span className="text-[10px] font-mono text-ink-tertiary">({count})</span>
                          </span>

                          <input
                            type="text"
                            value={folderMappings[folder] || folder.toLowerCase()}
                            onChange={(e) => handleFolderMappingChange(folder, e.target.value)}
                            placeholder="category"
                            className="w-24 px-2 py-0.5 rounded bg-surface-2 border border-hairline text-[11px] font-mono text-ink focus:outline-none focus:border-primary shrink-0 text-right"
                          />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Optional Project Assignment */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-surface-2/40 border border-hairline text-xs">
                <FolderKanban className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
                <span className="text-ink-muted shrink-0">Assign all to project:</span>
                <select
                  value={selectedProjectId}
                  onChange={(e) => setSelectedProjectId(e.target.value)}
                  className="flex-1 px-2.5 py-1 rounded bg-surface-1 border border-hairline text-ink text-xs focus:outline-none focus:border-primary"
                >
                  <option value="">No Project (General Vault)</option>
                  {projects?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.title}
                    </option>
                  ))}
                </select>
              </div>

              {/* Preview List Table */}
              <div className="border border-hairline rounded-xl overflow-hidden bg-surface-1 max-h-64 overflow-y-auto divide-y divide-hairline">
                {parsedItems.map((item) => {
                  let domain = "";
                  try {
                    domain = new URL(item.url).hostname.replace(/^www\./, "");
                  } catch {
                    domain = item.url;
                  }

                  return (
                    <div
                      key={item.id}
                      onClick={() => toggleItemSelect(item.id)}
                      className={cn(
                        "flex items-center justify-between gap-3 px-3 py-2 text-xs transition-colors cursor-pointer select-none",
                        item.selected
                          ? "bg-surface-1 hover:bg-surface-2"
                          : "opacity-40 bg-surface-2/20 hover:opacity-75"
                      )}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <input
                          type="checkbox"
                          checked={item.selected}
                          onChange={() => {}} // handled by row click
                          className="rounded border-hairline text-primary focus:ring-0 shrink-0 cursor-pointer"
                        />
                        <img
                          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
                          alt=""
                          className="w-3.5 h-3.5 rounded-xs shrink-0 object-contain bg-surface-2 p-0.5"
                          onError={(e) => {
                            (e.currentTarget as HTMLElement).style.display = "none";
                          }}
                        />
                        <span className="font-medium text-ink truncate min-w-0">
                          {item.title}
                        </span>
                        <span className="text-[11px] font-mono text-ink-tertiary truncate hidden sm:inline">
                          {domain}
                        </span>
                      </div>

                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-hairline text-ink-muted shrink-0">
                        {folderMappings[item.folderPath[item.folderPath.length - 1] || item.category] || item.category}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 border-t border-hairline bg-surface-1/90 flex items-center justify-between gap-3 shrink-0">
          {step === "preview" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  sound.playClick(600);
                  setStep("upload");
                }}
                disabled={batchCreate.isPending}
                className="px-3 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink transition-colors cursor-pointer"
              >
                Choose Another File
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={batchCreate.isPending}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleImport}
                  disabled={selectedCount === 0 || batchCreate.isPending}
                  className={cn(
                    "inline-flex items-center gap-2 px-4 py-1.5 rounded-lg text-xs font-semibold text-white transition-all duration-150 cursor-pointer shadow-sm",
                    selectedCount > 0 && !batchCreate.isPending
                      ? "bg-primary hover:bg-primary-hover shadow-primary/25"
                      : "bg-surface-3 text-ink-tertiary opacity-50 cursor-not-allowed"
                  )}
                >
                  {batchCreate.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Import {selectedCount} Bookmarks</span>
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <div className="flex items-center justify-end w-full">
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-lg text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
