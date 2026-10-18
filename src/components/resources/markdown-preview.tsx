"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

interface Props {
  content: string;
  className?: string;
}

export function MarkdownPreview({ content, className }: Props) {
  if (!content || !content.trim()) {
    return (
      <div className="py-8 text-center text-ink-muted text-xs italic">
        No content to preview
      </div>
    );
  }

  return (
    <div
      className={cn(
        "prose prose-invert max-w-none text-ink text-xs leading-relaxed space-y-3 font-sans",
        className
      )}
    >
      <ReactMarkdown
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold tracking-[-0.6px] text-ink pb-2 border-b border-hairline mt-4 mb-2">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-base font-semibold tracking-[-0.4px] text-ink mt-4 mb-2">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-sm font-semibold tracking-[-0.2px] text-ink mt-3 mb-1.5">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="text-xs text-ink-muted leading-relaxed my-2">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 my-2 space-y-1 text-ink-muted text-xs">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 my-2 space-y-1 text-ink-muted text-xs">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="my-0.5">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-primary/70 pl-3 my-2 text-ink-muted italic bg-surface-2/40 py-1 rounded-r">
              {children}
            </blockquote>
          ),
          code: ({ className, children, ...props }) => {
            const isInline = !className;
            if (isInline) {
              return (
                <code
                  className="px-1.5 py-0.5 rounded bg-surface-2 border border-hairline font-mono text-[11px] text-primary-hover"
                  {...props}
                >
                  {children}
                </code>
              );
            }
            return (
              <pre className="p-3.5 rounded-lg bg-canvas border border-hairline font-mono text-[11px] text-ink overflow-x-auto leading-relaxed my-2.5">
                <code {...props}>{children}</code>
              </pre>
            );
          },
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-hover underline underline-offset-2 transition-colors font-medium"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="border-hairline my-4" />,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
