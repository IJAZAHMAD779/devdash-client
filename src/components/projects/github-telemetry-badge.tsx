"use client";

import { useMemo } from "react";
import { Star, GitFork, CircleDot, Clock } from "lucide-react";
import { useGitHubTelemetry } from "@/hooks/use-projects";
import { cn } from "@/lib/utils";

const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "#3178c6",
  JavaScript: "#f1e05a",
  Python: "#3572A5",
  Rust: "#dea584",
  Go: "#00ADD8",
  Ruby: "#701516",
  Java: "#b07219",
  "C++": "#f34b7d",
  C: "#555555",
  "C#": "#178600",
  PHP: "#4F5D95",
  HTML: "#e34c26",
  CSS: "#563d7c",
  Vue: "#41b883",
  Svelte: "#ff3e00",
  Shell: "#89e051",
  Dart: "#00B4AB",
  Swift: "#F05138",
  Kotlin: "#A97BFF",
};

function formatCount(num: number): string {
  if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
  return num.toString();
}

function formatRelativeTime(dateString: string | null): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const now = new Date();
  const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffSec < 60) return "just now";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30) return `${diffDays}d ago`;
  const diffMonths = Math.floor(diffDays / 30);
  return `${diffMonths}mo ago`;
}

interface GitHubTelemetryBadgeProps {
  repoUrl?: string | null;
  compact?: boolean;
  className?: string;
}

export function GitHubTelemetryBadge({
  repoUrl,
  compact = false,
  className,
}: GitHubTelemetryBadgeProps) {
  const isGitHub = useMemo(() => {
    return Boolean(repoUrl && repoUrl.includes("github.com/"));
  }, [repoUrl]);

  const { data: stats, isLoading, isError } = useGitHubTelemetry(
    isGitHub ? repoUrl : null
  );

  if (!isGitHub) return null;

  if (isLoading) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2 py-0.5 px-2 rounded-md bg-surface-2 border border-hairline animate-pulse",
          className
        )}
      >
        <div className="w-3 h-3 rounded-full bg-surface-4" />
        <div className="w-12 h-2.5 rounded bg-surface-4" />
      </div>
    );
  }

  if (isError || !stats) {
    return null;
  }

  const langColor = stats.language
    ? LANGUAGE_COLORS[stats.language] || "#8a8f98"
    : null;

  if (compact) {
    return (
      <div
        className={cn(
          "inline-flex items-center gap-2.5 text-[11px] font-mono text-ink-subtle",
          className
        )}
      >
        {stats.language && (
          <span className="inline-flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: langColor || undefined }}
            />
            <span>{stats.language}</span>
          </span>
        )}
        <span
          className="inline-flex items-center gap-1 text-amber-400/90 font-medium"
          title={`${stats.stars} GitHub Stars`}
        >
          <Star className="w-3 h-3 fill-amber-400/30 text-amber-400" />
          <span>{formatCount(stats.stars)}</span>
        </span>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-center flex-wrap gap-2 text-xs font-mono",
        className
      )}
    >
      {/* Stars */}
      <a
        href={stats.htmlUrl}
        target="_blank"
        rel="noopener noreferrer"
        title="View on GitHub"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink transition-colors cursor-pointer"
      >
        <Star className="w-3.5 h-3.5 fill-amber-400/30 text-amber-400" />
        <span className="font-semibold">{formatCount(stats.stars)}</span>
        <span className="text-ink-tertiary text-[10px]">stars</span>
      </a>

      {/* Forks */}
      <a
        href={`${stats.htmlUrl}/network/members`}
        target="_blank"
        rel="noopener noreferrer"
        title="Forks"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted transition-colors cursor-pointer"
      >
        <GitFork className="w-3.5 h-3.5 text-ink-subtle" />
        <span>{formatCount(stats.forks)}</span>
      </a>

      {/* Open Issues */}
      <a
        href={`${stats.htmlUrl}/issues`}
        target="_blank"
        rel="noopener noreferrer"
        title="Open Issues"
        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 hover:bg-surface-3 border border-hairline text-ink-muted transition-colors cursor-pointer"
      >
        <CircleDot className="w-3.5 h-3.5 text-emerald-400" />
        <span>{formatCount(stats.openIssues)}</span>
        <span className="text-ink-tertiary text-[10px]">issues</span>
      </a>

      {/* Primary Language */}
      {stats.language && (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-surface-2 border border-hairline text-ink-muted">
          <span
            className="w-2 h-2 rounded-full shrink-0"
            style={{ backgroundColor: langColor || undefined }}
          />
          <span>{stats.language}</span>
        </span>
      )}

      {/* Last commit time */}
      {stats.pushedAt && (
        <span
          className="inline-flex items-center gap-1.5 text-ink-tertiary text-[11px]"
          title={`Last pushed: ${new Date(stats.pushedAt).toLocaleString()}`}
        >
          <Clock className="w-3 h-3" />
          <span>pushed {formatRelativeTime(stats.pushedAt)}</span>
        </span>
      )}
    </div>
  );
}
