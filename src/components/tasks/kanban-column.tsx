"use client";

import React, { useState } from "react";
import { Plus } from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./task-card";
import { StatusDot, STATUS_CONFIG } from "./status-dot";
import { usePatchTaskStatus } from "@/hooks/use-tasks";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface KanbanColumnProps {
  status: TaskStatus;
  title: string;
  dotColor?: string;
  tasks: Task[];
  onNewTaskWithStatus: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
  onViewTask?: (task: Task) => void;
}

export function KanbanColumn({
  status,
  title,
  tasks,
  onNewTaskWithStatus,
  onEditTask,
  onViewTask,
}: KanbanColumnProps) {
  const patchStatus = usePatchTaskStatus();
  const [isDragOver, setIsDragOver] = useState(false);

  // Exact HTML5 Drag & Drop handlers preserved
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const taskId = e.dataTransfer.getData("text/plain");
    if (!taskId) return;

    patchStatus.mutate({
      id: taskId,
      status,
    });
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className={cn(
        "flex flex-col rounded-[8px] bg-surface-1/40 p-2 sm:p-2.5 w-full min-w-[260px] md:min-w-0 flex-1 min-h-[460px] transition-colors duration-150 select-none",
        isDragOver && "bg-surface-2/80 ring-1 ring-line-strong"
      )}
    >
      {/* Column Header: StatusDot + Mono Label + Plain Mono Count + Ghost + */}
      <div className="flex items-center justify-between pb-2 px-1 mb-2 border-b border-line select-none">
        <div className="flex items-center gap-2">
          <StatusDot status={status} />
          <h3 className="text-[11px] font-mono uppercase tracking-[0.08em] font-semibold text-text-primary">
            {title}
          </h3>
          <span className="text-[11px] font-mono text-subtle">
            {tasks.length}
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            sound.playClick(900);
            onNewTaskWithStatus(status);
          }}
          title={`Add task to ${title}`}
          className="p-1 rounded-[4px] text-subtle hover:text-text-primary hover:bg-surface-2 transition-colors cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task Cards List: Full height scrolling */}
      <div className="flex-1 space-y-2 overflow-y-auto max-h-[calc(100vh-220px)] pr-0.5">
        {tasks.map((task) => (
          <TaskCard
            key={task.id}
            task={task}
            onEdit={onEditTask}
            onView={onViewTask}
          />
        ))}

        {tasks.length === 0 && (
          <div className="h-24 rounded-[8px] border border-dashed border-line flex items-center justify-center text-[11px] font-mono text-subtle/50 select-none">
            Drop task here
          </div>
        )}
      </div>
    </div>
  );
}
