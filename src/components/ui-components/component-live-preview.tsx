"use client";

import { useMemo, useState } from "react";
import { RefreshCw, Monitor, Tablet, Smartphone } from "lucide-react";
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

  // Generate safe HTML payload with in-browser Babel 7 + React 18 + CommonJS require runtime
  const srcDoc = useMemo(() => {
    const serializedCode = JSON.stringify(code.trim());
    const baseOrigin = typeof window !== "undefined" ? window.location.origin : "";

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <base href="${baseOrigin}/" />
  <!-- Tailwind CSS CDN -->
  <script src="https://cdn.tailwindcss.com"></script>
  <!-- React 18 UMD -->
  <script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>
  <script src="https://unpkg.com/react-dom@18/umd/react-dom.production.min.js"></script>
  <!-- Babel Standalone 7.26.4 (Stable pinned release from cdnjs) -->
  <script src="https://cdnjs.cloudflare.com/ajax/libs/babel-standalone/7.26.4/babel.min.js"></script>
  <style>
    *, *::before, *::after {
      box-sizing: border-box;
    }
    body {
      background-color: #090a0b;
      background-image: radial-gradient(circle at 1px 1px, rgba(255, 255, 255, 0.05) 1px, transparent 0);
      background-size: 24px 24px;
      color: #f7f8f8;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      margin: 0;
      padding: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: auto;
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

  <div id="error-fallback" style="display: none;" class="max-w-md p-4 rounded-xl border border-zinc-800 bg-zinc-900/90 text-center space-y-2 shadow-2xl backdrop-blur-md">
    <div class="text-xs font-semibold text-zinc-200 flex items-center justify-center gap-1.5">
      <span class="w-2 h-2 rounded-full bg-amber-500 inline-block"></span>
      <span>Live Preview Notice</span>
    </div>
    <div id="error-message" class="text-[11px] text-zinc-400 leading-relaxed font-mono text-left bg-black/40 p-2.5 rounded-lg border border-zinc-800 break-words"></div>
    <div class="text-[10px] text-zinc-500 font-sans">Switch to the Code tab to view or edit full component source.</div>
  </div>

  <script>
    (function() {
      // 0. Provide bulletproof in-memory storage fallback to prevent DOMException in sandboxed frames
      function createStorageMock() {
        var store = {};
        return {
          getItem: function(k) { return Object.prototype.hasOwnProperty.call(store, k) ? store[k] : null; },
          setItem: function(k, v) { store[k] = String(v); },
          removeItem: function(k) { delete store[k]; },
          clear: function() { store = {}; },
          key: function(i) { return Object.keys(store)[i] || null; },
          get length() { return Object.keys(store).length; }
        };
      }
      var memStorage = createStorageMock();
      try {
        window.localStorage.getItem("devdash_test");
      } catch (e) {
        try {
          Object.defineProperty(window, "localStorage", { value: memStorage, configurable: true, writable: true });
          Object.defineProperty(window, "sessionStorage", { value: memStorage, configurable: true, writable: true });
        } catch (_) {}
      }

      var rootEl = document.getElementById("root");
      var errorFallback = document.getElementById("error-fallback");
      var errorMessage = document.getElementById("error-message");

      function showError(msg) {
        rootEl.style.display = "none";
        errorFallback.style.display = "block";
        errorMessage.textContent = msg || "Component requires external modules or assets. Switch to the Code tab to view full implementation.";
      }

      window.onerror = function(msg, url, line, col, err) {
        showError((err && err.message) || msg || "Runtime error occurred in component.");
      };

      window.addEventListener("unhandledrejection", function(ev) {
        showError((ev.reason && ev.reason.message) || String(ev.reason));
      });

      var checkCount = 0;
      function init() {
        if (typeof React === "undefined" || typeof ReactDOM === "undefined" || typeof Babel === "undefined") {
          checkCount++;
          if (checkCount > 60) {
            showError("Could not load sandbox compiler. Please check your internet connection and refresh.");
            return;
          }
          setTimeout(init, 100);
          return;
        }

        try {
          var rawCode = ${serializedCode};

          // 1. Setup Sandbox Lucide Icon Dictionary
          var iconPathMap = {
            User: "M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2 M12 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
            Heart: "M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",
            Star: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z",
            Check: "M20 6 9 17l-5-5",
            Plus: "M5 12h14 M12 5v14",
            Search: "m21 21-4.3-4.3 M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z",
            Settings: "M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8z",
            Settings2: "M20 7h-9 M14 17H5 M7 7H4 M20 17h-3 M14 5v4 M11 15v4",
            Sparkles: "m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3Z",
            ChevronRight: "m9 18 6-6-6-6",
            ChevronLeft: "m15 18-6-6 6-6",
            ChevronDown: "m6 9 6 6 6-6",
            ChevronUp: "m18 15-6-6-6 6",
            Play: "polygon points='6 3 20 12 6 21 6 3'",
            Pause: "rect width='4' height='16' x='6' y='4' rect width='4' height='16' x='14' y='4'",
            RotateCcw: "path d='M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8' path d='M3 3v5h5'",
            Trophy: "path d='M6 9H4.5a2.5 2.5 0 0 1 0-5H6' path d='M18 9h1.5a2.5 2.5 0 0 0 0-5H18' path d='M4 22h16' path d='M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22' path d='M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22' path d='M18 2H6v7a6 6 0 0 0 12 0V2Z'",
          };

          function makeIcon(iconName) {
            return function(props) {
              var d = iconPathMap[iconName] || "M12 2v20 M2 12h20";
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

          // 2. Setup Subcomponent Proxy
          function makeProxyComponent(compName) {
            return function(props) {
              if (props && props.isOpen === false) return null;
              if (props && props.children) {
                return React.createElement("div", { className: props.className || "inline-block" }, props.children);
              }
              var title = (props && (props.title || props.name || props.alt)) || compName;
              var subtitle = props && props.subtitle;
              var src = props && props.src;

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

          // 3. Fallback sprite & Safe Object Proxy
          var fallbackSpriteSvg = encodeURIComponent("<svg xmlns='http://www.w3.org/2000/svg' width='300' height='300' viewBox='0 0 300 300'><rect width='300' height='300' fill='%2318181b'/><circle cx='50' cy='50' r='30' fill='%23f97316'/><circle cx='150' cy='50' r='30' fill='%23f97316'/><circle cx='250' cy='50' r='30' fill='%23f97316'/><circle cx='50' cy='150' r='30' fill='%23f97316'/><circle cx='150' cy='150' r='30' fill='%23f97316'/><circle cx='250' cy='150' r='30' fill='%23f97316'/><circle cx='50' cy='250' r='30' fill='%23f97316'/><circle cx='150' cy='250' r='30' fill='%23f97316'/><circle cx='250' cy='250' r='30' fill='%23f97316'/></svg>");
          var fallbackSpriteUrl = "data:image/svg+xml;charset=utf-8," + fallbackSpriteSvg;

          var SafeObjectProxy = new Proxy(function() {}, {
            get: function(target, prop) {
              if (prop === "name") return "Dev Pet";
              if (prop === "title") return "Preview Item";
              if (prop === "species") return "Chibi Fox";
              if (prop === "emoji") return "🦊";
              if (prop === "enabled") return true;
              if (prop === "style") return "default";
              if (prop === "size") return "md";
              if (prop === "petId") return "fox";
              if (prop === "hasPixelStyle") return true;
              if (prop === "directionsUrl") return "/mascots/fox-directions.webp";
              if (prop === "reactionsUrl") return "/mascots/fox-reactions.webp";
              if (prop === "pixelDirectionsUrl") return "/mascots/fox-pixel-directions.webp";
              if (prop === "pixelReactionsUrl") return "/mascots/fox-pixel-reactions.webp";
              if (prop in iconPathMap) return makeIcon(String(prop));
              return SafeObjectProxy;
            },
            apply: function() {
              return SafeObjectProxy;
            }
          });

          // 4. In-Browser Module Resolver
          var LucideProxy = new Proxy({}, {
            get: function(target, prop) {
              return makeIcon(String(prop));
            }
          });

          var KnownWorkspaceModules = {
            "@/lib/utils": { cn: function() { return Array.prototype.slice.call(arguments).filter(Boolean).join(" "); } },
            "@/types/pet": {
              DEFAULT_PET_SETTINGS: { enabled: true, petId: "fox", size: "md", style: "default" }
            },
            "./pet-catalog": {
              PET_CATALOG: [
                { id: "fox", name: "Kitsune", species: "Chibi Fox", emoji: "🦊", directionsUrl: "/mascots/fox-directions.webp", reactionsUrl: "/mascots/fox-reactions.webp", hasPixelStyle: true, pixelDirectionsUrl: "/mascots/fox-pixel-directions.webp", pixelReactionsUrl: "/mascots/fox-pixel-reactions.webp" },
                { id: "cat", name: "Mochi", species: "Neko Cat", emoji: "🐱", directionsUrl: "/mascots/cat-directions.webp", reactionsUrl: "/mascots/cat-reactions.webp" },
                { id: "dino", name: "Rex", species: "Mini Dino", emoji: "🦖", directionsUrl: "/mascots/dino-directions.webp", reactionsUrl: "/mascots/dino-reactions.webp" },
                { id: "gearbot", name: "Byte", species: "Cyber Bot", emoji: "🤖", directionsUrl: "/mascots/gearbot-directions.webp", reactionsUrl: "/mascots/gearbot-reactions.webp" }
              ],
              getPetById: function(id) {
                return {
                  id: id || "fox",
                  name: "Kitsune",
                  species: "Chibi Fox",
                  emoji: "🦊",
                  directionsUrl: "/mascots/fox-directions.webp",
                  reactionsUrl: "/mascots/fox-reactions.webp",
                  hasPixelStyle: true,
                  pixelDirectionsUrl: "/mascots/fox-pixel-directions.webp",
                  pixelReactionsUrl: "/mascots/fox-pixel-reactions.webp"
                };
              }
            },
            "next/link": function(props) { return React.createElement("a", { href: props.href || "#", className: props.className }, props.children); },
            "next/image": function(props) { return React.createElement("img", { src: props.src, alt: props.alt || "", width: props.width, height: props.height, className: props.className }); },
            "next/navigation": {
              useRouter: function() { return { push: function(){}, replace: function(){}, back: function(){} }; },
              usePathname: function() { return "/"; },
              useSearchParams: function() { return new URLSearchParams(); }
            },
            "framer-motion": {
              motion: new Proxy({}, {
                get: function(t, tag) {
                  return function(props) {
                    var safeProps = Object.assign({}, props);
                    delete safeProps.initial;
                    delete safeProps.animate;
                    delete safeProps.exit;
                    delete safeProps.transition;
                    delete safeProps.whileHover;
                    delete safeProps.whileTap;
                    return React.createElement(tag, safeProps);
                  };
                }
              }),
              AnimatePresence: function(props) { return props.children; }
            }
          };

          var CustomComponentsProxy = new Proxy({}, {
            get: function(target, prop) {
              if (prop === "cn") {
                return function() { return Array.prototype.slice.call(arguments).filter(Boolean).join(" "); };
              }
              // Only treat as React component if PascalCase (e.g. Button, Modal) NOT all-caps constant (e.g. DEFAULT_SETTINGS)
              if (typeof prop === "string" && /^[A-Z][a-zA-Z0-9]+$/.test(prop)) {
                return makeProxyComponent(String(prop));
              }
              // For all-caps constants or config objects
              if (typeof prop === "string" && /^[A-Z0-9_]+$/.test(prop)) {
                return { enabled: true, size: "md", style: "default", petId: "fox" };
              }
              return SafeObjectProxy;
            }
          });

          function customRequire(moduleName) {
            if (moduleName === "react") return React;
            if (moduleName === "react-dom" || moduleName === "react-dom/client") return ReactDOM;
            if (moduleName === "lucide-react") return LucideProxy;
            if (KnownWorkspaceModules[moduleName]) return KnownWorkspaceModules[moduleName];
            return CustomComponentsProxy;
          }

          // 5. Preprocess Code: Transform imports to require() and collect exports
          var processed = rawCode;

          // Strip "use client"
          processed = processed.replace(/^["']use client["'];?\\s*/m, "");

          // Strip import type
          processed = processed.replace(/import\\s+type\\s+[^;]+;?/g, "");

          // Replace import * as Foo from "foo"
          processed = processed.replace(
            /import\\s*\\*\\s*as\\s+([\\w$]+)\\s*from\\s*['"]([^'"]+)['"];?/g,
            'var $1 = require("$2");'
          );

          // Replace import Foo, { a, b as c } from "foo"
          processed = processed.replace(
            /import\\s+(?:([\\w$]+)\\s*,?\\s*)?(?:\\{([^}]+)\\})?\\s*from\\s*['"]([^'"]+)['"];?/g,
            function(_, defaultImport, namedImports, moduleName) {
              var lines = [];
              var modVar = "_mod_" + Math.random().toString(36).slice(2, 7);
              lines.push('var ' + modVar + ' = require("' + moduleName + '");');

              if (defaultImport) {
                lines.push('var ' + defaultImport.trim() + ' = (' + modVar + ' && ' + modVar + '.default) ? ' + modVar + '.default : ' + modVar + ';');
              }

              if (namedImports) {
                var specs = namedImports.split(",").map(function(s) { return s.trim(); }).filter(Boolean);
                specs.forEach(function(spec) {
                  spec = spec.replace(/^type\\s+/, "");
                  if (spec.includes(" as ")) {
                    var parts = spec.split(" as ").map(function(x) { return x.trim(); });
                    lines.push('var ' + parts[1] + ' = ' + modVar + '["' + parts[0] + '"];');
                  } else {
                    lines.push('var ' + spec + ' = ' + modVar + '["' + spec + '"];');
                  }
                });
              }
              return lines.join("\\n");
            }
          );

          // Strip side-effect imports
          processed = processed.replace(/import\\s*['"][^'"]+['"];?/g, "");

          // Collect explicitly exported names before stripping keywords
          var exportedNames = [];
          var exportFuncRegex = /export\\s+function\\s+([A-Za-z0-9_$]+)/g;
          var match;
          while ((match = exportFuncRegex.exec(processed)) !== null) {
            exportedNames.push(match[1]);
          }
          var exportConstRegex = /export\\s+(?:const|let|var)\\s+([A-Za-z0-9_$]+)/g;
          while ((match = exportConstRegex.exec(processed)) !== null) {
            exportedNames.push(match[1]);
          }

          // If no explicit exports found, scan top-level PascalCase identifiers
          if (exportedNames.length === 0) {
            var topFuncRegex = /(?:function|const|let|var)\\s+([A-Z][A-Za-z0-9_$]+)/g;
            var topMatch;
            while ((topMatch = topFuncRegex.exec(processed)) !== null) {
              exportedNames.push(topMatch[1]);
            }
          }

          // Strip export default and export keywords
          processed = processed.replace(/export\\s+default\\s+/g, "module.exports.default = ");
          processed = processed.replace(/export\\s+(function|const|let|var|class)\\s+/g, "$1 ");

          // Attach exported names onto module.exports
          exportedNames.forEach(function(expName) {
            processed += "\\nif (typeof " + expName + " !== 'undefined') { module.exports['" + expName + "'] = " + expName + "; }";
          });

          // Fallback to default
          processed += "\\nif (!module.exports.default) {\\n" +
            "  for (var k of Object.keys(module.exports)) {\\n" +
            "    if (typeof module.exports[k] === 'function') { module.exports.default = module.exports[k]; break; }\\n" +
            "  }\\n" +
            "}";

          // 6. Compile with Babel 7 Standalone (JSX + TypeScript)
          var transformed = Babel.transform(processed, {
            presets: ["react", "typescript"],
            filename: "component.tsx"
          }).code;

          // 7. Execute in isolated module environment (React and globals resolve from window)
          var moduleObj = { exports: {} };
          var runFn = new Function(
            "module",
            "exports",
            "require",
            transformed
          );
          runFn(moduleObj, moduleObj.exports, customRequire);

          // 8. Discover the component to mount
          var exported = moduleObj.exports;
          var ComponentToRender = exported && (exported.default || (exported.__esModule && exported.default));

          if (!ComponentToRender && typeof exported === "function") {
            ComponentToRender = exported;
          }

          if (!ComponentToRender && exported && typeof exported === "object") {
            var values = Object.values(exported);
            ComponentToRender = values.find(function(v) { return typeof v === "function"; });
          }

          if (!ComponentToRender) {
            showError("Could not find an exported React component. Make sure your component is exported (e.g. export function MyComponent() or export default).");
            return;
          }

          // 9. React Error Boundary to catch render/effect errors cleanly
          class SafeErrorBoundary extends React.Component {
            constructor(props) {
              super(props);
              this.state = { hasError: false, error: null };
            }
            static getDerivedStateFromError(error) {
              return { hasError: true, error: error };
            }
            componentDidCatch(error, errorInfo) {
              console.warn("Live Preview Warning:", error, errorInfo);
            }
            render() {
              if (this.state.hasError) {
                return React.createElement(
                  "div",
                  { className: "p-4 rounded-xl border border-rose-500/30 bg-rose-950/20 text-rose-300 text-xs font-mono max-w-md text-center space-y-2 shadow-2xl" },
                  React.createElement("div", { className: "font-semibold text-rose-200 flex items-center justify-center gap-1.5" },
                    React.createElement("span", { className: "w-2 h-2 rounded-full bg-rose-500 inline-block" }),
                    "Preview Notice"
                  ),
                  React.createElement("div", { className: "text-[11px] text-zinc-400 font-sans leading-relaxed" },
                    "Component encountered a notice during preview. Switch to Code tab to view full implementation."
                  ),
                  React.createElement("div", { className: "text-[10px] text-rose-400/90 bg-black/50 p-2 rounded border border-rose-900/40 break-words text-left" },
                    (this.state.error && this.state.error.message) || String(this.state.error)
                  )
                );
              }
              return this.props.children;
            }
          }

          // 10. Mount to DOM
          rootEl.innerHTML = "";
          var root = ReactDOM.createRoot(rootEl);
          root.render(
            React.createElement(
              SafeErrorBoundary,
              null,
              React.createElement(ComponentToRender)
            )
          );

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
            sandbox="allow-scripts allow-same-origin"
            className="w-full h-full min-h-[420px] border-0 bg-[#090a0b] rounded-xl"
          />
        </div>
      </div>
    </div>
  );
}

