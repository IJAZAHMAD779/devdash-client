"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";
import {
  UIComponentItem,
  CreateComponentPayload,
  UpdateComponentPayload,
  ComponentFramework,
  ComponentStyling,
  SynthesizedComponentResult,
} from "@/types/component";

interface ComponentQueryParams {
  framework?: ComponentFramework;
  styling?: ComponentStyling;
  category?: string;
  projectId?: string;
  favorite?: boolean;
  search?: string;
}

export function useUIComponents(params?: ComponentQueryParams) {
  return useQuery<UIComponentItem[]>({
    queryKey: ["components", params],
    queryFn: async () => {
      const searchParams = new URLSearchParams();
      if (params?.framework) searchParams.append("framework", params.framework);
      if (params?.styling) searchParams.append("styling", params.styling);
      if (params?.category && params.category !== "ALL") searchParams.append("category", params.category);
      if (params?.projectId) searchParams.append("projectId", params.projectId);
      if (params?.favorite !== undefined)
        searchParams.append("favorite", String(params.favorite));
      if (params?.search && params.search.trim())
        searchParams.append("search", params.search.trim());

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : "";
      return apiClient.get<UIComponentItem[]>(`/components${queryStr}`);
    },
  });
}

export function useCreateComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateComponentPayload) => {
      return apiClient.post<UIComponentItem>("/components", payload);
    },
    onMutate: async (newComp) => {
      sound.playClick(900);
      await queryClient.cancelQueries({ queryKey: ["components"] });
      const previousComps = queryClient.getQueryData<UIComponentItem[]>([
        "components",
      ]);

      const optimisticComp: UIComponentItem = {
        id: `optimistic-${Date.now()}`,
        userId: "user_current",
        projectId: newComp.projectId ?? null,
        name: newComp.name,
        description: newComp.description ?? null,
        category: newComp.category || "general",
        framework: newComp.framework ?? "REACT",
        styling: newComp.styling ?? "TAILWIND",
        code: newComp.code,
        previewCode: newComp.previewCode ?? null,
        tags: newComp.tags ?? [],
        favorite: newComp.favorite ?? false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      queryClient.setQueriesData<UIComponentItem[]>(
        { queryKey: ["components"] },
        (old) => {
          return old ? [optimisticComp, ...old] : [optimisticComp];
        }
      );

      return { previousComps };
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: (_err, _newComp, context) => {
      if (context?.previousComps) {
        queryClient.setQueriesData(
          { queryKey: ["components"] },
          context.previousComps
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useUpdateComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      payload,
    }: {
      id: string;
      payload: UpdateComponentPayload;
    }) => {
      return apiClient.put<UIComponentItem>(`/components/${id}`, payload);
    },
    onMutate: async ({ id, payload }) => {
      sound.playClick();
      await queryClient.cancelQueries({ queryKey: ["components"] });
      const previousComps = queryClient.getQueryData<UIComponentItem[]>([
        "components",
      ]);

      queryClient.setQueriesData<UIComponentItem[]>(
        { queryKey: ["components"] },
        (old) => {
          if (!old) return [];
          return old.map((c) =>
            c.id === id ? { ...c, ...payload, updatedAt: new Date().toISOString() } : c
          );
        }
      );

      return { previousComps };
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: (_err, _vars, context) => {
      if (context?.previousComps) {
        queryClient.setQueriesData(
          { queryKey: ["components"] },
          context.previousComps
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export function useToggleComponentFavorite() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, favorite }: { id: string; favorite: boolean }) => {
      return apiClient.put<UIComponentItem>(`/components/${id}`, { favorite });
    },
    onMutate: async ({ id, favorite }) => {
      sound.playClick(favorite ? 850 : 500);
      await queryClient.cancelQueries({ queryKey: ["components"] });
      const previousComps = queryClient.getQueryData<UIComponentItem[]>([
        "components",
      ]);

      queryClient.setQueriesData<UIComponentItem[]>(
        { queryKey: ["components"] },
        (old) => {
          if (!old) return [];
          return old.map((c) => (c.id === id ? { ...c, favorite } : c));
        }
      );

      return { previousComps };
    },
    onError: (_err, _vars, context) => {
      if (context?.previousComps) {
        queryClient.setQueriesData(
          { queryKey: ["components"] },
          context.previousComps
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
    },
  });
}

export function useDeleteComponent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/components/${id}`);
    },
    onMutate: async (id) => {
      sound.playClick(400);
      await queryClient.cancelQueries({ queryKey: ["components"] });
      const previousComps = queryClient.getQueryData<UIComponentItem[]>([
        "components",
      ]);

      queryClient.setQueriesData<UIComponentItem[]>(
        { queryKey: ["components"] },
        (old) => {
          if (!old) return [];
          return old.filter((c) => c.id !== id);
        }
      );

      return { previousComps };
    },
    onError: (_err, _id, context) => {
      if (context?.previousComps) {
        queryClient.setQueriesData(
          { queryKey: ["components"] },
          context.previousComps
        );
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["components"] });
      queryClient.invalidateQueries({ queryKey: ["projects"] });
    },
  });
}

export interface SynthesizePayload {
  code: string;
  targetFramework?: ComponentFramework;
  styling?: ComponentStyling;
}

export function useSynthesizeComponent() {
  return useMutation({
    mutationFn: async (payload: SynthesizePayload) => {
      return apiClient.post<SynthesizedComponentResult>(
        "/components/ai-synthesize",
        payload
      );
    },
  });
}

export interface GeneratePayload {
  prompt: string;
  category?: string;
  framework?: ComponentFramework;
  styling?: ComponentStyling;
}

export function useGenerateComponent() {
  return useMutation({
    mutationFn: async (payload: GeneratePayload) => {
      return apiClient.post<SynthesizedComponentResult>(
        "/components/ai-generate",
        payload
      );
    },
  });
}

