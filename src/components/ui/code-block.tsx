"use client";

import { useState, useEffect, useMemo } from "react";
import { Copy, Check, Eye, EyeOff } from "lucide-react";
import { codeToHtml } from "shiki";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";
import { toast } from "@/lib/toast";

interface Props {
  code: string;
  language: string;
  filename?: string;
  className?: string;
  enableSecretMasking?: boolean;
}

// Regex to detect sensitive keys in .env, configs, or connection strings
const SECRET_REGEX =
  /(KEY|SECRET|PASSWORD|TOKEN|PASS|API_KEY|AUTH|JWT|PRIVATE_KEY|DATABASE_URL|DIRECT_URL)=([^\s\r\n]+)/gi;

export function CodeBlock({
  code,
  language,
  filename,
  className,
  enableSecretMasking = true,
}: Props) {
  const [copied, setCopied] = useState(false);
  const [isMasked, setIsMasked] = useState(false);
  const [highlightedHtml, setHighlightedHtml] = useState<string | null>(null);

  // Detect if code contains sensitive patterns
  const hasSecrets = useMemo(() => {
    return (
      language.toLowerCase() === "env" ||
      language.toLowerCase() === "bash" ||
      SECRET_REGEX.test(code)
    );
  }, [code, language]);

  // Code to display based on masking state
  const displayCode = useMemo(() => {
    if (!isMasked) return code;
    return code.replace(
      SECRET_REGEX,
      (_match, key) => `${key}=••••••••••••••••`
    );
  }, [code, isMasked]);

  // Run Shiki syntax highlighting
  useEffect(() => {
    let isCancelled = false;

    async function highlight() {
      try {
        const langToUse = [
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
        ].includes(language.toLowerCase())
          ? language.toLowerCase()
          : "typescript";

        const html = await codeToHtml(displayCode, {
          lang: langToUse,
          theme: "vitesse-dark",
        });

        if (!isCancelled) {
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
  }, [displayCode, language]);

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      // Copy real unmasked code to clipboard
      await navigator.clipboard.writeText(code);
      sound.playSuccess();
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: filename ? `Snippet from ${filename} copied.` : `${language.toUpperCase()} code copied.`,
      });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      sound.playClick(400);
      toast.error("Failed to copy code to clipboard");
    }
  };

  const handleToggleMask = (e: React.MouseEvent) => {
    e.stopPropagation();
    sound.playClick(isMasked ? 900 : 600);
    setIsMasked(!isMasked);
  };

  return (
    <div
      className={cn(
        "relative rounded-lg bg-surface-1 border border-hairline overflow-hidden font-mono text-xs",
        className
      )}
    >
      {/* Header Bar */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-surface-2/80 border-b border-hairline select-none">
        <div className="flex items-center gap-2 text-ink-muted">
          <span className="text-[11px] font-mono uppercase tracking-wider text-primary font-semibold">
            {filename || language}
          </span>
          {hasSecrets && (
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/10 border border-amber-500/20 text-amber-300">
              Secrets Detected
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Secret Masking Button (ADR 009) */}
          {enableSecretMasking && hasSecrets && (
            <button
              type="button"
              onClick={handleToggleMask}
              title={isMasked ? "Reveal secrets" : "Mask sensitive secrets"}
              className="inline-flex items-center gap-1 px-2 py-1 rounded hover:bg-surface-3 text-ink-subtle hover:text-ink transition-colors text-[11px]"
            >
              {isMasked ? (
                <>
                  <Eye className="w-3 h-3 text-primary" />
                  <span>Unmask</span>
                </>
              ) : (
                <>
                  <EyeOff className="w-3 h-3" />
                  <span>Mask</span>
                </>
              )}
            </button>
          )}

          {/* 1-Click Clipboard Copy with Icon Swap Transition (09-icon-swap.md) */}
          <button
            type="button"
            onClick={handleCopy}
            title={copied ? "Copied to clipboard!" : "Copy code"}
            className="inline-flex items-center gap-1.5 px-2 py-1 rounded bg-surface-3 hover:bg-surface-4 border border-hairline text-ink-muted hover:text-ink transition-colors text-[11px]"
          >
            <div
              className="t-icon-swap w-3.5 h-3.5"
              data-state={copied ? "b" : "a"}
            >
              <span className="t-icon" data-icon="a">
                <Copy className="w-3.5 h-3.5" />
              </span>
              <span className="t-icon" data-icon="b">
                <Check className="w-3.5 h-3.5 text-semantic-success" />
              </span>
            </div>
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code Area */}
      <div className="p-4 overflow-x-auto max-h-96 text-ink leading-relaxed">
        {highlightedHtml ? (
          <div
            className="[&>pre]:!bg-transparent [&>pre]:!m-0 [&>pre]:!p-0 [&_code]:font-mono text-xs"
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        ) : (
          <pre className="font-mono text-xs text-ink-muted whitespace-pre">
            <code>{displayCode}</code>
          </pre>
        )}
      </div>
    </div>
  );
}
