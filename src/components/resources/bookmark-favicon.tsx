"use client";

import React, { useState } from "react";
import { Github } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookmarkFaviconProps {
  domain: string;
  url?: string;
  size?: number; // Size of the icon itself (e.g. 16 or 20)
  tileSize?: number; // Outer tile size (e.g. 22 or 28)
  variant?: "card" | "row";
  className?: string;
}

export function BookmarkFavicon({
  domain,
  url,
  size = 16,
  tileSize,
  variant = "card",
  className,
}: BookmarkFaviconProps) {
  const [hasError, setHasError] = useState(false);
  const [isGenericFallback, setIsGenericFallback] = useState(false);

  // Clean domain and get monogram letter
  const cleanDomain = (domain || "").replace(/^www\./i, "").trim();
  const monogramLetter = cleanDomain.charAt(0).toUpperCase() || "#";

  // Actual outer tile dimensions
  const outerSize = tileSize ?? (variant === "card" ? 28 : 22);
  const iconSize = size ?? (variant === "card" ? 18 : 14);
  const radiusClass = variant === "card" ? "rounded-[6px]" : "rounded-[4px]";

  // Known services: GitHub
  const isGithub =
    cleanDomain.includes("github.com") || (url && url.includes("github.com"));

  if (isGithub) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 bg-surface-2 border border-hairline text-ink select-none",
          radiusClass,
          className
        )}
        style={{ width: outerSize, height: outerSize }}
        title={cleanDomain || "GitHub"}
      >
        <Github style={{ width: iconSize, height: iconSize }} />
      </span>
    );
  }

  // Fallback to monogram if domain missing, load error, or S2 generic globe (naturalWidth <= 16)
  if (!cleanDomain || hasError || isGenericFallback) {
    return (
      <span
        className={cn(
          "inline-flex items-center justify-center shrink-0 bg-surface-2 border border-hairline text-ink font-mono font-semibold select-none",
          radiusClass,
          className
        )}
        style={{
          width: outerSize,
          height: outerSize,
          fontSize: Math.max(10, Math.floor(outerSize * 0.45)),
        }}
        title={cleanDomain || "Bookmark"}
      >
        {monogramLetter}
      </span>
    );
  }

  const faviconUrl = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(
    cleanDomain
  )}&sz=64`;

  return (
    <span
      className={cn(
        "inline-flex items-center justify-center shrink-0 overflow-hidden bg-zinc-200 border border-black/10 select-none shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]",
        radiusClass,
        className
      )}
      style={{ width: outerSize, height: outerSize }}
      title={cleanDomain}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={faviconUrl}
        alt=""
        width={iconSize}
        height={iconSize}
        onLoad={(e) => {
          const img = e.currentTarget;
          // Google S2 returns a 16x16 generic globe image when domain has no favicon
          if (img.naturalWidth <= 16 && img.naturalHeight <= 16) {
            setIsGenericFallback(true);
          }
        }}
        onError={() => setHasError(true)}
        className="object-contain"
        style={{ width: iconSize, height: iconSize }}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
      />
    </span>
  );
}
