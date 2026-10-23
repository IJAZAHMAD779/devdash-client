"use client";

import { useState } from "react";
import { Globe, Bookmark as BookmarkIcon, Github } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkFaviconProps {
  domain: string;
  url?: string;
  size?: number;
  className?: string;
}

export function BookmarkFavicon({
  domain,
  url,
  size = 16,
  className,
}: BookmarkFaviconProps) {
  const [hasError, setHasError] = useState(false);

  // If it's a known service, render a crisp vector SVG icon directly
  const isGithub = domain.includes("github.com") || (url && url.includes("github.com"));

  if (isGithub) {
    return (
      <span
        className={cn("inline-flex items-center justify-center shrink-0 text-ink select-none", className)}
        style={{ width: size, height: size }}
      >
        <Github style={{ width: size, height: size }} />
      </span>
    );
  }

  // If no domain or image failed to load, render crisp vector Globe icon with zero background
  if (!domain || hasError) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 text-ink-tertiary select-none",
          className
        )}
        style={{ width: size, height: size }}
        title={domain || "Bookmark"}
      >
        <Globe
          style={{ width: size, height: size }}
          strokeWidth={1.5}
        />
      </span>
    );
  }

  const s2Size = size >= 32 ? 64 : 32;
  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    domain
  )}&sz=${s2Size}`;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 overflow-hidden bg-transparent select-none",
        className
      )}
      style={{ width: size, height: size }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUrl}
        alt=""
        width={size}
        height={size}
        onError={() => setHasError(true)}
        className="w-full h-full object-contain bg-transparent"
        loading="lazy"
        referrerPolicy="no-referrer"
      />
    </span>
  );
}
