"use client";

import React, { useState, useRef, useEffect } from "react";
import { MoreHorizontal, Edit2, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ConfirmModal } from "@/components/ui/confirm-modal";

export interface ProjectActionsMenuProps {
  onEdit?: () => void;
  onDelete?: () => void;
  projectTitle: string;
  className?: string;
  triggerClassName?: string;
}

export function ProjectActionsMenu({
  onEdit,
  onDelete,
  projectTitle,
  className,
  triggerClassName,
}: ProjectActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleOutsideClick);
    }
    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [isOpen]);

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    onEdit?.();
  };

  const handleDeleteTrigger = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsOpen(false);
    setShowConfirm(true);
  };

  const handleConfirmDelete = () => {
    setShowConfirm(false);
    onDelete?.();
  };

  return (
    <div className={cn("relative inline-block text-left", className)} ref={menuRef}>
      <button
        type="button"
        aria-label={`Actions for ${projectTitle}`}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((prev) => !prev);
        }}
        className={cn(
          "w-7 h-7 rounded-[6px] hover:bg-surface-2 text-muted hover:text-text-primary transition-colors flex items-center justify-center cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent",
          triggerClassName
        )}
      >
        <MoreHorizontal className="w-4 h-4 stroke-[1.5]" />
      </button>

      {isOpen && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 w-36 rounded-[8px] bg-surface-1 border border-line shadow-xl py-1 z-50 text-xs font-mono animate-in fade-in zoom-in-95 duration-100"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              type="button"
              role="menuitem"
              onClick={handleEditClick}
              className="w-full px-3 py-1.5 text-left text-muted hover:text-text-primary hover:bg-surface-2 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Edit2 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Edit</span>
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              role="menuitem"
              onClick={handleDeleteTrigger}
              className="w-full px-3 py-1.5 text-left text-danger hover:bg-surface-2 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Delete</span>
            </button>
          )}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleConfirmDelete}
        title={`Delete "${projectTitle}"?`}
        description="This action will permanently delete the project and disassociate its tasks, components, and snippets."
        confirmText="Delete Project"
        variant="danger"
      />
    </div>
  );
}
