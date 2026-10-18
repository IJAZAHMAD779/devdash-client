"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";
import {
  Bookmark,
  CreateBookmarkPayload,
  UpdateBookmarkPayload,
  BookmarkCategory,
} from "@/types/bookmark";

interface BookmarkQueryParams {
  category?: BookmarkCategory;
  projectId?: string;
  tag?: string;
  search?: string;
}

export function useBookmarks(params?: BookmarkQueryParams) {
  return useQuery<Bookmark[]>({
    queryKey: ["bookmarks", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.category) searchParams.append("category", params.category);
      if (params?.projectId) searchParams.append("projectId", params.projectId);
      if (params?.tag) searchParams.append("tag", params.tag);
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
        category: newBm.category ?? "DOCS",
        tags: newBm.tags ?? [],
        notes: newBm.notes ?? null,
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
