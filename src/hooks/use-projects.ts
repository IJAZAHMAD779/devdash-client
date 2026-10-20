"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";
import {
  Project,
  CreateProjectPayload,
  UpdateProjectPayload,
  ProjectStatus,
  ProjectPreviewData,
  GitHubRepoStats,
} from "@/types/project";

export function useProjects(status?: ProjectStatus | "ALL", search?: string) {
  return useQuery<Project[]>({
    queryKey: ["projects", { status, search }],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (status && status !== "ALL") params.append("status", status);
      if (search && search.trim()) params.append("search", search.trim());

      const queryStr = params.toString() ? `?${params.toString()}` : "";
      return apiClient.get<Project[]>(`/projects${queryStr}`);
    },
    retry: 2,
    retryDelay: 1000,
  });
}

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateProjectPayload) => {
      return apiClient.post<Project>("/projects", payload);
    },
    // 0ms Optimistic UI Update (ADR 009)
    onMutate: async (newProject) => {
      sound.playClick(900);
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);

      const optimisticProject: Project = {
        id: `optimistic-${Date.now()}`,
        userId: "user_current",
        title: newProject.title,
        description: newProject.description ?? null,
        status: newProject.status ?? "PLANNING",
        repositoryUrl: newProject.repositoryUrl ?? null,
        liveUrl: newProject.liveUrl ?? null,
        techStack: newProject.techStack ?? [],
        favorite: newProject.favorite ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        _count: {
          tasks: 0,
          snippets: 0,
          components: 0,
          notes: 0,
          bookmarks: 0,
        },
      };

      queryClient.setQueriesData<Project[]>({ queryKey: ["projects"] }, (old) => {
        return old ? [optimisticProject, ...old] : [optimisticProject];
      });

      return { previousProjects };
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: (_err, _newProject, context) => {
      if (context?.previousProjects) {
        queryClient.setQueriesData(
          { queryKey: ["projects"] },
          context.previousProjects
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateProjectPayload;
    }) => {
      return apiClient.put<Project>(`/projects/${id}`, payload);
    },
    onMutate: async ({ id, payload }) => {
      sound.playClick();
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);

      queryClient.setQueriesData<Project[]>({ queryKey: ["projects"] }, (old) => {
        if (!old) return [];
        return old.map((proj) =>
          proj.id === id ? { ...proj, ...payload, updatedAt: new Date().toISOString() } : proj
        );
      });

      return { previousProjects };
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: (_err, _variables, context) => {
      if (context?.previousProjects) {
        queryClient.setQueriesData(
          { queryKey: ["projects"] },
          context.previousProjects
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/projects/${id}`);
    },
    onMutate: async (id) => {
      sound.playClick(400);
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);

      queryClient.setQueriesData<Project[]>({ queryKey: ["projects"] }, (old) => {
        if (!old) return [];
        return old.filter((p) => p.id !== id);
      });

      return { previousProjects };
    },
    onError: (_err, _id, context) => {
      if (context?.previousProjects) {
        queryClient.setQueriesData(
          { queryKey: ["projects"] },
          context.previousProjects
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useToggleFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      favorite,
    }: {
      id: string;
      favorite: boolean;
    }) => {
      return apiClient.put<Project>(`/projects/${id}`, { favorite });
    },
    onMutate: async ({ id, favorite }) => {
      sound.playClick(favorite ? 850 : 500);
      await queryClient.cancelQueries({ queryKey: ["projects"] });
      const previousProjects = queryClient.getQueryData<Project[]>(["projects"]);

      queryClient.setQueriesData<Project[]>({ queryKey: ["projects"] }, (old) => {
        if (!old) return [];
        return old.map((p) => (p.id === id ? { ...p, favorite } : p));
      });

      return { previousProjects };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousProjects) {
        queryClient.setQueriesData(
          { queryKey: ["projects"] },
          context.previousProjects
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useProject(id: string | null | undefined) {
  return useQuery<Project>({
    queryKey: ["project", id],
    queryFn: async () => {
      if (!id) throw new Error("Project ID is required");
      return apiClient.get<Project>(`/projects/${id}`);
    },
    enabled: Boolean(id && !id.startsWith("optimistic-")),
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });
}

export function useProjectPreview(url: string | null | undefined) {
  return useQuery<ProjectPreviewData>({
    queryKey: ["project-preview", url],
    queryFn: async () => {
      if (!url) throw new Error("URL is required");
      return apiClient.get<ProjectPreviewData>(
        `/projects/preview?url=${encodeURIComponent(url)}`
      );
    },
    enabled: Boolean(url && url.trim().length > 3),
    staleTime: 1000 * 60 * 30, // 30 minutes cache (server has 6h cache)
    retry: 1,
  });
}

export function useGitHubTelemetry(repoUrl: string | null | undefined) {
  return useQuery<GitHubRepoStats>({
    queryKey: ["github-telemetry", repoUrl],
    queryFn: async () => {
      if (!repoUrl) throw new Error("Repo URL is required");
      return apiClient.get<GitHubRepoStats>(
        `/projects/github-stats?repoUrl=${encodeURIComponent(repoUrl)}`
      );
    },
    enabled: Boolean(repoUrl && repoUrl.includes("github.com/")),
    staleTime: 1000 * 60 * 15, // 15 minutes cache (server has 1h cache)
    retry: 1,
  });
}
