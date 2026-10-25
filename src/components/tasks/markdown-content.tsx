"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";
import { cn } from "@/lib/utils";

interface MarkdownContentProps {
  content: string | null | undefined;
  className?: string;
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  if (!content || !content.trim()) {
    return (
      <div className="py-4 text-xs font-mono text-subtle italic select-none">
        No description provided.
      </div>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-invert max-w-none text-text-primary text-[13px] leading-relaxed font-sans",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-base font-semibold tracking-[-0.3px] text-text-primary mt-4 mb-2 pb-1 border-b border-line">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-sm font-semibold tracking-[-0.2px] text-text-primary mt-3.5 mb-1.5">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-[13px] font-semibold text-text-primary mt-3 mb-1">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-[13px] text-muted leading-relaxed my-2 break-words">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-muted text-[13px]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-muted text-[13px]">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-accent hover:underline break-all"
            >
              {children}
            </a>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded-[4px] bg-surface-2 border border-line font-mono text-[11px] text-text-primary"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3 my-2.5 rounded-[6px] bg-surface-2 border border-line font-mono text-xs overflow-x-auto text-text-primary">
                <code>{children}</code>
              </pre>
            );
          },
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-line-strong pl-3.5 my-2 italic text-subtle text-[13px]">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-3">
              <table className="w-full text-left text-xs font-mono border-collapse border border-line">
                {children}
              </table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border border-line bg-surface-2 px-2.5 py-1.5 font-semibold text-text-primary">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="border border-line px-2.5 py-1.5 text-muted">
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
