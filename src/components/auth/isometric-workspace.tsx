"use client";

import React, { useState, useRef } from "react";

interface IsometricWorkspaceProps {
  className?: string;
}

export function IsometricWorkspace({ className = "" }: IsometricWorkspaceProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  // Smooth mouse tilt tracking
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

  // Parallax 3D tilt angles
  const rotateX = isHovered ? -mousePos.y * 12 : 0;
  const rotateY = isHovered ? mousePos.x * 16 : 0;

  // ── True Isometric Cube Geometry ──
  // A cube in isometric projection has a 1:1 bounding silhouette
  const cx = 190;
  const rx = 105;
  const ry = 60.6; // exact 30° isometric angle (105 * tan(30°))
  const t = 0.08; // subtle rounded corner factor
  const layerH = 20; // thick solid cube slice

  // Base Y position for the cube stack
  const baseY = 110;

  // Slices configuration: 5 slices total (forming a complete cube)
  // When idle: Slice 0 (top block) floats elevated like in the reference image
  // When hovered: The entire cube explodes/expands vertically
  const getSliceY = (index: number) => {
    if (index === 0) {
      // Top slice is lifted above the rest of the cube
      return isHovered ? baseY - 38 : baseY - 22;
    }
    const stackBase = baseY + 8;
    const spacing = isHovered ? 28 : layerH + 2;
    return stackBase + (index - 1) * spacing;
  };

  // Helper to generate coordinates for a slice at vertical center cy
  const getSlicePaths = (cy: number) => {
    const pTop = { x: cx, y: cy - ry };
    const pRight = { x: cx + rx, y: cy };
    const pBottom = { x: cx, y: cy + ry };
    const pLeft = { x: cx - rx, y: cy };

    // Rounded corners
    const topCornerStart = { x: cx - rx * t, y: cy - ry * (1 - t) };
    const topCornerEnd = { x: cx + rx * t, y: cy - ry * (1 - t) };

    const rightCornerStart = { x: cx + rx * (1 - t), y: cy - ry * t };
    const rightCornerEnd = { x: cx + rx * (1 - t), y: cy + ry * t };

    const bottomCornerStart = { x: cx + rx * t, y: cy + ry * (1 - t) };
    const bottomCornerEnd = { x: cx - rx * t, y: cy + ry * (1 - t) };

    const leftCornerStart = { x: cx - rx * (1 - t), y: cy + ry * t };
    const leftCornerEnd = { x: cx - rx * (1 - t), y: cy - ry * t };

    // Top face
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

    // Left wall face (thickness)
    const leftFace = `
      M ${leftCornerEnd.x} ${leftCornerEnd.y}
      L ${leftCornerEnd.x} ${leftCornerEnd.y + layerH}
      L ${bottomCornerEnd.x} ${bottomCornerEnd.y + layerH}
      L ${bottomCornerEnd.x} ${bottomCornerEnd.y}
      Z
    `;

    // Right wall face (thickness)
    const rightFace = `
      M ${bottomCornerStart.x} ${bottomCornerStart.y}
      L ${bottomCornerStart.x} ${bottomCornerStart.y + layerH}
      L ${rightCornerEnd.x} ${rightCornerEnd.y + layerH}
      L ${rightCornerEnd.x} ${rightCornerEnd.y}
      Z
    `;

    // Center vertical ridge rounded corner
    const centerRidge = `
      M ${bottomCornerEnd.x} ${bottomCornerEnd.y}
      Q ${pBottom.x} ${pBottom.y} ${bottomCornerStart.x} ${bottomCornerStart.y}
      L ${bottomCornerStart.x} ${bottomCornerStart.y + layerH}
      Q ${pBottom.x} ${pBottom.y + layerH} ${bottomCornerEnd.x} ${bottomCornerEnd.y + layerH}
      Z
    `;

    return {
      topFace,
      leftFace,
      rightFace,
      centerRidge,
      pTop,
      pRight,
      pBottom,
      pLeft,
    };
  };

  const slices = [0, 1, 2, 3, 4];
  const topSliceY = getSliceY(0);
  const secondSliceY = getSliceY(1);
  const bottomSliceY = getSliceY(4);

  const topPaths = getSlicePaths(topSliceY);
  const secondPaths = getSlicePaths(secondSliceY);
  const bottomPaths = getSlicePaths(bottomSliceY);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full flex items-center justify-center select-none cursor-pointer group ${className}`}
      style={{ perspective: "1000px" }}
    >
      {/* Dynamic ambient violet-blue glow behind the cube */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[280px] h-[280px] rounded-full blur-[80px] pointer-events-none transition-all duration-700"
        style={{
          background: isHovered
            ? "radial-gradient(circle, rgba(94, 106, 210, 0.28) 0%, rgba(94, 106, 210, 0.05) 70%, transparent 100%)"
            : "radial-gradient(circle, rgba(94, 106, 210, 0.14) 0%, rgba(94, 106, 210, 0.02) 70%, transparent 100%)",
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
          className="w-[310px] h-[280px] xl:w-[350px] xl:h-[315px] overflow-visible"
        >
          <defs>
            {/* Top face gradient */}
            <linearGradient id="cube-top" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#1a1b1f" />
              <stop offset="50%" stopColor="#131417" />
              <stop offset="100%" stopColor="#0c0d0f" />
            </linearGradient>

            {/* Top elevated block highlight */}
            <linearGradient id="cube-top-hero" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22232a" />
              <stop offset="50%" stopColor="#17181d" />
              <stop offset="100%" stopColor="#0f1013" />
            </linearGradient>

            {/* Cube Left Wall (Shadow face) */}
            <linearGradient id="cube-left-wall" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#090a0c" />
              <stop offset="100%" stopColor="#0e0f12" />
            </linearGradient>

            {/* Cube Right Wall (Lit face) */}
            <linearGradient id="cube-right-wall" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#141518" />
              <stop offset="100%" stopColor="#0a0b0d" />
            </linearGradient>

            {/* Glowing stroke for active state */}
            <linearGradient id="cube-glow-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#5e6ad2" stopOpacity="0.9" />
              <stop offset="50%" stopColor="#8a8f98" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#343842" stopOpacity="0.7" />
            </linearGradient>
          </defs>

          {/* ── Dashed Projection Guide Lines (Matching Reference Image) ── */}
          {/* Vertical dashed lines connecting the lifted top slice to the cube below */}
          <g className="transition-all duration-500 ease-out" opacity={isHovered ? 0.45 : 0.28}>
            {/* Back corner guide line */}
            <line
              x1={topPaths.pTop.x}
              y1={topPaths.pTop.y}
              x2={secondPaths.pTop.x}
              y2={secondPaths.pTop.y}
              stroke="#5e6ad2"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            {/* Left corner guide line */}
            <line
              x1={topPaths.pLeft.x}
              y1={topPaths.pLeft.y}
              x2={secondPaths.pLeft.x}
              y2={secondPaths.pLeft.y}
              stroke="#8a8f98"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            {/* Right corner guide line */}
            <line
              x1={topPaths.pRight.x}
              y1={topPaths.pRight.y}
              x2={secondPaths.pRight.x}
              y2={secondPaths.pRight.y}
              stroke="#8a8f98"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />
            {/* Front center ridge guide line */}
            <line
              x1={topPaths.pBottom.x}
              y1={topPaths.pBottom.y + layerH}
              x2={secondPaths.pBottom.x}
              y2={secondPaths.pBottom.y}
              stroke="#5e6ad2"
              strokeWidth="1.2"
              strokeDasharray="3 3"
            />

            {/* Outer bounding cube vertical dashed lines when hovered */}
            {isHovered && (
              <>
                <line
                  x1={secondPaths.pLeft.x}
                  y1={secondPaths.pLeft.y + layerH}
                  x2={bottomPaths.pLeft.x}
                  y2={bottomPaths.pLeft.y + layerH}
                  stroke="#5e6ad2"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1={secondPaths.pRight.x}
                  y1={secondPaths.pRight.y + layerH}
                  x2={bottomPaths.pRight.x}
                  y2={bottomPaths.pRight.y + layerH}
                  stroke="#5e6ad2"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
              </>
            )}
          </g>

          {/* ── Cube Slices Rendered from Bottom to Top (4 down to 0) ── */}
          {[...slices].reverse().map((sliceIndex) => {
            const isHero = sliceIndex === 0;
            const currentY = getSliceY(sliceIndex);
            const paths = getSlicePaths(currentY);

            // Autonomous floating breathing motion:
            // Top slice floats up and down continuously
            const floatAmplitude = isHero ? 7 : (4 - sliceIndex) * 1.5;
            const animDuration = 3.6 + sliceIndex * 0.3;
            const animDelay = sliceIndex * 0.2;

            return (
              <g
                key={sliceIndex}
                className="anim-iso-float transition-all duration-500 ease-out"
                style={{
                  animationDelay: `${animDelay}s`,
                  "--anim-dur": `${animDuration}s`,
                  "--float-amp": `${floatAmplitude}px`,
                } as React.CSSProperties}
              >
                {/* Cube Left Wall Slice */}
                <path
                  d={paths.leftFace}
                  fill="url(#cube-left-wall)"
                  stroke="#23252a"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />

                {/* Cube Right Wall Slice */}
                <path
                  d={paths.rightFace}
                  fill="url(#cube-right-wall)"
                  stroke="#1c1d21"
                  strokeWidth="1"
                  strokeLinejoin="round"
                />

                {/* Center Vertical Ridge */}
                <path
                  d={paths.centerRidge}
                  fill="#101114"
                  stroke="#282a30"
                  strokeWidth="0.8"
                />

                {/* Cube Slice Top Face */}
                <path
                  d={paths.topFace}
                  fill={isHero ? "url(#cube-top-hero)" : "url(#cube-top)"}
                  stroke={isHero ? (isHovered ? "url(#cube-glow-stroke)" : "#3a3d46") : "#282a30"}
                  strokeWidth={isHero ? "1.3" : "1"}
                  strokeLinejoin="round"
                  className="transition-colors duration-300"
                />

                {/* ── Top Hero Layer Details (Concentric Seal & Document/Layers Icon) ── */}
                {isHero && (
                  <g className="transition-all duration-300">
                    {/* Outer isometric circular orbit */}
                    <ellipse
                      cx={cx}
                      cy={currentY}
                      rx="36"
                      ry="20.8"
                      fill="none"
                      stroke={isHovered ? "#5e6ad2" : "#32353e"}
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      className="transition-colors duration-300"
                    />

                    {/* Middle solid ring */}
                    <ellipse
                      cx={cx}
                      cy={currentY}
                      rx="26"
                      ry="15"
                      fill="#121316"
                      stroke={isHovered ? "#6e79d6" : "#282a32"}
                      strokeWidth="1"
                      className="transition-colors duration-300"
                    />

                    {/* Inner glowing core */}
                    <ellipse
                      cx={cx}
                      cy={currentY}
                      rx="17"
                      ry="9.8"
                      fill="#1a1b22"
                      stroke="#5e6ad2"
                      strokeWidth="1.2"
                      strokeOpacity={isHovered ? "0.9" : "0.5"}
                    />

                    {/* Embossed Icon in center (Matching Document / Layers Icon in Reference) */}
                    <g transform={`translate(${cx - 7}, ${currentY - 7}) scale(0.65)`}>
                      <path
                        d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                        fill="none"
                        stroke="#f7f8f8"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M14 2v6h6"
                        fill="none"
                        stroke="#5e6ad2"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <path
                        d="M16 13H8"
                        fill="none"
                        stroke="#8a8f98"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M16 17H8"
                        fill="none"
                        stroke="#8a8f98"
                        strokeWidth="2"
                        strokeLinecap="round"
                      />
                      <path
                        d="M10 9H8"
                        fill="none"
                        stroke="#8a8f98"
                        strokeWidth="2"
                        strokeLinecap="round"
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
