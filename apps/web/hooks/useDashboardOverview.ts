import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch, type ApiError } from "./apiClient";
import type { DashboardOverview } from "./types";

export function useDashboardOverview<TData = DashboardOverview>(
  apiToken: string,
  userId: string,
  options?: Omit<UseQueryOptions<DashboardOverview, ApiError, TData>, "queryKey" | "queryFn">
) {
  return useQuery<DashboardOverview, ApiError, TData>({
    queryKey: ["dashboard-overview", userId],
    queryFn: () => apiFetch<DashboardOverview>("/dashboard/overview", apiToken),
    ...options
  });
}
