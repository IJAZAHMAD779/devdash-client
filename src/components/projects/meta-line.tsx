import React from "react";
import { cn } from "@/lib/utils";
import { GitHubRepoStats } from "@/types/project";
import { formatPushedRelative } from "./activity-text";

export interface MetaLineProps {
  stats: GitHubRepoStats | null | undefined;
  createdAt?: string | null;
  className?: string;
}

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
};

export function MetaLine({ stats, createdAt, className }: MetaLineProps) {
  const parts: React.ReactNode[] = [];

  // 1. Language with colored dot
  if (stats?.language) {
    const color = LANGUAGE_COLORS[stats.language] || "#8a8f98";
    parts.push(
      <span key="lang" className="inline-flex items-center gap-1.5">
        <span
          className="w-1.5 h-1.5 rounded-full shrink-0"
          style={{ backgroundColor: color }}
          aria-hidden="true"
        />
        <span>{stats.language}</span>
      </span>
    );
  }

  // 2. Stars (only if > 0)
  if (stats && stats.stars > 0) {
    parts.push(
      <span key="stars" className="inline-flex items-center gap-1">
        <span>★</span>
        <span>{stats.stars}</span>
      </span>
    );
  }

  // 3. Forks (only if > 0)
  if (stats && stats.forks > 0) {
    parts.push(
      <span key="forks" className="inline-flex items-center gap-1">
        <span>⑂</span>
        <span>{stats.forks}</span>
      </span>
    );
  }

  // 4. Open issues / PRs (only if > 0)
  if (stats && stats.openIssues > 0) {
    parts.push(
      <span key="issues">
        {stats.openIssues} open
      </span>
    );
  }

  // 5. Pushed date via ActivityText
  if (stats?.pushedAt) {
    const { text, isRecent } = formatPushedRelative(stats.pushedAt);
    if (text !== "—") {
      parts.push(
        <span key="pushed" className="inline-flex items-center gap-1">
          <span
            className={cn(
              "w-1 h-1 rounded-full shrink-0",
              isRecent ? "bg-ok" : "bg-subtle"
            )}
            aria-hidden="true"
          />
          <span>{text}</span>
        </span>
      );
    }
  }

  // 6. Local Created / Added timestamp
  if (createdAt) {
    try {
      const addedDate = new Date(createdAt).toLocaleDateString("en-US", {
        month: "numeric",
        day: "numeric",
        year: "numeric",
      });
      parts.push(<span key="added">added {addedDate}</span>);
    } catch {
      // ignore date format error
    }
  }

  if (parts.length === 0) {
    return null;
  }

  return (
    <div
      className={cn(
        "flex items-center flex-wrap gap-x-2.5 gap-y-1 text-xs font-mono text-muted select-none",
        className
      )}
    >
      {parts.map((part, idx) => (
        <React.Fragment key={idx}>
          {idx > 0 && <span className="text-subtle select-none">·</span>}
          {part}
        </React.Fragment>
      ))}
    </div>
  );
}
