import type { UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "./apiClient";
import type { DashboardOverview, Job } from "./types";
import { useDashboardOverview } from "./useDashboardOverview";

export function useJobs(
  apiToken: string,
  userId: string,
  options?: Omit<UseQueryOptions<DashboardOverview, ApiError, Job[]>, "queryKey" | "queryFn">
) {
  return useDashboardOverview(apiToken, userId, {
    ...options,
    select: (data) => data.jobs
  });
}
