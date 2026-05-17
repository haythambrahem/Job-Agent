export const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export class ApiError extends Error {
  code?: string;
  status?: number;
}

export async function apiFetch<T>(
  path: string,
  apiToken: string,
  init: RequestInit = {}
): Promise<T> {
  if (!apiToken) {
    const error = new ApiError("Unauthorized");
    error.status = 401;
    throw error;
  }

  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${apiToken}`);

  if (!(init.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    credentials: "include",
    headers
  });

  if (!response.ok) {
    let body: unknown = null;
    try {
      body = await response.json();
    } catch {
      body = null;
    }

    const message =
      typeof body === "object" && body && "message" in body && typeof (body as { message?: unknown }).message === "string"
        ? (body as { message: string }).message
        : typeof body === "object" && body && "error" in body && typeof (body as { error?: unknown }).error === "string"
          ? (body as { error: string }).error
          : "Request failed";

    const error = new ApiError(message);
    if (typeof body === "object" && body) {
      const codeValue = (body as { code?: unknown; error?: unknown }).code;
      const errorValue = (body as { error?: unknown }).error;
      error.code = typeof codeValue === "string" ? codeValue : typeof errorValue === "string" ? errorValue : undefined;
    }
    error.status = response.status;
    throw error;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
