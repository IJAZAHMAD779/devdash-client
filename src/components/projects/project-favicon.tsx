"use client";

import { useState, useMemo, useEffect } from "react";
import { Terminal, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

interface ProjectFaviconProps {
  src?: string | null;
  liveUrl?: string | null;
  repositoryUrl?: string | null;
  domain?: string | null;
  title?: string;
  size?: number;
  className?: string;
}

export function ProjectFavicon({
  src,
  liveUrl,
  repositoryUrl,
  domain: directDomain,
  title,
  size = 20,
  className,
}: ProjectFaviconProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);

  // Safely extract origin and domain from URLs
  const { resolvedOrigin, resolvedDomain } = useMemo(() => {
    let domain = directDomain?.trim() || null;
    let origin: string | null = null;

    const targetUrl = liveUrl || repositoryUrl;
    if (targetUrl) {
      try {
        const formatted =
          targetUrl.startsWith("http://") || targetUrl.startsWith("https://")
            ? targetUrl
            : `https://${targetUrl}`;
        const parsed = new URL(formatted);
        origin = parsed.origin;
        if (!domain) {
          domain = parsed.hostname;
        }
      } catch {
        // fallback
      }
    }

    return { resolvedOrigin: origin, resolvedDomain: domain };
  }, [liveUrl, repositoryUrl, directDomain]);

  // Build an ordered multi-tier candidate list:
  // 1. Direct src (from backend preview/scrape)
  // 2. Direct origin Next.js vector icon (/icon.svg)
  // 3. Direct origin standard favicon (/favicon.ico, /favicon.svg)
  // 4. DuckDuckGo icon service (returns high quality 32x32 favicons)
  // 5. Google S2 Favicon API
  const candidates = useMemo(() => {
    const list: string[] = [];

    if (src && src.trim()) {
      list.push(src.trim());
    }

    if (resolvedOrigin) {
      list.push(`${resolvedOrigin}/icon.svg`);
      list.push(`${resolvedOrigin}/favicon.svg`);
      list.push(`${resolvedOrigin}/favicon.ico`);
    }

    if (resolvedDomain) {
      // DuckDuckGo high-resolution icon
      list.push(`https://icons.duckduckgo.com/ip3/${resolvedDomain}.ico`);
      // Google S2 API
      const s2Size = size >= 32 ? 64 : 32;
      list.push(
        `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
          resolvedDomain
        )}&sz=${s2Size}`
      );
    }

    // Deduplicate
    return Array.from(new Set(list));
  }, [src, resolvedOrigin, resolvedDomain, size]);

  // Reset candidate index when inputs change
  useEffect(() => {
    setCandidateIndex(0);
  }, [src, liveUrl, repositoryUrl, directDomain]);

  const handleImageError = () => {
    setCandidateIndex((prev) => prev + 1);
  };

  const isExhausted = candidateIndex >= candidates.length;

  // Fallback SVG icon when all candidates fail or no domain exists
  if (isExhausted || !resolvedDomain) {
    return (
      <div
        className={cn(
          "flex items-center justify-center text-ink-subtle shrink-0",
          className
        )}
        style={{ width: size, height: size }}
        title={title || resolvedDomain || "Project"}
      >
        {repositoryUrl && !liveUrl ? (
          <Terminal
            style={{
              width: Math.max(12, size * 0.75),
              height: Math.max(12, size * 0.75),
            }}
          />
        ) : (
          <Globe
            style={{
              width: Math.max(12, size * 0.75),
              height: Math.max(12, size * 0.75),
            }}
          />
        )}
      </div>
    );
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <div
      className={cn(
        "relative flex items-center justify-center shrink-0",
        className
      )}
      style={{ width: size, height: size }}
      title={title || resolvedDomain}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={currentSrc}
        src={currentSrc}
        alt={`${resolvedDomain} favicon`}
        width={size}
        height={size}
        onError={handleImageError}
        className="object-contain w-full h-full select-none"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </div>
  );
}
