"use client";

import React, { useMemo } from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  noteTitle?: string;
  className?: string;
}

export function MarkdownPreview({ content, noteTitle, className }: Props) {
  // Pure preprocessing step: hide the leading H1 if it equals the note title (display-only)
  const displayContent = useMemo(() => {
    if (!content) return "";
    let trimmed = content.trimStart();
    if (noteTitle && noteTitle.trim()) {
      const normalizedTitle = noteTitle.trim().toLowerCase();
      const h1Match = trimmed.match(/^#\s+([^\r\n]+)(?:\r?\n+|$)/);
      if (h1Match) {
        const headingText = h1Match[1].trim().toLowerCase();
        if (headingText === normalizedTitle) {
          trimmed = trimmed.slice(h1Match[0].length);
        }
      }
    }
    return trimmed;
  }, [content, noteTitle]);

  if (!displayContent.trim()) {
    return (
      <div className="py-12 text-center text-ink-subtle text-xs italic select-none">
        No content to preview
      </div>
    );
  }

  return (
    <div className={cn("w-full flex justify-start", className)}>
      <div className="w-full max-w-[72ch] text-ink text-[14px] leading-[1.7] space-y-4 font-sans select-text">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-[24px] font-bold tracking-headline text-ink pb-2 border-b border-hairline mt-6 mb-3 leading-snug">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-[18px] font-semibold tracking-card-title text-ink mt-5 mb-2.5 leading-snug">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-[15px] font-semibold tracking-subhead text-ink mt-4 mb-2 leading-snug">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-[14px] text-ink-muted leading-[1.7] my-3">
                {children}
              </p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-5 my-3 space-y-1 text-ink-muted text-[14px] leading-[1.7]">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-5 my-3 space-y-1 text-ink-muted text-[14px] leading-[1.7]">
                {children}
              </ol>
            ),
            li: ({ children }) => <li className="my-0.5">{children}</li>,
            blockquote: ({ children }) => (
              <blockquote className="border-l-2 border-hairline-strong pl-4 my-3 text-ink-subtle italic bg-surface-2/30 py-1.5 rounded-r">
                {children}
              </blockquote>
            ),
            code: ({ className, children, ...props }) => {
              const isInline = !className;
              if (isInline) {
                return (
                  <code
                    className="px-1.5 py-0.5 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[13px] text-ink"
                    {...props}
                  >
                    {children}
                  </code>
                );
              }
              return (
                <pre className="p-4 rounded-[6px] bg-surface-2 border border-hairline font-mono text-[13px] text-ink overflow-x-auto leading-relaxed my-3.5">
                  <code {...props}>{children}</code>
                </pre>
              );
            },
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-accent hover:underline transition-colors font-medium"
              >
                {children}
              </a>
            ),
            table: ({ children }) => (
              <div className="overflow-x-auto my-4 border border-hairline rounded-[6px]">
                <table className="w-full text-left text-[13px] border-collapse">
                  {children}
                </table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border-b border-hairline bg-surface-2/60 p-2.5 font-semibold text-ink text-[12px]">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border-b border-hairline/60 p-2.5 text-ink-muted">
                {children}
              </td>
            ),
            hr: () => <hr className="border-hairline my-6" />,
          }}
        >
          {displayContent}
        </ReactMarkdown>
      </div>
    </div>
  );
}
