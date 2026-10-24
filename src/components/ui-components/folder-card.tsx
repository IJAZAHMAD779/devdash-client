"use client";

import { sound } from "@/lib/audio";
import { SchematicWireframe } from "./schematic-wireframe";

interface FolderCardProps {
  name: string;
  count: number;
  description?: string;
  onClick: () => void;
}

export function FolderCard({ name, count, description, onClick }: FolderCardProps) {
  const handleClick = () => {
    sound.playClick(850);
    onClick();
  };

  return (
    <div
      onClick={handleClick}
      className="group relative flex flex-col p-4 rounded-2xl bg-surface-1 border border-hairline hover:border-hairline-strong hover:bg-surface-2/40 transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md hover:-translate-y-0.5 select-none"
    >
      {/* Schematic Wireframe Viewport (clean minimal frame, no 3 colored dots) */}
      <div className="w-full h-44 rounded-xl bg-[#090a0b] border border-hairline/60 flex items-center justify-center p-2 relative overflow-hidden group-hover:border-primary/40 transition-colors">
        <SchematicWireframe category={name} name={name} />
      </div>

      {/* Card Footer Text matching Image 1 */}
      <div className="mt-3 px-1">
        <h3 className="text-sm font-semibold tracking-[-0.2px] text-ink group-hover:text-primary transition-colors capitalize truncate">
          {name}
        </h3>
        <p className="text-xs text-ink-muted mt-0.5 tracking-tight font-normal">
          {count} {count === 1 ? "component" : "components"}
        </p>
      </div>
    </div>
  );
}
