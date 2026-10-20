"use client";

import { useState } from "react";
import { ExternalLink, Globe, Layers, AlertCircle } from "lucide-react";
import { useProjectPreview } from "@/hooks/use-projects";
import { ProjectFavicon } from "./project-favicon";
import { cn } from "@/lib/utils";

interface ProjectOpenGraphCardProps {
  url?: string | null;
  fallbackTitle?: string;
  fallbackDescription?: string;
  className?: string;
}

export function ProjectOpenGraphCard({
  url,
  fallbackTitle,
  fallbackDescription,
  className,
}: ProjectOpenGraphCardProps) {
  const [imageError, setImageError] = useState(false);

  const {
    data: preview,
    isLoading,
    isError,
  } = useProjectPreview(url);

  // If no URL configured for the project
  if (!url) {
    return (
      <div
        className={cn(
          "rounded-lg border border-hairline border-dashed bg-surface-1/40 p-6 flex flex-col items-center justify-center text-center text-ink-subtle",
          className
        )}
      >
        <Globe className="w-8 h-8 text-ink-tertiary mb-2 stroke-[1.5]" />
        <p className="text-xs font-medium text-ink-muted">No Live URL configured</p>
        <p className="text-[11px] text-ink-tertiary max-w-xs mt-0.5">
          Add a live deployment or documentation URL to generate automatic OpenGraph visual previews.
        </p>
      </div>
    );
  }

  // Loading Skeleton State
  if (isLoading) {
    return (
      <div
        className={cn(
          "rounded-lg border border-hairline bg-surface-1 overflow-hidden animate-pulse",
          className
        )}
      >
        <div className="h-44 w-full bg-surface-3 flex items-center justify-center">
          <Layers className="w-6 h-6 text-ink-tertiary animate-spin" />
        </div>
        <div className="p-4 space-y-2.5">
          <div className="h-4 w-3/4 rounded bg-surface-3" />
          <div className="h-3 w-full rounded bg-surface-2" />
          <div className="h-3 w-4/5 rounded bg-surface-2" />
          <div className="flex items-center gap-2 pt-2">
            <div className="w-4 h-4 rounded-full bg-surface-3" />
            <div className="h-3 w-28 rounded bg-surface-2" />
          </div>
        </div>
      </div>
    );
  }

  // Error State or Fallback
  if (isError || !preview) {
    return (
      <div
        className={cn(
          "rounded-lg border border-hairline bg-surface-1 p-5 flex flex-col justify-between",
          className
        )}
      >
        <div className="flex items-start gap-3">
          <ProjectFavicon liveUrl={url} size={28} />
          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium text-ink truncate">
              {fallbackTitle || url}
            </h4>
            <p className="text-xs text-ink-muted line-clamp-2 mt-1">
              {fallbackDescription || "External deployment link"}
            </p>
          </div>
        </div>
        <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
          <span className="text-[11px] font-mono text-ink-tertiary truncate">
            {url}
          </span>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-hover font-medium ml-2 shrink-0"
          >
            <span>Visit</span>
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    );
  }

  const hasValidImage = Boolean(preview.image && !imageError);
  const displayTitle = preview.title || fallbackTitle || preview.domain;
  const displayDesc = preview.description || fallbackDescription;

  return (
    <div
      className={cn(
        "group rounded-lg border border-hairline bg-surface-1 hover:border-hairline-strong transition-all duration-200 overflow-hidden flex flex-col",
        className
      )}
    >
      {/* Banner / OG Image */}
      <div className="relative w-full h-44 bg-surface-2 overflow-hidden border-b border-hairline">
        {hasValidImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview.image!}
            alt={displayTitle}
            onError={() => setImageError(true)}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
        ) : (
          // Fallback tech canvas when image is missing or blocked
          <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-surface-2 to-surface-1 text-center">
            <ProjectFavicon liveUrl={url} size={40} className="mb-2 shadow-md" />
            <span className="text-xs font-mono font-medium text-ink-muted">
              {preview.domain}
            </span>
            <span className="text-[10px] text-ink-tertiary mt-0.5">
              Live Preview
            </span>
          </div>
        )}

        {/* Domain Badge Floating on Top Right */}
        <div className="absolute top-2.5 right-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-canvas/80 backdrop-blur-md border border-hairline text-[11px] font-mono text-ink">
          <ProjectFavicon liveUrl={url} size={14} />
          <span className="max-w-[140px] truncate">{preview.domain}</span>
        </div>
      </div>

      {/* Metadata Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="text-sm font-semibold text-ink group-hover:text-primary transition-colors line-clamp-1 tracking-[-0.2px]">
            {displayTitle}
          </h4>
          {displayDesc && (
            <p className="text-xs text-ink-muted line-clamp-2 mt-1.5 leading-relaxed">
              {displayDesc}
            </p>
          )}
        </div>

        {/* Action Link Footer */}
        <div className="mt-4 pt-3 border-t border-hairline flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <Globe className="w-3.5 h-3.5 text-ink-tertiary shrink-0" />
            <span className="text-[11px] font-mono text-ink-subtle truncate">
              {url.replace(/^https?:\/\//, "")}
            </span>
          </div>

          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink text-xs font-medium transition-colors shrink-0 cursor-pointer shadow-xs"
          >
            <span>Launch</span>
            <ExternalLink className="w-3 h-3 text-ink-subtle" />
          </a>
        </div>
      </div>
    </div>
  );
}
