"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Monitor, Tablet, Smartphone, AlertCircle, Code2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  code: string;
  name: string;
  category?: string;
  className?: string;
}

export function ComponentLivePreview({
  code,
  name,
  category,
  className,
}: Props) {
  const [iframeKey, setIframeKey] = useState(0);
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");

  // Generate safe HTML payload with in-browser Babel + React 18 + Lucide proxy + Tailwind
  const srcDoc = useMemo(() => {
    const serializedCode = JSON.stringify(code.trim());

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React 18 UMD -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- Babel Standalone for live in-browser TSX/JSX compilation -->
  <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
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
      padding: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow-x: hidden;
    }
    #root {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <div id="root">
    <div id="loading-spinner" class="flex flex-col items-center gap-2 text-zinc-500 text-xs font-mono">
      <div class="w-5 h-5 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin"></div>
      <span>Compiling React component...</span>
    </div>
  </div>

  <div id="error-fallback" style="display: none;" class="max-w-md p-4 rounded-xl border border-zinc-800 bg-zinc-900/80 text-center space-y-2 shadow-lg">
    <div class="text-xs font-semibold text-zinc-300">Live Preview Notice</div>
    <div id="error-message" class="text-[11px] text-zinc-400 leading-relaxed font-mono"></div>
  </div>

  <script>
    (function() {
      const rootEl = document.getElementById("root");
      const errorFallback = document.getElementById("error-fallback");
      const errorMessage = document.getElementById("error-message");

      function showError(msg) {
        rootEl.style.display = "none";
        errorFallback.style.display = "block";
        errorMessage.textContent = msg || "Component requires external modules or assets. Switch to the Code tab to view full implementation.";
      }

      function init() {
        if (typeof React === "undefined" || typeof ReactDOM === "undefined" || typeof Babel === "undefined") {
          setTimeout(init, 100);
          return;
        }

        try {
          const rawCode = ${serializedCode};

          // 1. Setup Sandbox Execution Context on window
          window.React = React;
          window.ReactDOM = ReactDOM;
          window.useState = React.useState;
          window.useEffect = React.useEffect;
          window.useMemo = React.useMemo;
          window.useCallback = React.useCallback;
          window.useRef = React.useRef;
          window.createContext = React.createContext;
          window.useContext = React.useContext;
          window.useReducer = React.useReducer;
          window.forwardRef = React.forwardRef;
          window.cn = function(...classes) { return classes.filter(Boolean).join(" "); };

          // Lucide icon helper
          const iconPathMap = {
            User: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
            Heart: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
            Star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
            Check: "M20 6 9 17l-5-5",
            Plus: "M5 12h14 M12 5v14",
            Search: "m21 21-4.3-4.3 M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
            Settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
            Sparkles: "m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z",
            ChevronRight: "m9 18 6-6-6-6",
            ChevronDown: "m6 9 6 6 6-6",
            Play: "polygon points='6 3 20 12 6 21 6 3'",
            Pause: "rect width='4' height='16' x='6' y='4' rect width='4' height='16' x='14' y='4'",
            RotateCcw: "path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' path d='M3 3v5h5'",
            Trophy: "path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6' path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18' path d='M4 22h16' path d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' path d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' path d='M18 2H6v7a6 6 0 0 0 12 0V2Z'",
          };

          function makeIcon(iconName) {
            return function(props) {
              const d = iconPathMap[iconName] || "M12 2v20 M2 12h20";
              return React.createElement(
                "svg",
                {
                  xmlns: "http://www.w3.org/2000/svg",
                  viewBox: "0 0 24 24",
                  fill: "none",
                  stroke: "currentColor",
                  strokeWidth: "2",
                  strokeLinecap: "round",
                  strokeLinejoin: "round",
                  className: (props && props.className) || "w-4 h-4"
                },
                React.createElement("path", { d: d })
              );
            };
          }

          Object.keys(iconPathMap).forEach(function(iconName) {
            window[iconName] = makeIcon(iconName);
          });

          // Missing Subcomponent Proxy (e.g. AvatarLabelGroup, Tooltip, Dropdown, etc.)
          function makeProxyComponent(compName) {
            return function(props) {
              if (props && props.children) {
                return React.createElement("div", { className: props.className || "inline-block" }, props.children);
              }
              const title = (props && (props.title || props.name || props.alt)) || compName;
              const subtitle = props && props.subtitle;
              const src = props && props.src;

              if (src || subtitle) {
                return React.createElement(
                  "div",
                  { className: (props && props.className) || "inline-flex items-center gap-3 p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 shadow-md" },
                  src ? React.createElement("img", { src: src, alt: title, className: "w-10 h-10 rounded-full object-cover border border-zinc-700 shrink-0" }) : null,
                  React.createElement(
                    "div",
                    { className: "min-w-0" },
                    React.createElement("div", { className: "font-semibold text-zinc-100 truncate" }, title),
                    subtitle ? React.createElement("div", { className: "text-zinc-400 text-[11px] truncate font-normal" }, subtitle) : null
                  )
                );
              }

              return React.createElement(
                "div",
                { className: (props && props.className) || "inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-zinc-300 shadow-sm" },
                title
              );
            };
          }

          [
            "Avatar", "AvatarImage", "AvatarFallback", "AvatarLabelGroup",
            "Button", "Badge", "Card", "CardHeader", "CardTitle", "CardDescription", "CardContent", "CardFooter",
            "Input", "Label", "Dialog", "DialogTrigger", "DialogContent", "DialogHeader", "DialogTitle", "DialogDescription",
            "DropdownMenu", "DropdownMenuTrigger", "DropdownMenuContent", "DropdownMenuItem",
            "Tabs", "TabsList", "TabsTrigger", "TabsContent",
            "Tooltip", "TooltipTrigger", "TooltipContent", "TooltipProvider",
            "Skeleton", "Switch", "Select", "SelectTrigger", "SelectValue", "SelectContent", "SelectItem"
          ].forEach(function(name) {
            window[name] = makeProxyComponent(name);
          });

          // 2. Preprocess Code: Strip imports and normalize exports
          let processed = rawCode;
          processed = processed.replace(/^\\s*import\\s+[^;]+;?\\s*$/gm, "");
          processed = processed.replace(/import\\s+([\\s\\S]*?)\\s+from\\s+['"][^'"]+['"];?/g, "");
          processed = processed.replace(/export\\s+default\\s+/g, "window.__DevDashExportDefault = ");
          processed = processed.replace(/export\\s+(function|const|let|var|class)\\s+/g, "window.");

          // 3. Compile with Babel using standard presets without obsolete options
          const transformed = Babel.transform(processed, {
            presets: ["react", "typescript"],
            filename: "component.tsx"
          }).code;

          // 4. Execute transformed code in global scope
          window.eval(transformed);

          // 5. Discover exported component to mount
          let ComponentToRender = window.__DevDashExportDefault;

          if (!ComponentToRender) {
            // Find any declared uppercase component on window
            const matches = Array.from(rawCode.matchAll(/(?:function|const|let)\\s+([A-Z][a-zA-Z0-9]*)/g));
            for (let i = 0; i < matches.length; i++) {
              const compName = matches[i][1];
              try {
                if (typeof window[compName] === "function") {
                  ComponentToRender = window[compName];
                  break;
                }
              } catch(e) {}
            }
          }

          if (!ComponentToRender) {
            showError("Could not find a React component to mount. Please ensure the component is exported (e.g. export const MyComponent = () => ...).");
            return;
          }

          // 6. Mount to DOM
          rootEl.innerHTML = "";
          const root = ReactDOM.createRoot(rootEl);
          root.render(React.createElement(ComponentToRender));

        } catch (err) {
          showError(err && err.message ? err.message : String(err));
        }
      }

      init();
    })();
  </script>
</body>
</html>`;
  }, [code]);

  return (
    <div
      className={cn(
        "relative rounded-2xl bg-surface-1 border border-hairline overflow-hidden flex flex-col transition-all duration-200 shadow-inner",
        className
      )}
    >
      {/* Clean Toolbar — No colored dots */}
      <div className="px-4 py-2 bg-surface-2/70 border-b border-hairline flex items-center justify-between text-xs">
        <div className="flex items-center gap-2 text-ink-muted">
          <span className="text-xs font-semibold tracking-tight text-ink">Live React Sandbox</span>
          <span className="text-ink-tertiary">·</span>
          <span className="text-[11px] font-mono text-ink-tertiary">Babel + React 18</span>
        </div>

        {/* Viewport switchers & reload */}
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-lg bg-surface-3/80 p-0.5 border border-hairline">
            <button
              type="button"
              onClick={() => setViewport("desktop")}
              className={cn(
                "p-1.5 rounded-md transition-colors cursor-pointer",
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
                "p-1.5 rounded-md transition-colors cursor-pointer",
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
                "p-1.5 rounded-md transition-colors cursor-pointer",
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
            className="p-1.5 rounded-lg text-ink-tertiary hover:text-ink hover:bg-surface-3 transition-colors cursor-pointer border border-hairline"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sandboxed iframe viewport */}
      <div className="flex-1 bg-[#090a0b] flex items-center justify-center p-4 min-h-[440px] overflow-auto">
        <div
          className={cn(
            "h-full w-full transition-all duration-200 flex items-center justify-center",
            viewport === "tablet" && "max-w-[768px] border-x border-hairline/60 shadow-2xl",
            viewport === "mobile" && "max-w-[375px] border-x border-hairline/60 shadow-2xl"
          )}
        >
          <iframe
            key={iframeKey}
            title={`Live Preview of ${name}`}
            srcDoc={srcDoc}
            sandbox="allow-scripts"
            className="w-full h-full min-h-[420px] border-0 bg-[#090a0b] rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}
