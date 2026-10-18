"use client";

import React, { useState, useRef, useEffect } from "react";
import { Layers } from "lucide-react";

interface IsometricWorkspaceProps {
  className?: string;
}

export function IsometricWorkspace({ className = "" }: IsometricWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Smooth mouse tilt effect
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setMousePos({ x, y });
  };

  const handleMouseEnter = () => setIsHovered(true);
  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 });
  };

  // 3D rotation angles based on cursor offset
  const rotateX = isHovered ? -mousePos.y * 14 : 0;
  const rotateY = isHovered ? mousePos.x * 18 : 0;

  // Geometry constants for rounded isometric slabs
  // Slabs stack vertically: layer 0 (top) down to layer 4 (bottom)
  const cx = 190;
  const rx = 120;
  const ry = 68;
  const t = 0.14; // corner curve factor
  const h = 10; // slab vertical thickness

  // Base Y positions for 5 slabs
  // When hovered, the stack expands like an exploded architectural blueprint
  const baseSpacing = 22;
  const hoverSpacing = 32;
  const spacing = isHovered ? hoverSpacing : baseSpacing;

  // Base coordinates for the top face of a slab at (cx, cy)
  const getSlabPaths = (cy: number) => {
    const pTop = { x: cx, y: cy - ry };
    const pRight = { x: cx + rx, y: cy };
    const pBottom = { x: cx, y: cy + ry };
    const pLeft = { x: cx - rx, y: cy };

    // Curved corners
    const topCornerStart = { x: cx - rx * t, y: cy - ry * (1 - t) };
    const topCornerEnd = { x: cx + rx * t, y: cy - ry * (1 - t) };

    const rightCornerStart = { x: cx + rx * (1 - t), y: cy - ry * t };
    const rightCornerEnd = { x: cx + rx * (1 - t), y: cy + ry * t };

    const bottomCornerStart = { x: cx + rx * t, y: cy + ry * (1 - t) };
    const bottomCornerEnd = { x: cx - rx * t, y: cy + ry * (1 - t) };

    const leftCornerStart = { x: cx - rx * (1 - t), y: cy + ry * t };
    const leftCornerEnd = { x: cx - rx * (1 - t), y: cy - ry * t };

    // Top face path
    const topFace = `
      M ${topCornerStart.x} ${topCornerStart.y}
      Q ${pTop.x} ${pTop.y} ${topCornerEnd.x} ${topCornerEnd.y}
      L ${rightCornerStart.x} ${rightCornerStart.y}
      Q ${pRight.x} ${pRight.y} ${rightCornerEnd.x} ${rightCornerEnd.y}
      L ${bottomCornerStart.x} ${bottomCornerStart.y}
      Q ${pBottom.x} ${pBottom.y} ${bottomCornerEnd.x} ${bottomCornerEnd.y}
      L ${leftCornerStart.x} ${leftCornerStart.y}
      Q ${pLeft.x} ${pLeft.y} ${leftCornerEnd.x} ${leftCornerEnd.y}
      Z
    `;

    // Front-Left face
    const frontLeft = `
      M ${leftCornerEnd.x} ${leftCornerEnd.y}
      L ${leftCornerEnd.x} ${leftCornerEnd.y + h}
      L ${bottomCornerEnd.x} ${bottomCornerEnd.y + h}
      L ${bottomCornerEnd.x} ${bottomCornerEnd.y}
      Z
    `;

    // Front-Right face
    const frontRight = `
      M ${bottomCornerStart.x} ${bottomCornerStart.y}
      L ${bottomCornerStart.x} ${bottomCornerStart.y + h}
      L ${rightCornerEnd.x} ${rightCornerEnd.y + h}
      L ${rightCornerEnd.x} ${rightCornerEnd.y}
      Z
    `;

    // Front-Center rounded corner drop
    const frontCenter = `
      M ${bottomCornerEnd.x} ${bottomCornerEnd.y}
      Q ${pBottom.x} ${pBottom.y} ${bottomCornerStart.x} ${bottomCornerStart.y}
      L ${bottomCornerStart.x} ${bottomCornerStart.y + h}
      Q ${pBottom.x} ${pBottom.y + h} ${bottomCornerEnd.x} ${bottomCornerEnd.y + h}
      Z
    `;

    return { topFace, frontLeft, frontRight, frontCenter, pTop, pRight, pBottom, pLeft };
  };

  const layers = [0, 1, 2, 3, 4];
  const startY = 115;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full flex items-center justify-center select-none cursor-pointer group ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* Dynamic ambient purple glow behind the stack */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full blur-[80px] pointer-events-none transition-all duration-700"
        style={{
          background: isHovered
            ? "radial-gradient(circle, rgba(94, 106, 210, 0.28) 0%, rgba(94, 106, 210, 0.05) 70%, transparent 100%)"
            : "radial-gradient(circle, rgba(94, 106, 210, 0.16) 0%, rgba(94, 106, 210, 0.02) 70%, transparent 100%)",
          transform: `translate(-50%, -50%) translate3d(${mousePos.x * 20}px, ${mousePos.y * 20}px, 0)`,
        }}
      />

      <div
        className="relative transition-transform duration-300 ease-out"
        style={{
          transform: `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`,
          transformStyle: "preserve-3d",
        }}
      >
        <svg
          viewBox="0 0 380 340"
          className="w-[300px] h-[270px] xl:w-[340px] xl:h-[305px] overflow-visible"
        >
          <defs>
            {/* Top face gradient */}
            <linearGradient id="slab-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#18191c" />
              <stop offset="50%" stopColor="#121315" />
              <stop offset="100%" stopColor="#0b0c0d" />
            </linearGradient>

            {/* Top layer highlighted top face */}
            <linearGradient id="slab-top-hero" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1f2025" />
              <stop offset="50%" stopColor="#151619" />
              <stop offset="100%" stopColor="#0e0f11" />
            </linearGradient>

            {/* Front faces gradients for 3D depth */}
            <linearGradient id="slab-front-left" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0a0a0c" />
              <stop offset="100%" stopColor="#0f1012" />
            </linearGradient>

            <linearGradient id="slab-front-right" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#0f1012" />
              <stop offset="100%" stopColor="#070809" />
            </linearGradient>

            {/* Glowing stroke for top layer */}
            <linearGradient id="glow-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.8" />
              <stop offset="50%" stopColor="#8a8f98" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#23252a" stopOpacity="0.6" />
            </linearGradient>
          </defs>

          {/* ── Corner Projection Dashed Guidelines ── */}
          {/* Top-back, left, right, and bottom corner vertical dashed guidelines */}
          {(() => {
            const topPaths = getSlabPaths(startY);
            const bottomPaths = getSlabPaths(startY + (layers.length - 1) * spacing);
            return (
              <g className="transition-all duration-500 ease-out" opacity={isHovered ? 0.35 : 0.2}>
                {/* Back corner guide */}
                <line
                  x1={topPaths.pTop.x}
                  y1={topPaths.pTop.y}
                  x2={bottomPaths.pTop.x}
                  y2={bottomPaths.pTop.y + h}
                  stroke="#5e6ad2"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Left corner guide */}
                <line
                  x1={topPaths.pLeft.x}
                  y1={topPaths.pLeft.y}
                  x2={bottomPaths.pLeft.x}
                  y2={bottomPaths.pLeft.y + h}
                  stroke="#8a8f98"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Right corner guide */}
                <line
                  x1={topPaths.pRight.x}
                  y1={topPaths.pRight.y}
                  x2={bottomPaths.pRight.x}
                  y2={bottomPaths.pRight.y + h}
                  stroke="#8a8f98"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                {/* Front corner guide */}
                <line
                  x1={topPaths.pBottom.x}
                  y1={topPaths.pBottom.y}
                  x2={bottomPaths.pBottom.x}
                  y2={bottomPaths.pBottom.y + h}
                  stroke="#5e6ad2"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </g>
            );
          })()}

          {/* ── Slabs Rendered from Bottom to Top (4 to 0) ── */}
          {[...layers].reverse().map((layerIndex) => {
            const isHeroLayer = layerIndex === 0;
            const currentY = startY + layerIndex * spacing;
            const paths = getSlabPaths(currentY);

            // Autonomous floating oscillation offset:
            // Top layers oscillate with higher amplitude, creating a breathing harmonic wave
            const floatAmplitude = (4 - layerIndex) * 2.8;
            const animDuration = 4.5 + layerIndex * 0.4;
            const animDelay = layerIndex * 0.25;

            return (
              <g
                key={layerIndex}
                className="anim-iso-float transition-all duration-500 ease-out"
                style={{
                  animationDelay: `${animDelay}s`,
                  "--anim-dur": `${animDuration}s`,
                  "--float-amp": `${floatAmplitude}px`,
                } as React.CSSProperties}
              >
                {/* Front Left Thickness Face */}
                <path
                  d={paths.frontLeft}
                  fill="url(#slab-front-left)"
                  stroke="#23252a"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />

                {/* Front Right Thickness Face */}
                <path
                  d={paths.frontRight}
                  fill="url(#slab-front-right)"
                  stroke="#1c1d21"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />

                {/* Front Center Rounded Corner Thickness */}
                <path
                  d={paths.frontCenter}
                  fill="#0e0f11"
                  stroke="#282a30"
                  strokeWidth="0.8"
                />

                {/* Slab Top Face */}
                <path
                  d={paths.topFace}
                  fill={isHeroLayer ? "url(#slab-top-hero)" : "url(#slab-top)"}
                  stroke={isHeroLayer ? (isHovered ? "url(#glow-stroke)" : "#3a3d46") : "#26282e"}
                  strokeWidth={isHeroLayer ? "1.2" : "1"}
                  strokeLinejoin="round"
                  className="transition-colors duration-300"
                />

                {/* ── Top Hero Layer Details (Concentric Seal & Icon) ── */}
                {isHeroLayer && (
                  <g className="transition-all duration-300">
                    {/* Outer dashed isometric orbit */}
                    <ellipse
                      cx={cx}
                      cy={currentY}
                      rx="38"
                      ry="21"
                      fill="none"
                      stroke={isHovered ? "#5e6ad2" : "#343842"}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      className="transition-colors duration-300"
                    />

                    {/* Middle solid ring */}
                    <ellipse
                      cx={cx}
                      cy={currentY}
                      rx="27"
                      ry="15"
                      fill="#121316"
                      stroke={isHovered ? "#6e79d6" : "#2e313a"}
                      strokeWidth="1"
                      className="transition-colors duration-300"
                    />

                    {/* Inner glowing center */}
                    <ellipse
                      cx={cx}
                      cy={currentY}
                      rx="18"
                      ry="10"
                      fill="#1a1b22"
                      stroke="#5e6ad2"
                      strokeWidth="1.2"
                      strokeOpacity={isHovered ? "0.9" : "0.5"}
                    />

                    {/* Top Layer Icon (Layers) */}
                    <g transform={`translate(${cx - 7}, ${currentY - 7}) scale(0.65)`}>
                      <path
                        d="m12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83Z"
                        fill="none"
                        stroke="#f7f8f8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m22 17.65-9.17 4.16a2 2 0 0 1-1.66 0L2 17.65"
                        fill="none"
                        stroke="#5e6ad2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="m22 12.65-9.17 4.16a2 2 0 0 1-1.66 0L2 12.65"
                        fill="none"
                        stroke="#8a8f98"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </g>
                )}
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
}
