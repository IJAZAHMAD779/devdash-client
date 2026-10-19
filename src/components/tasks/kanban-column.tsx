"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Task, TaskStatus } from "@/types/task";
import { TaskCard } from "./task-card";
import { usePatchTaskStatus } from "@/hooks/use-tasks";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

interface Props {
  status: TaskStatus;
  title: string;
  dotColor: string;
  tasks: Task[];
  onNewTaskWithStatus: (status: TaskStatus) => void;
  onEditTask: (task: Task) => void;
}

export function KanbanColumn({
  status,
  title,
  dotColor,
  tasks,
  onNewTaskWithStatus,
  onEditTask,
}: Props) {
  const patchStatus = usePatchTaskStatus();
  const [isDragOver, setIsDragOver] = useState(false);

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
        "flex flex-col rounded-xl bg-surface-1/60 border border-hairline p-3 w-full min-w-0 transition-colors duration-150 select-none",
        isDragOver && "border-primary/80 bg-primary/5 ring-1 ring-primary/40"
      )}
    >
      {/* Column Header */}
      <div className="flex items-center justify-between pb-3 px-1 border-b border-hairline/60 mb-3">
        <div className="flex items-center gap-2">
          <span className={cn("w-2 h-2 rounded-full", dotColor)} />
          <h3 className="text-xs font-semibold tracking-[-0.2px] text-ink uppercase">
            {title}
          </h3>
          <span className="text-[11px] font-mono px-1.5 py-0.2 rounded-full bg-surface-2 border border-hairline text-ink-subtle">
            {tasks.length}
          </span>
        </div>

        <button
          onClick={() => {
            sound.playClick(900);
            onNewTaskWithStatus(status);
          }}
          title={`Add task to ${title}`}
          className="p-1 rounded text-ink-subtle hover:text-ink hover:bg-surface-2 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Task Cards List */}
      <div className="flex-1 space-y-2.5 overflow-y-auto max-h-[calc(100vh-280px)] pr-1">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} onEdit={onEditTask} />
        ))}

        {tasks.length === 0 && (
          <div className="h-24 rounded-lg border border-dashed border-hairline/60 flex items-center justify-center text-[11px] font-mono text-ink-tertiary">
            Drop task here
          </div>
        )}
      </div>
    </div>
  );
}
