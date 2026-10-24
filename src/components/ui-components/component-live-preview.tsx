"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Monitor, Tablet, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  code: string;
  name: string;
  mode?: "thumbnail" | "interactive";
  className?: string;
}

export function ComponentLivePreview({
  code,
  name,
  mode = "interactive",
  className,
}: Props) {
  const [iframeKey, setIframeKey] = useState(0);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Generate safe HTML payload with Tailwind CSS
  const srcDoc = useMemo(() => {
    let cleaned = code.trim();

    // If wrapped in a function/const:
    const returnMatch = cleaned.match(/return\s*\(\s*([\s\S]*?)\s*\);?/);
    if (returnMatch && returnMatch[1]) {
      cleaned = returnMatch[1].trim();
    }

    // Convert className="..." to class="..."
    cleaned = cleaned.replace(/className=/g, "class=");

    // Strip React fragments <> and </>
    cleaned = cleaned.replace(/<>\s*/g, "").replace(/\s*<\/>/g, "");

    // Strip self-closing tags with inner components that might break raw HTML
    cleaned = cleaned.replace(/<([A-Z][a-zA-Z0-9]*)\s+([^>]*?)\/>/g, '<span class="$2"></span>');

    const padding = mode === "thumbnail" ? "12px" : "24px";

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
      background-color: #090a0b;
      color: #f7f8f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      margin: 0;
      padding: ${padding};
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
      overflow-y: hidden;
      user-select: none;
    }
  </style>
</head>
<body>
  <div id="root" class="w-full flex items-center justify-center">
    ${cleaned}
  </div>
</body>
</html>`;
  }, [code, mode]);

  if (mode === "thumbnail") {
    return (
      <div className={cn("w-full h-full relative overflow-hidden pointer-events-none select-none", className)}>
        <iframe
          key={iframeKey}
          title={`Preview of ${name}`}
          srcDoc={srcDoc}
          sandbox="allow-scripts"
          className="w-full h-full border-0 bg-[#090a0b] pointer-events-none"
        />
      </div>
    );
  }

  // Interactive full mode (for detail view)
  return (
    <div
      className={cn(
        "relative rounded-xl bg-surface-1 border border-hairline overflow-hidden flex flex-col transition-all duration-200",
        className
      )}
    >
      {/* Clean Toolbar — No colored dots */}
      <div className="px-4 py-2 bg-surface-2/70 border-b border-hairline flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-ink-muted">
          <span className="text-xs font-medium tracking-tight">Interactive Canvas</span>
        </div>

        {/* Viewport switchers & reload */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md bg-surface-3/80 p-0.5 border border-hairline">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={cn(
                "p-1 rounded transition-colors cursor-pointer",
                viewport === "desktop" ? "bg-primary text-white shadow-xs" : "text-ink-tertiary hover:text-ink"
              )}
              title="Desktop viewport (100%)"
            >
              <Monitor className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("tablet")}
              className={cn(
                "p-1 rounded transition-colors cursor-pointer",
                viewport === "tablet" ? "bg-primary text-white shadow-xs" : "text-ink-tertiary hover:text-ink"
              )}
              title="Tablet viewport (768px)"
            >
              <Tablet className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setViewport("mobile")}
              className={cn(
                "p-1 rounded transition-colors cursor-pointer",
                viewport === "mobile" ? "bg-primary text-white shadow-xs" : "text-ink-tertiary hover:text-ink"
              )}
              title="Mobile viewport (375px)"
            >
              <Smartphone className="w-3.5 h-3.5" />
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIframeKey((k) => k + 1)}
            title="Reload sandbox preview"
            className="p-1.5 rounded-md text-ink-tertiary hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer border border-hairline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sandboxed iframe viewport */}
      <div className="flex-1 bg-[#090a0b] flex items-center justify-center p-4 min-h-[360px] overflow-auto">
        <div
          className={cn(
            "h-full w-full transition-all duration-200 flex items-center justify-center",
            viewport === "tablet" && "max-w-[768px] border-x border-hairline/60 shadow-xl",
            viewport === "mobile" && "max-w-[375px] border-x border-hairline/60 shadow-xl"
          )}
        >
          <iframe
            key={iframeKey}
            title={`Live Preview of ${name}`}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            className="w-full h-full min-h-[340px] border-0 bg-[#090a0b] rounded-lg"
          />
        </div>
      </div>
    </div>
  );
}
