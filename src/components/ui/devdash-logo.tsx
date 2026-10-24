import React from "react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface DevDashLogoProps {
  size?: number;
  className?: string;
  href?: string;
}

export function DevDashLogo({
  size = 32,
  className = "",
  href = "/projects",
}: DevDashLogoProps) {
  const content = (
    <div
      className={cn(
        "inline-flex items-center justify-center relative select-none transition-transform duration-200 ease-out group-hover:scale-105 active:scale-95",
        className
      )}
      style={{ width: size, height: size }}
      title="DevDash"
      aria-label="DevDash"
    >
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="w-full h-full overflow-visible transition-all duration-200"
      >
        <defs>
          {/* Top slab radiant royal gradient */}
          <linearGradient id="logo-top-grad" x1="5" y1="2.5" x2="27" y2="15.5" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#60a5fa" />
            <stop offset="50%" stopColor="#3b82f6" />
            <stop offset="100%" stopColor="#2563eb" />
          </linearGradient>

          {/* Core glowing bracket gradient */}
          <linearGradient id="logo-core-grad" x1="7" y1="16" x2="25" y2="21" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="100%" stopColor="#3b82f6" />
          </linearGradient>

          {/* Base slab gradient */}
          <linearGradient id="logo-base-grad" x1="5" y1="21" x2="27" y2="30" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#2563eb" />
            <stop offset="100%" stopColor="#1d4ed8" />
          </linearGradient>
        </defs>

        {/* 1. Floating Top Isometric Cap */}
        <g>
          {/* Top Rhombus Face */}
          <path
            d="M 16 2.5 L 27 8.5 L 16 14.5 L 5 8.5 Z"
            fill="url(#logo-top-grad)"
            stroke="#93c5fd"
            strokeWidth="0.75"
            strokeLinejoin="round"
          />
          {/* Left Facet */}
          <path
            d="M 5 8.5 L 16 14.5 L 16 17 L 5 11 Z"
            fill="#1d4ed8"
          />
          {/* Right Facet */}
          <path
            d="M 27 8.5 L 16 14.5 L 16 17 L 27 11 Z"
            fill="#2563eb"
          />
        </g>

        {/* 2. Middle Layer: Integrated Developer Code Chevrons & Core Prism */}
        <path
          d="M 6 13 L 13 17 L 13 19.5 L 6 15.5 Z"
          fill="url(#logo-core-grad)"
          stroke="#bfdbfe"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M 26 13 L 19 17 L 19 19.5 L 26 15.5 Z"
          fill="url(#logo-core-grad)"
          stroke="#bfdbfe"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M 16 15 L 20 17.5 L 16 20 L 12 17.5 Z"
          fill="#0f172a"
          stroke="#60a5fa"
          strokeWidth="0.75"
          strokeLinejoin="round"
        />

        {/* 3. Bottom Isometric Foundation Base Slab */}
        <path
          d="M 5 21 L 16 17.5 L 27 21 L 16 24.5 Z"
          fill="#1e3a8a"
          opacity="0.8"
        />
        <path
          d="M 5 21 L 16 25 L 16 28.5 L 5 24.5 Z"
          fill="#1e40af"
          stroke="#3b82f6"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
        <path
          d="M 27 21 L 16 25 L 16 28.5 L 27 24.5 Z"
          fill="url(#logo-base-grad)"
          stroke="#60a5fa"
          strokeWidth="0.5"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="group inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 rounded-md"
        aria-label="DevDash Home"
      >
        {content}
      </Link>
    );
  }

  return content;
}
