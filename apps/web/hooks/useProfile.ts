import { useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { apiFetch, type ApiError } from "./apiClient";
import type { Profile } from "./types";

export function useProfile(
  apiToken: string,
  userId: string,
  options?: Omit<UseQueryOptions<Profile, ApiError>, "queryKey" | "queryFn">
) {
  return useQuery<Profile, ApiError>({
    queryKey: ["profile", userId],
    queryFn: () => apiFetch<Profile>("/profile", apiToken),
    ...options
  });
}
