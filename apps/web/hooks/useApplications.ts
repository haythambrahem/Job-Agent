import type { UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "./apiClient";
import type { Application, DashboardOverview } from "./types";
import { useDashboardOverview } from "./useDashboardOverview";

export function useApplications(
  apiToken: string,
  userId: string,
  options?: Omit<UseQueryOptions<DashboardOverview, ApiError, Application[]>, "queryKey" | "queryFn">
) {
  return useDashboardOverview(apiToken, userId, {
    ...options,
    select: (data) => data.applications
  });
}
