"use client";

import { useState, useMemo } from "react";
import { Terminal, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFaviconProps {
  liveUrl?: string | null;
  repositoryUrl?: string | null;
  domain?: string | null;
  title?: string;
  size?: number;
  className?: string;
}

export function ProjectFavicon({
  liveUrl,
  repositoryUrl,
  domain: directDomain,
  title,
  size = 20,
  className,
}: ProjectFaviconProps) {
  const [hasError, setHasError] = useState(false);

  // Safely extract domain from URLs
  const resolvedDomain = useMemo(() => {
    if (directDomain && directDomain.trim()) return directDomain.trim();

    const targetUrl = liveUrl || repositoryUrl;
    if (!targetUrl) return null;

    try {
      const parsed = new URL(
        targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
          ? targetUrl
          : `https://${targetUrl}`
      );
      return parsed.hostname;
    } catch {
      return null;
    }
  }, [liveUrl, repositoryUrl, directDomain]);

  // If error occurred or no domain could be resolved, render fallback icon
  if (hasError || !resolvedDomain) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-md bg-surface-2 border border-hairline text-ink-subtle shrink-0",
          className
        )}
        style={{ width: size, height: size }}
        title={title || resolvedDomain || "Project"}
      >
        {repositoryUrl && !liveUrl ? (
          <Terminal style={{ width: Math.max(10, size * 0.55), height: Math.max(10, size * 0.55) }} />
        ) : (
          <Globe style={{ width: Math.max(10, size * 0.55), height: Math.max(10, size * 0.55) }} />
        )}
      </div>
    );
  }

  // Google S2 Favicon API endpoint
  const s2Size = size >= 32 ? 64 : 32;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(resolvedDomain)}&sz=${s2Size}`;

  return (
    <div
      className={cn(
        "relative rounded-md overflow-hidden bg-surface-2 border border-hairline flex items-center justify-center shrink-0",
        className
      )}
      style={{ width: size, height: size }}
      title={resolvedDomain}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUrl}
        alt={`${resolvedDomain} favicon`}
        width={size}
        height={size}
        onError={() => setHasError(true)}
        className="object-contain w-full h-full p-0.5 select-none"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
