import type { UseQueryOptions } from "@tanstack/react-query";
import type { ApiError } from "./apiClient";
import type { DashboardOverview, Subscription } from "./types";
import { useDashboardOverview } from "./useDashboardOverview";

export function useSubscription(
  apiToken: string,
  userId: string,
  options?: Omit<UseQueryOptions<DashboardOverview, ApiError, Subscription>, "queryKey" | "queryFn">
) {
  return useDashboardOverview(apiToken, userId, {
    ...options,
    select: (data) => data.subscription
  });
}
