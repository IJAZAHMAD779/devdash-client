"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";
import { SearchResponse, SearchEntityType } from "@/types/search";

export function useGlobalSearch(query: string, type: SearchEntityType = "ALL") {
  return useQuery<SearchResponse>({
    queryKey: ["global-search", query, type],
    queryFn: async () => {
      if (!query || query.trim().length < 2) {
        return { query: "", results: [] };
      }

      const params = new URLSearchParams({
        q: query.trim(),
        type,
      });

      return apiClient.get<SearchResponse>(`/search?${params.toString()}`);
    },
    enabled: query.trim().length >= 2,
    staleTime: 30000,
  });
}
