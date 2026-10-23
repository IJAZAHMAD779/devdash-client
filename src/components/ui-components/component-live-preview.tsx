"use client";

import { useMemo, useState } from "react";
import { Play, Maximize2, Minimize2, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  code: string;
  name: string;
  className?: string;
}

export function ComponentLivePreview({ code, name, className }: Props) {
  const [iframeKey, setIframeKey] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);

  // Generate safe HTML payload with Tailwind CSS
  const srcDoc = useMemo(() => {
    // 1. Clean JSX/React code into raw HTML elements
    let cleaned = code.trim();

    // If it's wrapped in a function/const:
    const returnMatch = cleaned.match(/return\s*\(\s*([\s\S]*?)\s*\);?/);
    if (returnMatch && returnMatch[1]) {
      cleaned = returnMatch[1].trim();
    }

    // Convert className="..." to class="..."
    cleaned = cleaned.replace(/className=/g, "class=");

    // Strip React fragments <> and </>
    cleaned = cleaned.replace(/<>\s*/g, "").replace(/\s*<\/>/g, "");

    // Strip self-closing tags with inner components that might break raw HTML
    // e.g. <Icon className="..." /> -> <span class="..."></span>
    cleaned = cleaned.replace(/<([A-Z][a-zA-Z0-9]*)\s+([^>]*?)\/>/g, '<span class="$2"></span>');

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      background-color: #0c0d0e;
      color: #f7f8f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      margin: 0;
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
    }
  </style>
</head>
<body>
  <div id="root" class="w-full flex items-center justify-center">
    ${cleaned}
  </div>
</body>
</html>`;
  }, [code]);

  return (
    <div
      className={cn(
        "relative rounded-lg bg-surface-1 border border-hairline overflow-hidden flex flex-col transition-all duration-200",
        isExpanded ? "h-96" : "h-64",
        className
      )}
    >
      {/* Top Toolbar */}
      <div className="px-3 py-1.5 bg-surface-2/80 border-b border-hairline flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-ink-tertiary">
          <Play className="w-3 h-3 text-emerald-400" />
          <span className="text-[11px] font-mono text-ink-muted">
            Live Preview
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setIframeKey((k: number) => k + 1)}
            title="Reload sandbox preview"
            className="p-1 rounded text-ink-tertiary hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Collapse preview" : "Expand preview"}
            className="p-1 rounded text-ink-tertiary hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <Minimize2 className="w-3 h-3" />
            ) : (
              <Maximize2 className="w-3 h-3" />
            )}
          </button>
        </div>
      </div>

      {/* Sandboxed iframe */}
      <iframe
        key={iframeKey}
        title={`Live Preview of ${name}`}
        srcDoc={srcDoc}
        sandbox="allow-scripts"
        className="w-full flex-1 border-0 bg-[#0c0d0e]"
      />
    </div>
  );
}
