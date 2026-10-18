"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";
import {
  Snippet,
  CreateSnippetPayload,
  UpdateSnippetPayload,
} from "@/types/snippet";

interface SnippetQueryParams {
  language?: string;
  tag?: string;
  projectId?: string;
  favorite?: boolean;
  search?: string;
}

export function useSnippets(params?: SnippetQueryParams) {
  return useQuery<Snippet[]>({
    queryKey: ["snippets", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.language && params.language !== "ALL")
        searchParams.append("language", params.language.toLowerCase());
      if (params?.tag) searchParams.append("tag", params.tag);
      if (params?.projectId) searchParams.append("projectId", params.projectId);
      if (params?.favorite !== undefined)
        searchParams.append("favorite", String(params.favorite));
      if (params?.search && params.search.trim())
        searchParams.append("search", params.search.trim());

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return apiClient.get<Snippet[]>(`/snippets${queryStr}`);
    },
  });
}

export function useCreateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateSnippetPayload) => {
      return apiClient.post<Snippet>("/snippets", payload);
    },
    onMutate: async (newSnippet) => {
      sound.playClick(900);
      await queryClient.cancelQueries({ queryKey: ["snippets"] });
      const previousSnippets = queryClient.getQueryData<Snippet[]>(["snippets"]);

      const optimisticSnippet: Snippet = {
        id: `optimistic-${Date.now()}`,
        userId: "user_current",
        projectId: newSnippet.projectId ?? null,
        title: newSnippet.title,
        description: newSnippet.description ?? null,
        language: newSnippet.language.toLowerCase(),
        code: newSnippet.code,
        tags: newSnippet.tags ?? [],
        favorite: newSnippet.favorite ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueriesData<Snippet[]>({ queryKey: ["snippets"] }, (old) => {
        return old ? [optimisticSnippet, ...old] : [optimisticSnippet];
      });

      return { previousSnippets };
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: (_err, _newSnippet, context) => {
      if (context?.previousSnippets) {
        queryClient.setQueriesData(
          { queryKey: ["snippets"] },
          context.previousSnippets
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateSnippetPayload;
    }) => {
      return apiClient.put<Snippet>(`/snippets/${id}`, payload);
    },
    onMutate: async ({ id, payload }) => {
      sound.playClick();
      await queryClient.cancelQueries({ queryKey: ["snippets"] });
      const previousSnippets = queryClient.getQueryData<Snippet[]>(["snippets"]);

      queryClient.setQueriesData<Snippet[]>({ queryKey: ["snippets"] }, (old) => {
        if (!old) return [];
        return old.map((s) =>
          s.id === id ? { ...s, ...payload, updatedAt: new Date().toISOString() } : s
        );
      });

      return { previousSnippets };
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSnippets) {
        queryClient.setQueriesData(
          { queryKey: ["snippets"] },
          context.previousSnippets
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useToggleSnippetFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      return apiClient.put<Snippet>(`/snippets/${id}`, { favorite });
    },
    onMutate: async ({ id, favorite }) => {
      sound.playClick(favorite ? 850 : 500);
      await queryClient.cancelQueries({ queryKey: ["snippets"] });
      const previousSnippets = queryClient.getQueryData<Snippet[]>(["snippets"]);

      queryClient.setQueriesData<Snippet[]>({ queryKey: ["snippets"] }, (old) => {
        if (!old) return [];
        return old.map((s) => (s.id === id ? { ...s, favorite } : s));
      });

      return { previousSnippets };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousSnippets) {
        queryClient.setQueriesData(
          { queryKey: ["snippets"] },
          context.previousSnippets
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
    },
  });
}

export function useDeleteSnippet() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/snippets/${id}`);
    },
    onMutate: async (id) => {
      sound.playClick(400);
      await queryClient.cancelQueries({ queryKey: ["snippets"] });
      const previousSnippets = queryClient.getQueryData<Snippet[]>(["snippets"]);

      queryClient.setQueriesData<Snippet[]>({ queryKey: ["snippets"] }, (old) => {
        if (!old) return [];
        return old.filter((s) => s.id !== id);
      });

      return { previousSnippets };
    },
    onError: (_err, _id, context) => {
      if (context?.previousSnippets) {
        queryClient.setQueriesData(
          { queryKey: ["snippets"] },
          context.previousSnippets
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["snippets"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}
