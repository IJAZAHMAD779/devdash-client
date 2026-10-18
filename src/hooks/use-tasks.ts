"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";
import {
  Task,
  CreateTaskPayload,
  UpdateTaskPayload,
  TaskStatus,
  Priority,
} from "@/types/task";

interface TaskQueryParams {
  projectId?: string;
  status?: TaskStatus;
  priority?: Priority;
  search?: string;
}

export function useTasks(params?: TaskQueryParams) {
  return useQuery<Task[]>({
    queryKey: ["tasks", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.projectId) searchParams.append("projectId", params.projectId);
      if (params?.status) searchParams.append("status", params.status);
      if (params?.priority) searchParams.append("priority", params.priority);
      if (params?.search && params.search.trim())
        searchParams.append("search", params.search.trim());

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return apiClient.get<Task[]>(`/tasks${queryStr}`);
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateTaskPayload) => {
      return apiClient.post<Task>("/tasks", payload);
    },
    // 0ms Optimistic UI Update
    onMutate: async (newTask) => {
      sound.playClick(900);
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      const optimisticTask: Task = {
        id: `optimistic-${Date.now()}`,
        userId: "user_current",
        projectId: newTask.projectId ?? null,
        title: newTask.title,
        description: newTask.description ?? null,
        status: newTask.status ?? "TODO",
        priority: newTask.priority ?? "MEDIUM",
        dueDate: newTask.dueDate ?? null,
        completedAt: newTask.status === "DONE" ? new Date().toISOString() : null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
        return old ? [optimisticTask, ...old] : [optimisticTask];
      });

      return { previousTasks };
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: (_err, _newTask, context) => {
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: ["tasks"] }, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateTaskPayload;
    }) => {
      return apiClient.put<Task>(`/tasks/${id}`, payload);
    },
    onMutate: async ({ id, payload }) => {
      sound.playClick();
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return [];
        return old.map((t) =>
          t.id === id ? { ...t, ...payload, updatedAt: new Date().toISOString() } : t
        );
      });

      return { previousTasks };
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: ["tasks"] }, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function usePatchTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: TaskStatus }) => {
      return apiClient.patch<Task>(`/tasks/${id}/status`, { status });
    },
    // 0ms Optimistic UI for drag-and-drop & checkbox check
    onMutate: async ({ id, status }) => {
      if (status === "DONE") {
        sound.playSuccess();
      } else {
        sound.playClick(700);
      }

      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return [];
        return old.map((t) =>
          t.id === id
            ? {
                ...t,
                status,
                completedAt: status === "DONE" ? new Date().toISOString() : null,
                updatedAt: new Date().toISOString(),
              }
            : t
        );
      });

      return { previousTasks };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: ["tasks"] }, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/tasks/${id}`);
    },
    onMutate: async (id) => {
      sound.playClick(400);
      await queryClient.cancelQueries({ queryKey: ["tasks"] });
      const previousTasks = queryClient.getQueryData<Task[]>(["tasks"]);

      queryClient.setQueriesData<Task[]>({ queryKey: ["tasks"] }, (old) => {
        if (!old) return [];
        return old.filter((t) => t.id !== id);
      });

      return { previousTasks };
    },
    onError: (_err, _id, context) => {
      if (context?.previousTasks) {
        queryClient.setQueriesData({ queryKey: ["tasks"] }, context.previousTasks);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
