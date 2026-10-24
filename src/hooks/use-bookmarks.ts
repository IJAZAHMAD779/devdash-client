"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";
import {
  Bookmark,
  CreateBookmarkPayload,
  UpdateBookmarkPayload,
  BookmarkCategory,
  BatchEnrichPayload,
  BatchEnrichResponse,
  ClearBookmarkNotesPayload,
  ClearBookmarkNotesResponse,
  BatchMoveBookmarksPayload,
  BatchMoveBookmarksResponse,
  BatchDeleteBookmarksPayload,
  BatchDeleteBookmarksResponse,
} from "@/types/bookmark";

interface BookmarkQueryParams {
  category?: BookmarkCategory;
  projectId?: string;
  tag?: string;
  search?: string;
  favorite?: boolean;
}

export function useBookmarks(params?: BookmarkQueryParams) {
  return useQuery<Bookmark[]>({
    queryKey: ["bookmarks", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append("category", params.category);
      if (params?.projectId) searchParams.append("projectId", params.projectId);
      if (params?.tag) searchParams.append("tag", params.tag);
      if (params?.favorite !== undefined)
        searchParams.append("favorite", String(params.favorite));
      if (params?.search && params.search.trim())
        searchParams.append("search", params.search.trim());

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return apiClient.get<Bookmark[]>(`/bookmarks${queryStr}`);
    },
  });
}

export function useCreateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateBookmarkPayload) => {
      return apiClient.post<Bookmark>("/bookmarks", payload);
    },
    onMutate: async (newBm) => {
      sound.playClick(900);
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previous = queryClient.getQueryData<Bookmark[]>(["bookmarks"]);

      const optimistic: Bookmark = {
        id: `optimistic-${Date.now()}`,
        userId: "user_current",
        projectId: newBm.projectId ?? null,
        title: newBm.title,
        url: newBm.url,
        category: newBm.category ?? "tools",
        tags: newBm.tags ?? [],
        notes: newBm.notes ?? null,
        favorite: newBm.favorite ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (old = []) => [
        optimistic,
        ...old,
      ]);

      return { previous };
    },
    onError: (err, newBm, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bookmarks"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useUpdateBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateBookmarkPayload;
    }) => {
      return apiClient.put<Bookmark>(`/bookmarks/${id}`, payload);
    },
    onMutate: async ({ id, payload }) => {
      sound.playClick(750);
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previous = queryClient.getQueryData<Bookmark[]>(["bookmarks"]);

      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (old = []) =>
        old.map((item) =>
          item.id === id ? ({ ...item, ...payload, updatedAt: new Date().toISOString() } as Bookmark) : item
        )
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bookmarks"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useDeleteBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<{ id: string; message: string }>(`/bookmarks/${id}`);
    },
    onMutate: async (id) => {
      sound.playClick(400);
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previous = queryClient.getQueryData<Bookmark[]>(["bookmarks"]);

      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (old = []) =>
        old.filter((item) => item.id !== id)
      );

      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bookmarks"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useBatchCreateBookmarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { bookmarks: CreateBookmarkPayload[] }) => {
      return apiClient.post<{ count: number; message: string }>("/bookmarks/batch", payload);
    },
    onSuccess: () => {
      sound.playSuccess();
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useToggleBookmarkFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.patch<Bookmark>(`/bookmarks/${id}/favorite`, {});
    },
    onMutate: async (id) => {
      sound.playClick(850);
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previous = queryClient.getQueryData<Bookmark[]>(["bookmarks"]);

      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (old = []) =>
        old.map((item) =>
          item.id === id ? { ...item, favorite: !item.favorite } : item
        )
      );

      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bookmarks"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useBatchEnrichBookmarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BatchEnrichPayload) => {
      return apiClient.post<BatchEnrichResponse>("/bookmarks/enrich-batch", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

export function useEnrichBookmark() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.post<Bookmark>(`/bookmarks/${id}/enrich`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
    },
  });
}

export function useClearBookmarkNotes() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: ClearBookmarkNotesPayload) => {
      return apiClient.post<ClearBookmarkNotesResponse>("/bookmarks/clear-notes", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

export function useBatchMoveBookmarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BatchMoveBookmarksPayload) => {
      return apiClient.post<BatchMoveBookmarksResponse>("/bookmarks/batch-move", payload);
    },
    onMutate: async (payload) => {
      sound.playClick(850);
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previous = queryClient.getQueryData<Bookmark[]>(["bookmarks"]);

      const targetIdSet = new Set(payload.bookmarkIds);
      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (old = []) =>
        old.map((item) =>
          targetIdSet.has(item.id)
            ? {
                ...item,
                category: payload.category,
                ...(payload.projectId !== undefined && { projectId: payload.projectId }),
                updatedAt: new Date().toISOString(),
              }
            : item
        )
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bookmarks"], context.previous);
      }
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

export function useBatchDeleteBookmarks() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: BatchDeleteBookmarksPayload) => {
      return apiClient.post<BatchDeleteBookmarksResponse>("/bookmarks/batch-delete", payload);
    },
    onMutate: async (payload) => {
      sound.playClick(400);
      await queryClient.cancelQueries({ queryKey: ["bookmarks"] });
      const previous = queryClient.getQueryData<Bookmark[]>(["bookmarks"]);

      const targetIdSet = new Set(payload.bookmarkIds);
      queryClient.setQueryData<Bookmark[]>(["bookmarks"], (old = []) =>
        old.filter((item) => !targetIdSet.has(item.id))
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["bookmarks"], context.previous);
      }
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}

