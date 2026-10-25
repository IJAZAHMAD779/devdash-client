import React from "react";
import { cn } from "@/lib/utils";

// Calibrated muted language color tokens (6px dots only, non-distracting)
const LANGUAGE_COLOR_MAP: Record<string, string> = {
  typescript: "bg-blue-400",
  ts: "bg-blue-400",
  tsx: "bg-blue-400",
  javascript: "bg-amber-300",
  js: "bg-amber-300",
  jsx: "bg-amber-300",
  python: "bg-emerald-400",
  py: "bg-emerald-400",
  html: "bg-orange-400",
  html_css: "bg-orange-400",
  css: "bg-sky-400",
  scss: "bg-pink-400",
  sql: "bg-purple-400",
  bash: "bg-emerald-500",
  sh: "bg-emerald-500",
  shell: "bg-emerald-500",
  json: "bg-yellow-300",
  yaml: "bg-rose-400",
  yml: "bg-rose-400",
  prisma: "bg-teal-400",
  markdown: "bg-zinc-400",
  md: "bg-zinc-400",
  rust: "bg-orange-500",
  go: "bg-cyan-400",
};

export function formatLanguageName(lang: string | null | undefined): string {
  if (!lang) return "Other";
  const clean = lang.trim().toLowerCase();
  switch (clean) {
    case "typescript":
    case "ts":
      return "TypeScript";
    case "javascript":
    case "js":
      return "JavaScript";
    case "tsx":
      return "TSX";
    case "jsx":
      return "JSX";
    case "html":
    case "html_css":
      return "HTML";
    case "css":
      return "CSS";
    case "python":
    case "py":
      return "Python";
    case "bash":
    case "sh":
    case "shell":
      return "Bash";
    case "sql":
      return "SQL";
    case "json":
      return "JSON";
    case "yaml":
    case "yml":
      return "YAML";
    case "prisma":
      return "Prisma";
    case "markdown":
    case "md":
      return "Markdown";
    case "rust":
      return "Rust";
    case "go":
      return "Go";
    default:
      return lang.charAt(0).toUpperCase() + lang.slice(1);
  }
}

interface LanguageDotProps {
  language: string | null | undefined;
  showLabel?: boolean;
  className?: string;
}

export function LanguageDot({
  language,
  showLabel = false,
  className,
}: LanguageDotProps) {
  const clean = (language || "").trim().toLowerCase();
  const dotColor = LANGUAGE_COLOR_MAP[clean] || "bg-zinc-500";
  const label = formatLanguageName(language);

  return (
    <span
      className={cn("inline-flex items-center gap-1.5 font-mono text-xs select-none", className)}
      title={label}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full shrink-0", dotColor)} aria-hidden="true" />
      {showLabel && <span className="text-muted">{label}</span>}
    </span>
  );
}
