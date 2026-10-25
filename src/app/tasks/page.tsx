"use client";

import React, { useState } from "react";
import { AlertCircle, RefreshCw } from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { useReminders } from "@/hooks/use-reminders";
import { Task, TaskStatus, Priority } from "@/types/task";
import dynamic from "next/dynamic";
import { KanbanColumn } from "@/components/tasks/kanban-column";
import { TaskListView } from "@/components/tasks/task-list-view";
import { TasksTopBar } from "@/components/tasks/tasks-top-bar";

const NewTaskModal = dynamic(
  () => import("@/components/tasks/new-task-modal").then((m) => m.NewTaskModal),
  { ssr: false }
);
const EditTaskModal = dynamic(
  () => import("@/components/tasks/edit-task-modal").then((m) => m.EditTaskModal),
  { ssr: false }
);
const TaskDetailModal = dynamic(
  () => import("@/components/tasks/task-detail-modal").then((m) => m.TaskDetailModal),
  { ssr: false }
);
const RemindersModal = dynamic(
  () => import("@/components/reminders/reminders-modal").then((m) => m.RemindersModal),
  { ssr: false }
);
import { EmptyState } from "@/components/tasks/empty-state";
import { sound } from "@/lib/audio";
import { useDebounce } from "@/hooks/use-debounce";
import { Skeleton } from "@/components/ui/skeleton";

const KANBAN_COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: "TODO", title: "To Do" },
  { id: "IN_PROGRESS", title: "In Progress" },
  { id: "IN_REVIEW", title: "In Review" },
  { id: "DONE", title: "Done" },
];

export default function TasksPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<Priority | "ALL">("ALL");
  const [viewMode, setViewMode] = useState<"kanban" | "list">(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("devdash_tasks_view_mode") as "kanban" | "list";
      if (saved && ["kanban", "list"].includes(saved)) return saved;
    }
    return "kanban";
  });

  const handleViewModeChange = (mode: "kanban" | "list") => {
    sound.playClick(700);
    setViewMode(mode);
    if (typeof window !== "undefined") {
      localStorage.setItem("devdash_tasks_view_mode", mode);
    }
  };

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalInitialStatus, setModalInitialStatus] = useState<TaskStatus>("TODO");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [isRemindersOpen, setIsRemindersOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const debouncedSearch = useDebounce(searchQuery, 300);

  const { data: projects } = useProjects();
  const { data: reminders } = useReminders();
  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useTasks({
    projectId: selectedProjectId || undefined,
    priority: selectedPriority !== "ALL" ? selectedPriority : undefined,
    search: debouncedSearch,
  });

  const totalCount = tasks?.length ?? 0;
  const pendingRemindersCount = reminders?.filter((r) => !r.isSent).length ?? 0;

  const handleOpenNewModal = (initialStatus: TaskStatus = "TODO") => {
    sound.playClick(900);
    setModalInitialStatus(initialStatus);
    setIsNewModalOpen(true);
  };

  return (
    <div className="@container/tasks flex-1 min-h-screen bg-canvas text-text-primary flex flex-col">
      {/* Top Header & Toolbar Bar */}
      <TasksTopBar
        totalCount={totalCount}
        viewMode={viewMode}
        onViewModeChange={handleViewModeChange}
        onNewTask={() => handleOpenNewModal("TODO")}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        selectedProjectId={selectedProjectId}
        onProjectChange={setSelectedProjectId}
        projects={projects}
        selectedPriority={selectedPriority}
        onPriorityChange={setSelectedPriority}
        pendingRemindersCount={pendingRemindersCount}
        onOpenReminders={() => setIsRemindersOpen(true)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col p-3 sm:p-5 overflow-hidden min-w-0">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full flex-1">
            {[1, 2, 3, 4].map((col) => (
              <div
                key={col}
                className="w-full min-w-0 rounded-[8px] bg-surface-1/40 p-3 space-y-3"
              >
                <div className="flex items-center justify-between pb-2 border-b border-line">
                  <Skeleton className="h-3.5 w-20" />
                  <Skeleton className="h-3.5 w-5" />
                </div>
                <div className="space-y-2">
                  <div className="p-3 rounded-[8px] bg-surface-1 border border-line space-y-2">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-2.5 w-1/2" />
                  </div>
                  <div className="p-3 rounded-[8px] bg-surface-1 border border-line space-y-2">
                    <Skeleton className="h-3.5 w-4/5" />
                    <Skeleton className="h-2.5 w-2/3" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-[8px] bg-surface-1 border border-danger/20 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-danger mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-text-primary mb-1">
              Failed to load tasks
            </h3>
            <p className="text-xs text-muted mb-4 font-mono">
              {(error as any)?.message || "Could not reach the backend API."}
            </p>
            <button
              type="button"
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[6px] bg-surface-2 border border-line text-text-primary text-xs font-mono hover:bg-surface-3 transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry Connection</span>
            </button>
          </div>
        )}

        {/* Loaded State */}
        {!isLoading && !isError && (
          <>
            {/* Empty State when no tasks exist at all */}
            {(!tasks || tasks.length === 0) && (
              <EmptyState
                message={
                  searchQuery || selectedProjectId || selectedPriority !== "ALL"
                    ? "No tasks match the active filters."
                    : "No tasks created yet."
                }
                actionLabel={
                  searchQuery || selectedProjectId || selectedPriority !== "ALL"
                    ? "Clear filters"
                    : "+ Create your first task"
                }
                onAction={
                  searchQuery || selectedProjectId || selectedPriority !== "ALL"
                    ? () => {
                        sound.playClick(600);
                        setSearchQuery("");
                        setSelectedProjectId("");
                        setSelectedPriority("ALL");
                      }
                    : () => handleOpenNewModal("TODO")
                }
              />
            )}

            {/* Kanban Board View */}
            {tasks && tasks.length > 0 && viewMode === "kanban" && (
              <div className="flex-1 flex overflow-x-auto snap-x snap-mandatory lg:grid lg:grid-cols-4 gap-3.5 w-full min-w-0 pb-2">
                {KANBAN_COLUMNS.map((column) => (
                  <div key={column.id} className="snap-start shrink-0 w-[270px] lg:w-auto flex flex-col">
                    <KanbanColumn
                      status={column.id}
                      title={column.title}
                      tasks={tasks.filter((t) => t.status === column.id)}
                      onNewTaskWithStatus={(st) => handleOpenNewModal(st)}
                      onEditTask={(t) => setEditingTask(t)}
                      onViewTask={(t) => setViewingTask(t)}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* List View */}
            {tasks && tasks.length > 0 && viewMode === "list" && (
              <div className="flex-1 flex flex-col min-w-0 rounded-[8px] bg-surface-1 border border-line overflow-hidden">
                <TaskListView
                  tasks={tasks}
                  onEdit={(t) => setEditingTask(t)}
                  onView={(t) => setViewingTask(t)}
                  onNewTask={() => handleOpenNewModal("TODO")}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* New Task Modal */}
      <NewTaskModal
        isOpen={isNewModalOpen}
        defaultStatus={modalInitialStatus}
        defaultProjectId={selectedProjectId}
        onClose={() => setIsNewModalOpen(false)}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        task={editingTask}
        isOpen={Boolean(editingTask)}
        onClose={() => setEditingTask(null)}
      />

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={viewingTask}
        isOpen={Boolean(viewingTask)}
        onClose={() => setViewingTask(null)}
        onEdit={(t) => {
          setViewingTask(null);
          setEditingTask(t);
        }}
      />

      {/* Reminders Modal */}
      <RemindersModal
        isOpen={isRemindersOpen}
        onClose={() => setIsRemindersOpen(false)}
      />
    </div>
  );
}
