"use client";

import React, { useState, useEffect, useMemo } from "react";
import { codeToHtml } from "shiki";
import { cn } from "@/lib/utils";

// Global in-memory cache for highlighted code slices to prevent redundant re-renders
const highlightCache = new Map<string, string>();

interface CodePreviewProps {
  code: string;
  language: string;
  snippetId?: string;
  updatedAt?: string;
  maxLines?: number;
  className?: string;
}

const SUPPORTED_LANGUAGES = [
  "typescript",
  "javascript",
  "tsx",
  "jsx",
  "html",
  "css",
  "json",
  "python",
  "bash",
  "sql",
  "prisma",
  "yaml",
  "markdown",
  "rust",
  "go",
];

export function CodePreview({
  code,
  language,
  snippetId = "default",
  updatedAt = "",
  maxLines = 9,
  className,
}: CodePreviewProps) {
  // 1. Slice code before highlighting for high performance
  const { slicedCode, lines } = useMemo(() => {
    const rawLines = code.trim().split("\n");
    const sliced = rawLines.slice(0, maxLines).join("\n");
    return { slicedCode: sliced, lines: rawLines.slice(0, maxLines) };
  }, [code, maxLines]);

  const cleanLang = useMemo(() => {
    const l = language.trim().toLowerCase();
    if (l === "ts") return "typescript";
    if (l === "js") return "javascript";
    if (l === "py") return "python";
    if (l === "sh" || l === "shell") return "bash";
    if (l === "html_css") return "html";
    if (l === "yml") return "yaml";
    if (l === "md") return "markdown";
    return SUPPORTED_LANGUAGES.includes(l) ? l : "typescript";
  }, [language]);

  const cacheKey = `${snippetId}:${cleanLang}:${updatedAt || slicedCode}`;

  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(() => {
    return highlightCache.get(cacheKey) || null;
  });

  useEffect(() => {
    if (highlightCache.has(cacheKey)) {
      setHighlightedHtml(highlightCache.get(cacheKey)!);
      return;
    }

    let isCancelled = false;

    async function highlight() {
      try {
        const html = await codeToHtml(slicedCode, {
          lang: cleanLang,
          theme: "vitesse-dark",
        });

        if (!isCancelled) {
          highlightCache.set(cacheKey, html);
          setHighlightedHtml(html);
        }
      } catch {
        if (!isCancelled) {
          setHighlightedHtml(null);
        }
      }
    }

    highlight();

    return () => {
      isCancelled = true;
    };
  }, [cacheKey, slicedCode, cleanLang]);

  return (
    <div
      className={cn(
        "relative w-full h-[180px] bg-surface-1/90 overflow-hidden font-mono text-[11px] leading-[20px] select-none p-3",
        className
      )}
    >
      {highlightedHtml ? (
        <div className="flex gap-2.5 h-full overflow-hidden">
          {/* Line Numbers Gutter */}
          <div className="select-none text-right shrink-0 text-subtle/50 font-mono text-[10px] leading-[20px] w-4">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>

          {/* Shiki Highlighted Code Container */}
          <div
            className="flex-1 overflow-hidden font-mono [&>pre]:!bg-transparent [&>pre]:!p-0 [&>pre]:!m-0 [&>pre]:leading-[20px] [&>pre_code]:!font-mono [&>pre_code]:!text-[11px]"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </div>
      ) : (
        /* Fallback / Instant plain-text view with line numbers */
        <div className="flex gap-2.5 h-full overflow-hidden text-muted">
          <div className="select-none text-right shrink-0 text-subtle/50 font-mono text-[10px] leading-[20px] w-4">
            {lines.map((_, i) => (
              <div key={i}>{i + 1}</div>
            ))}
          </div>
          <div className="flex-1 overflow-hidden font-mono leading-[20px]">
            {lines.map((line, idx) => (
              <div key={idx} className="truncate">
                {line || " "}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bottom gradient fade to card background */}
      <div className="pointer-events-none absolute bottom-0 inset-x-0 h-10 bg-gradient-to-t from-surface-1 to-transparent" />
    </div>
  );
}
