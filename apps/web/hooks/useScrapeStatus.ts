import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch, type ApiError } from "./apiClient";
import type { ScrapeStatus } from "./types";

export function useScrapeStatus(
  apiToken: string,
  jobId: string | null,
  options?: Omit<UseQueryOptions<ScrapeStatus, ApiError>, "queryKey" | "queryFn">
) {
  return useQuery<ScrapeStatus, ApiError>({
    queryKey: ["scrape-status", jobId],
    enabled: Boolean(jobId),
    queryFn: () => apiFetch<ScrapeStatus>(`/scrape/status/${jobId}`, apiToken),
    refetchInterval: (data) => {
      if (!data) return 2000;
      if (data.status === "completed" || data.status === "failed") return false;
      return 2000;
    },
    ...options
  });
}
