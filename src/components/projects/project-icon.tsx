"use client";

import React, { useState, useMemo, useEffect } from "react";
import { cn } from "@/lib/utils";

export interface ProjectIconProps {
  liveUrl?: string | null;
  repositoryUrl?: string | null;
  title?: string;
  size?: "sm" | "md" | "lg";
  tileRadius?: "sm" | "md";
  className?: string;
}

const SIZE_MAP = {
  sm: { tile: "w-[22px] h-[22px]", icon: 16, text: "text-[11px]" },
  md: { tile: "w-8 h-8", icon: 20, text: "text-xs" },
  lg: { tile: "w-10 h-10", icon: 24, text: "text-sm" },
};

export function ProjectIcon({
  liveUrl,
  repositoryUrl,
  title = "Project",
  size = "sm",
  tileRadius = "md",
  className,
}: ProjectIconProps) {
  const [candidateIndex, setCandidateIndex] = useState(0);

  // Extract hostname domain from liveUrl or repositoryUrl
  const resolvedDomain = useMemo(() => {
    const target = liveUrl || repositoryUrl;
    if (!target) return null;
    try {
      const formatted =
        target.startsWith("http://") || target.startsWith("https://")
          ? target
          : `https://${target}`;
      return new URL(formatted).hostname.replace(/^www\./, "");
    } catch {
      return null;
    }
  }, [liveUrl, repositoryUrl]);

  // Build candidate favicons: Google S2 (sz=64 for crisp retina display) + DuckDuckGo
  const candidates = useMemo(() => {
    if (!resolvedDomain) return [];
    return [
      `https://www.google.com/s2/favicons?domain=${encodeURIComponent(resolvedDomain)}&sz=64`,
      `https://icons.duckduckgo.com/ip3/${resolvedDomain}.ico`,
    ];
  }, [resolvedDomain]);

  useEffect(() => {
    setCandidateIndex(0);
  }, [liveUrl, repositoryUrl, resolvedDomain]);

  const handleImageError = () => {
    setCandidateIndex((prev) => prev + 1);
  };

  const isExhausted = candidateIndex >= candidates.length;
  const initialLetter = (title.trim()[0] || "P").toUpperCase();
  const sizeConfig = SIZE_MAP[size] || SIZE_MAP.sm;
  const radiusClass = tileRadius === "sm" ? "rounded-[4px]" : "rounded-[6px]";

  // Fallback: Crisp Monogram on surface-2 tile
  if (isExhausted || !resolvedDomain) {
    return (
      <div
        className={cn(
          sizeConfig.tile,
          radiusClass,
          "bg-surface-2 border border-line flex items-center justify-center font-mono font-semibold text-text-primary select-none shrink-0",
          sizeConfig.text,
          className
        )}
        aria-hidden="true"
        title={title}
      >
        <span>{initialLetter}</span>
      </div>
    );
  }

  const currentSrc = candidates[candidateIndex];

  return (
    <div
      className={cn(
        sizeConfig.tile,
        radiusClass,
        "bg-zinc-200 border border-black/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] flex items-center justify-center shrink-0 overflow-hidden select-none",
        className
      )}
      aria-hidden="true"
      title={title}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        key={currentSrc}
        src={currentSrc}
        alt=""
        width={sizeConfig.icon}
        height={sizeConfig.icon}
        onError={handleImageError}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="object-contain"
        style={{
          width: `${sizeConfig.icon}px`,
          height: `${sizeConfig.icon}px`,
          maxWidth: `${sizeConfig.icon}px`,
          maxHeight: `${sizeConfig.icon}px`,
        }}
      />
    </div>
  );
}
