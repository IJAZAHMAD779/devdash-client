"use client";

import { useState } from "react";
import {
  X,
  Copy,
  Check,
  Edit2,
  Star,
  ChevronDown,
  ChevronUp,
  FolderKanban,
  Tag,
  Code2,
  Eye,
} from "lucide-react";
import { Snippet } from "@/types/snippet";
import { CodeBlock } from "@/components/ui/code-block";
import { ComponentLivePreview } from "@/components/ui-components/component-live-preview";
import { useToggleSnippetFavorite } from "@/hooks/use-snippets";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  snippet: Snippet | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (snippet: Snippet) => void;
}

export function SnippetCodeModal({
  snippet,
  isOpen,
  onClose,
  onEdit,
}: Props) {
  const [activeTab, setActiveTab] = useState<"preview" | "code">("code");
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const toggleFavorite = useToggleSnippetFavorite();

  if (!isOpen || !snippet) return null;

  const isHtml =
    snippet.language.toLowerCase() === "html" ||
    snippet.language.toLowerCase() === "html_css" ||
    snippet.code.trim().toLowerCase().startsWith("<!doctype") ||
    snippet.code.trim().toLowerCase().startsWith("<html");

  const handleCopyCode = async () => {
    sound.playClick(900);
    try {
      await navigator.clipboard.writeText(snippet.code);
      setCopied(true);
      toast.success("Snippet code copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Failed to copy code");
    }
  };

  const handleToggleFavorite = () => {
    sound.playClick(850);
    toggleFavorite.mutate({
      id: snippet.id,
      favorite: !snippet.favorite,
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          sound.playClick(600);
          onClose();
        }
      }}
    >
      <div
        className="w-full max-w-4xl max-h-[90vh] rounded-2xl bg-canvas border border-hairline-strong shadow-2xl flex flex-col overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header Row matching Image 3 (Clean, minimal, NO 3 colored dots) */}
        <div className="px-5 py-3.5 bg-surface-1 border-b border-hairline flex items-center justify-between gap-3 shrink-0 select-none">
          {/* Left: Snippet Title & Badges */}
          <div className="flex items-center gap-2.5 min-w-0">
            <h2 className="text-base sm:text-lg font-semibold tracking-[-0.3px] text-ink truncate">
              {snippet.title}
            </h2>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary uppercase font-medium">
              {snippet.language}
            </span>
            {snippet.project && (
              <span className="hidden sm:inline-flex items-center gap-1 text-xs text-ink-muted">
                <FolderKanban className="w-3 h-3 text-primary" />
                <span>{snippet.project.title}</span>
              </span>
            )}
          </div>

          {/* Right: Quick actions + Segmented [ Preview | Code ] toggle for HTML */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Star Favorite Button */}
            <button
              onClick={handleToggleFavorite}
              className={cn(
                "p-1.5 rounded-lg border border-hairline transition-colors cursor-pointer",
                snippet.favorite
                  ? "bg-amber-500/10 border-amber-500/30 text-amber-400"
                  : "bg-surface-2 text-ink-tertiary hover:text-ink hover:bg-surface-3"
              )}
              title={snippet.favorite ? "Starred" : "Star snippet"}
            >
              <Star
                className={cn(
                  "w-4 h-4",
                  snippet.favorite && "fill-amber-400"
                )}
              />
            </button>

            {/* Copy Button (Icon Swap animation) */}
            <button
              onClick={handleCopyCode}
              className="p-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted hover:text-ink transition-colors cursor-pointer flex items-center justify-center"
              title="Copy code"
            >
              {copied ? (
                <Check className="w-4 h-4 text-emerald-400" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>

            {/* Segmented Pill Toggle: [ Preview | Code ] (Only for HTML snippets) */}
            {isHtml && (
              <div className="flex items-center rounded-lg bg-surface-2 p-1 border border-hairline">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(850);
                    setActiveTab("preview");
                  }}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer flex items-center gap-1.5",
                    activeTab === "preview"
                      ? "bg-surface-3 text-ink shadow-xs border border-hairline"
                      : "text-ink-muted hover:text-ink border border-transparent"
                  )}
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Preview</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(850);
                    setActiveTab("code");
                  }}
                  className={cn(
                    "px-3 py-1 text-xs font-medium rounded-md transition-all duration-150 cursor-pointer flex items-center gap-1.5",
                    activeTab === "code"
                      ? "bg-surface-3 text-ink shadow-xs border border-hairline"
                      : "text-ink-muted hover:text-ink border border-transparent"
                  )}
                >
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Code</span>
                </button>
              </div>
            )}

            {/* Edit Button */}
            {onEdit && (
              <button
                onClick={() => {
                  sound.playClick(750);
                  onClose();
                  onEdit(snippet);
                }}
                className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink-muted hover:text-ink transition-colors cursor-pointer"
                title="Edit snippet"
              >
                <Edit2 className="w-3.5 h-3.5 text-primary" />
                <span>Edit</span>
              </button>
            )}

            {/* Close Button */}
            <button
              onClick={() => {
                sound.playClick(600);
                onClose();
              }}
              className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-2 transition-colors cursor-pointer ml-1"
              title="Close modal (Esc)"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Body: Framed Container matching Image 3 */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 bg-canvas space-y-4">
          {snippet.description && (
            <p className="text-xs text-ink-muted leading-relaxed">
              {snippet.description}
            </p>
          )}

          {isHtml && activeTab === "preview" ? (
            /* Interactive Live Native HTML Sandbox Preview */
            <div className="rounded-2xl overflow-hidden shadow-inner">
              <ComponentLivePreview
                code={snippet.code}
                name={snippet.title}
                category="html"
                framework="HTML_CSS"
                className="w-full min-h-[460px] border-hairline"
              />
            </div>
          ) : (
            /* Code block with collapsible height matching Image 3 */
            <div className="relative rounded-2xl bg-surface-1 border border-hairline overflow-hidden p-4 sm:p-5 shadow-inner">
              <div
                className={cn(
                  "transition-all duration-200 overflow-hidden font-mono text-xs",
                  !isExpanded ? "max-h-[380px]" : "max-h-none"
                )}
              >
                <CodeBlock
                  code={snippet.code}
                  language={snippet.language}
                  filename={`${snippet.title.toLowerCase().replace(/\s+/g, "-")}.${
                    snippet.language === "typescript"
                      ? "ts"
                      : snippet.language === "python"
                      ? "py"
                      : snippet.language === "sql"
                      ? "sql"
                      : snippet.language === "bash"
                      ? "sh"
                      : snippet.language
                  }`}
                  enableSecretMasking={true}
                  className="bg-transparent border-0 p-0 text-xs"
                />
              </div>

              {/* Bottom gradient fade when collapsed */}
              {!isExpanded && (
                <div className="pointer-events-none absolute bottom-0 inset-x-0 h-28 bg-gradient-to-t from-surface-1 via-surface-1/80 to-transparent" />
              )}

              {/* Centered [ Show more ] / [ Show less ] button matching Image 3 */}
              <div className="relative z-10 flex justify-center mt-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    sound.playClick(800);
                    setIsExpanded(!isExpanded);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-surface-2 hover:bg-surface-3 border border-hairline text-xs font-medium text-ink hover:text-white transition-all cursor-pointer shadow-sm hover:shadow"
                >
                  <span>{isExpanded ? "Show less" : "Show more"}</span>
                  {isExpanded ? (
                    <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Tags */}
          {snippet.tags && snippet.tags.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-1">
              {snippet.tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 text-[11px] font-mono px-2 py-0.5 rounded-md bg-surface-2 border border-hairline text-ink-muted"
                >
                  <Tag className="w-2.5 h-2.5 text-ink-tertiary" />
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
