"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";
import { Note, CreateNotePayload, UpdateNotePayload } from "@/types/note";

interface NoteQueryParams {
  projectId?: string;
  tag?: string;
  favorite?: boolean;
  search?: string;
}

export function useNotes(params?: NoteQueryParams) {
  return useQuery<Note[]>({
    queryKey: ["notes", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.projectId) searchParams.append("projectId", params.projectId);
      if (params?.tag) searchParams.append("tag", params.tag);
      if (params?.favorite !== undefined)
        searchParams.append("favorite", String(params.favorite));
      if (params?.search && params.search.trim())
        searchParams.append("search", params.search.trim());

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return apiClient.get<Note[]>(`/notes${queryStr}`);
    },
  });
}

export function useCreateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateNotePayload) => {
      return apiClient.post<Note>("/notes", payload);
    },
    onMutate: async (newNote) => {
      sound.playClick(900);
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previous = queryClient.getQueryData<Note[]>(["notes"]);

      const optimistic: Note = {
        id: `optimistic-${Date.now()}`,
        userId: "user_current",
        projectId: newNote.projectId ?? null,
        title: newNote.title,
        content: newNote.content,
        tags: newNote.tags ?? [],
        favorite: newNote.favorite ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueryData<Note[]>(["notes"], (old = []) => [
        optimistic,
        ...old,
      ]);

      return { previous };
    },
    onError: (err, newNote, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notes"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useUpdateNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateNotePayload;
    }) => {
      return apiClient.put<Note>(`/notes/${id}`, payload);
    },
    onMutate: async ({ id, payload }) => {
      sound.playClick(750);
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previous = queryClient.getQueryData<Note[]>(["notes"]);

      queryClient.setQueryData<Note[]>(["notes"], (old = []) =>
        old.map((item) =>
          item.id === id ? ({ ...item, ...payload, updatedAt: new Date().toISOString() } as Note) : item
        )
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notes"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useToggleNoteFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      favorite,
    }: {
      id: string;
      favorite: boolean;
    }) => {
      return apiClient.put<Note>(`/notes/${id}`, { favorite });
    },
    onMutate: async ({ id, favorite }) => {
      sound.playClick(favorite ? 850 : 600);
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previous = queryClient.getQueryData<Note[]>(["notes"]);

      queryClient.setQueryData<Note[]>(["notes"], (old = []) =>
        old.map((item) => (item.id === id ? { ...item, favorite } : item))
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notes"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}

export function useDeleteNote() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<{ id: string; message: string }>(`/notes/${id}`);
    },
    onMutate: async (id) => {
      sound.playClick(400);
      await queryClient.cancelQueries({ queryKey: ["notes"] });
      const previous = queryClient.getQueryData<Note[]>(["notes"]);

      queryClient.setQueryData<Note[]>(["notes"], (old = []) =>
        old.filter((item) => item.id !== id)
      );

      return { previous };
    },
    onError: (err, id, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["notes"], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["notes"] });
    },
  });
}
