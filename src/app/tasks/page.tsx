"use client";

import { useState } from "react";
import {
  Plus,
  Search,
  Kanban,
  List,
  CheckCircle2,
  FolderKanban,
  Filter,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import { useTasks } from "@/hooks/use-tasks";
import { useProjects } from "@/hooks/use-projects";
import { Task, TaskStatus, Priority } from "@/types/task";
import { KanbanColumn } from "@/components/tasks/kanban-column";
import { TaskListRow } from "@/components/tasks/task-list-row";
import { NewTaskModal } from "@/components/tasks/new-task-modal";
import { EditTaskModal } from "@/components/tasks/edit-task-modal";
import { sound } from "@/lib/audio";
import { cn } from "@/lib/utils";

const KANBAN_COLUMNS: { id: TaskStatus; title: string; dotColor: string }[] = [
  { id: "TODO", title: "To Do", dotColor: "bg-blue-400" },
  { id: "IN_PROGRESS", title: "In Progress", dotColor: "bg-primary animate-pulse" },
  { id: "IN_REVIEW", title: "In Review", dotColor: "bg-amber-400" },
  { id: "DONE", title: "Done", dotColor: "bg-semantic-success" },
];

export default function TasksPage() {
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [selectedPriority, setSelectedPriority] = useState<Priority | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");

  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [modalInitialStatus, setModalInitialStatus] = useState<TaskStatus>("TODO");
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { data: projects } = useProjects();
  const {
    data: tasks,
    isLoading,
    isError,
    error,
    refetch,
  } = useTasks({
    projectId: selectedProjectId || undefined,
    priority: selectedPriority !== "ALL" ? selectedPriority : undefined,
    search: searchQuery,
  });

  const completedCount = tasks?.filter((t) => t.status === "DONE").length ?? 0;
  const totalCount = tasks?.length ?? 0;

  const handleOpenNewModal = (initialStatus: TaskStatus = "TODO") => {
    sound.playClick(900);
    setModalInitialStatus(initialStatus);
    setIsNewModalOpen(true);
  };

  return (
    <div className="flex-1 min-h-screen bg-canvas text-ink flex flex-col">
      {/* Header */}
      <div className="px-8 pt-8 pb-6 border-b border-hairline flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-semibold tracking-[-0.6px] text-ink">
              Tasks Board
            </h1>
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-surface-2 border border-hairline text-ink-subtle">
              {completedCount}/{totalCount} Completed
            </span>
          </div>
          <p className="text-xs text-ink-muted">
            Drag-and-drop kanban board & list tracking features, fixes, and milestones.
          </p>
        </div>

        <button
          onClick={() => handleOpenNewModal("TODO")}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium tracking-[-0.1px] shadow-sm shadow-primary/25 hover:shadow-primary/40 transition-all duration-150 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Task</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="px-8 py-4 border-b border-hairline bg-surface-1/40 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Left: Search input */}
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-tertiary" />
          <input
            type="text"
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs placeholder:text-ink-tertiary focus:outline-none focus:border-hairline-strong transition-all"
          />
        </div>

        {/* Right: Project Filter, Priority Filter, View Mode Switcher */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Project Filter */}
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <FolderKanban className="w-3.5 h-3.5 text-ink-tertiary" />
            <select
              value={selectedProjectId}
              onChange={(e) => {
                sound.playClick(700);
                setSelectedProjectId(e.target.value);
              }}
              className="text-xs font-mono px-2.5 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink focus:outline-none focus:border-primary"
            >
              <option value="">All Projects</option>
              {projects?.map((proj) => (
                <option key={proj.id} value={proj.id}>
                  {proj.title}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div className="flex items-center gap-1.5 text-xs text-ink-muted">
            <Filter className="w-3.5 h-3.5 text-ink-tertiary" />
            <select
              value={selectedPriority}
              onChange={(e) => {
                sound.playClick(700);
                setSelectedPriority(e.target.value as Priority | "ALL");
              }}
              className="text-xs font-mono px-2.5 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink focus:outline-none focus:border-primary"
            >
              <option value="ALL">All Priorities</option>
              <option value="URGENT">Urgent</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>

          {/* View Switcher (Kanban vs List) */}
          <div className="flex items-center p-0.5 rounded-md bg-surface-2 border border-hairline">
            <button
              onClick={() => {
                sound.playClick(700);
                setViewMode("kanban");
              }}
              title="Kanban Board view"
              className={cn(
                "p-1.5 rounded text-xs transition-colors",
                viewMode === "kanban"
                  ? "bg-surface-4 text-ink shadow-sm"
                  : "text-ink-tertiary hover:text-ink"
              )}
            >
              <Kanban className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => {
                sound.playClick(700);
                setViewMode("list");
              }}
              title="List view"
              className={cn(
                "p-1.5 rounded text-xs transition-colors",
                viewMode === "list"
                  ? "bg-surface-4 text-ink shadow-sm"
                  : "text-ink-tertiary hover:text-ink"
              )}
            >
              <List className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
        {/* Loading Skeletons */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full">
            {[1, 2, 3, 4].map((col) => (
              <div
                key={col}
                className="w-full min-w-0 rounded-xl bg-surface-1 border border-hairline p-4 space-y-3 animate-pulse"
              >
                <div className="h-4 w-28 rounded bg-surface-3 mb-4" />
                <div className="h-24 rounded bg-surface-2" />
                <div className="h-24 rounded bg-surface-2" />
              </div>
            ))}
          </div>
        )}

        {/* Error State */}
        {isError && (
          <div className="p-6 rounded-lg bg-surface-1 border border-rose-500/20 text-center max-w-md mx-auto my-12">
            <AlertCircle className="w-8 h-8 text-rose-400 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-ink mb-1">
              Failed to load tasks
            </h3>
            <p className="text-xs text-ink-muted mb-4">
              {(error as any)?.message || "Could not reach the backend API."}
            </p>
            <button
              onClick={() => refetch()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-surface-2 border border-hairline text-ink text-xs hover:bg-surface-3 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              Retry Connection
            </button>
          </div>
        )}

        {/* Loaded State */}
        {!isLoading && !isError && (
          <>
            {/* Empty State */}
            {(!tasks || tasks.length === 0) && (
              <div className="text-center py-16 px-4 max-w-sm mx-auto">
                <div className="w-12 h-12 rounded-xl bg-surface-2 border border-hairline flex items-center justify-center text-ink-subtle mx-auto mb-4">
                  <CheckCircle2 className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-sm font-semibold text-ink mb-1 tracking-[-0.2px]">
                  No tasks found
                </h3>
                <p className="text-xs text-ink-muted leading-relaxed mb-5">
                  {searchQuery || selectedProjectId || selectedPriority !== "ALL"
                    ? "Try adjusting your filters or search terms."
                    : "Create your first task to start planning your sprint."}
                </p>
                <button
                  onClick={() => handleOpenNewModal("TODO")}
                  className="inline-flex items-center gap-2 px-3.5 py-2 rounded-md bg-primary hover:bg-primary-hover text-white text-xs font-medium transition-colors shadow-sm shadow-primary/25"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Create Task
                </button>
              </div>
            )}

            {/* Kanban Board View - 4-column balanced grid with zero horizontal scroll */}
            {tasks && tasks.length > 0 && viewMode === "kanban" && (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 w-full items-start pb-6">
                {KANBAN_COLUMNS.map((column) => (
                  <KanbanColumn
                    key={column.id}
                    status={column.id}
                    title={column.title}
                    dotColor={column.dotColor}
                    tasks={tasks.filter((t) => t.status === column.id)}
                    onNewTaskWithStatus={(st) => handleOpenNewModal(st)}
                    onEditTask={(t) => setEditingTask(t)}
                  />
                ))}
              </div>
            )}

            {/* List View - remove overflow-hidden so dropdown menus are never clipped */}
            {tasks && tasks.length > 0 && viewMode === "list" && (
              <div className="rounded-lg border border-hairline divide-y divide-hairline max-w-5xl bg-surface-1">
                {tasks.map((task) => (
                  <TaskListRow
                    key={task.id}
                    task={task}
                    onEdit={(t) => setEditingTask(t)}
                  />
                ))}
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
    </div>
  );
}
