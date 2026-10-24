"use client";

import {
  Code2,
  Terminal,
  Database,
  Globe,
  FileCode,
  FileCode2,
  Braces,
  Palette,
  FileText,
} from "lucide-react";
import { sound } from "@/lib/audio";

interface SnippetFolderCardProps {
  language: string;
  count: number;
  onClick: () => void;
}

export function getLanguageIcon(lang: string) {
  const l = lang.toLowerCase();
  if (l === "html" || l === "html_css") {
    return <Globe className="w-10 h-10 text-orange-400 stroke-[1.5]" />;
  }
  if (l === "css" || l === "scss" || l === "tailwind") {
    return <Palette className="w-10 h-10 text-cyan-400 stroke-[1.5]" />;
  }
  if (l === "typescript" || l === "ts" || l === "tsx") {
    return <Braces className="w-10 h-10 text-blue-400 stroke-[1.5]" />;
  }
  if (l === "javascript" || l === "js" || l === "jsx") {
    return <Code2 className="w-10 h-10 text-amber-400 stroke-[1.5]" />;
  }
  if (l === "python" || l === "py") {
    return <FileCode2 className="w-10 h-10 text-emerald-400 stroke-[1.5]" />;
  }
  if (l === "bash" || l === "sh" || l === "shell" || l === "zsh") {
    return <Terminal className="w-10 h-10 text-emerald-400 stroke-[1.5]" />;
  }
  if (l === "sql" || l === "prisma" || l === "postgres") {
    return <Database className="w-10 h-10 text-indigo-400 stroke-[1.5]" />;
  }
  if (l === "json" || l === "yaml" || l === "yml") {
    return <FileText className="w-10 h-10 text-yellow-400 stroke-[1.5]" />;
  }
  return <FileCode className="w-10 h-10 text-primary stroke-[1.5]" />;
}

export function formatLanguageLabel(lang: string): string {
  const l = lang.toLowerCase();
  if (l === "all") return "All Snippets";
  if (l === "html") return "HTML / Web";
  if (l === "css") return "CSS / Styling";
  if (l === "typescript") return "TypeScript";
  if (l === "javascript") return "JavaScript";
  if (l === "python") return "Python";
  if (l === "bash") return "Bash / Shell";
  if (l === "sql") return "SQL / Database";
  if (l === "prisma") return "Prisma ORM";
  if (l === "json") return "JSON";
  if (l === "yaml") return "YAML";
  return lang.charAt(0).toUpperCase() + lang.slice(1);
}

export function SnippetFolderCard({
  language,
  count,
  onClick,
}: SnippetFolderCardProps) {
  const handleClick = () => {
    sound.playClick(850);
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col p-4 rounded-2xl bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 select-none"
    >
      {/* Blueprint Viewport (matching Image 1 - clean frame, blueprint grid overlay, no colored dots) */}
      <div className="w-full h-44 rounded-xl bg-[#090a0b] border border-hairline/60 flex flex-col items-center justify-center p-4 relative overflow-hidden group-hover:border-primary/40 transition-colors">
        {/* Subtle blueprint grid overlay */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#141517_1px,transparent_1px),linear-gradient(to_bottom,#141517_1px,transparent_1px)] bg-[size:16px_16px] opacity-35 pointer-events-none" />

        {/* Ambient language icon container */}
        <div className="relative z-10 w-20 h-20 rounded-2xl bg-surface-2/80 border border-hairline flex items-center justify-center shadow-inner group-hover:scale-105 group-hover:border-hairline-strong transition-all duration-200">
          {getLanguageIcon(language)}
        </div>

        {/* Language badge overlay */}
        <div className="absolute bottom-2.5 right-2.5 z-10">
          <span className="px-2 py-0.5 rounded-md bg-surface-2/90 border border-hairline font-mono text-[10px] text-ink-muted uppercase">
            {language}
          </span>
        </div>
      </div>

      {/* Card Footer Text matching Image 1 */}
      <div className="mt-3 px-1">
        <h3 className="text-sm font-semibold tracking-[-0.2px] text-ink group-hover:text-primary transition-colors truncate">
          {formatLanguageLabel(language)}
        </h3>
        <p className="text-xs text-ink-muted mt-0.5 tracking-tight font-normal">
          {count} {count === 1 ? "snippet" : "snippets"}
        </p>
      </div>
    </div>
  );
}
