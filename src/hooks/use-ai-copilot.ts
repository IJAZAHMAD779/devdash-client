"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { sound } from "@/lib/audio";
import {
  AiCommandPayload,
  AiCommandResponse,
  AiStatusResponse,
} from "@/types/ai";

export function useAiStatus() {
  return useQuery<AiStatusResponse>({
    queryKey: ["ai-status"],
    queryFn: async () => {
      return apiClient.get<AiStatusResponse>("/ai/status");
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    retry: 1,
  });
}

export function useExecuteAiCommand() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: { message: string; history?: any[] }) => {
      const clientTime = new Date().toISOString();
      let timezone = "UTC";
      try {
        timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      } catch {
        // fallback
      }

      const body: AiCommandPayload = {
        message: payload.message,
        clientTime,
        timezone,
        history: payload.history,
      };

      return apiClient.post<AiCommandResponse>("/ai/command", body);
    },
    onSuccess: (data) => {
      sound.playSuccess();

      // Invalidate relevant query keys so newly created entities appear immediately
      if (data.actions && data.actions.length > 0) {
        for (const action of data.actions) {
          if (action.type === "TASK") {
            queryClient.invalidateQueries({ queryKey: ["tasks"] });
          } else if (action.type === "REMINDER") {
            queryClient.invalidateQueries({ queryKey: ["reminders"] });
          } else if (action.type === "NOTE") {
            queryClient.invalidateQueries({ queryKey: ["notes"] });
          } else if (action.type === "SNIPPET") {
            queryClient.invalidateQueries({ queryKey: ["snippets"] });
          } else if (action.type === "BOOKMARK") {
            queryClient.invalidateQueries({ queryKey: ["bookmarks"] });
          }
        }
        // Always refresh recent projects and activity
        queryClient.invalidateQueries({ queryKey: ["projects"] });
        queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
      }
    },
    onError: () => {
      sound.playClick(300);
    },
  });
}
