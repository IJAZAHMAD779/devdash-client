"use client";

import { useQuery, useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";

export interface DigestPreviewResponse {
  html: string;
  stats: {
    completedTasks: { id: string; title: string; completedAt: string | null }[];
    pendingTasksCount: number;
    activeProjects: { id: string; title: string; status: string }[];
    newSnippetsCount: number;
    newComponentsCount: number;
    weekStart: string;
    weekEnd: string;
  };
}

export interface DigestSendResponse {
  recipient: string;
  deliveredAt: string;
  mode: "live" | "simulated";
  emailId?: string;
}

export function useDigestPreview(enabled = false) {
  return useQuery<DigestPreviewResponse>({
    queryKey: ["digest-preview"],
    queryFn: async () => {
      return apiClient.get<DigestPreviewResponse>("/digest/preview");
    },
    enabled,
  });
}

export function useSendDigest() {
  return useMutation({
    mutationFn: async () => {
      return apiClient.post<DigestSendResponse>("/digest/send", {});
    },
    onSuccess: () => {
      sound.playSuccess();
    },
    onError: () => {
      sound.playClick(400);
    },
  });
}
