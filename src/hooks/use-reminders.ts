"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { Reminder, CreateReminderInput } from "@/types/reminder";

export function useReminders() {
  return useQuery<Reminder[]>({
    queryKey: ["reminders"],
    queryFn: async () => {
      return apiClient.get<Reminder[]>("/reminders");
    },
    staleTime: 1000 * 30, // 30 seconds
  });
}

export function useCreateReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateReminderInput) => {
      return apiClient.post<Reminder>("/reminders", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}

export function useDeleteReminder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete<{ id: string }>(`/reminders/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["reminders"] });
    },
  });
}
