"use client";

import { useCallback, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch, ApiError } from "@/hooks/apiClient";
import type { GmailStatus } from "@/hooks/types";

export default function GmailConnect({ apiToken }: { apiToken: string }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const [connectError, setConnectError] = useState<string | null>(null);

  const authToken = session?.accessToken ?? apiToken;
  const hasAuth = Boolean(authToken);

  const statusQuery = useQuery<GmailStatus, ApiError>({
    queryKey: ["gmail-status", authToken],
    enabled: hasAuth,
    queryFn: () => apiFetch<GmailStatus>("/gmail/status", authToken ?? "")
  });

  const status = statusQuery.data ?? { connected: false };
  const loading = hasAuth ? statusQuery.isLoading : false;

  const connectMutation = useMutation({
    mutationFn: async () => apiFetch<{ url?: string }>("/gmail/connect", authToken ?? "", { headers: { Accept: "application/json" } })
  });

  const disconnectMutation = useMutation({
    mutationFn: async () => apiFetch("/gmail/disconnect", authToken ?? "", { method: "DELETE" })
  });

  const gmailParam = searchParams.get("gmail");

  const handleConnect = useCallback(
    () =>
      async () => {
        if (!authToken) {
          setConnectError("Your session has expired. Please sign in again and retry.");
          return;
        }

        setConnectError(null);

        try {
          const data = await connectMutation.mutateAsync();
          if (!data.url) {
            setConnectError("Could not start Gmail connection. Please try again.");
            return;
          }
          window.location.href = data.url;
        } catch (error) {
          if (error instanceof ApiError && error.status === 401) {
            setConnectError("Your session has expired. Please sign in again and retry.");
            return;
          }
          setConnectError("Could not start Gmail connection. Please try again.");
        }
      },
    [authToken, connectMutation]
  );

  const handleDisconnect = useCallback(
    () =>
      async () => {
        if (!confirm("Disconnect Gmail? You will not be able to apply until reconnected.")) return;
        if (!authToken) {
          setConnectError("Your session has expired. Please sign in again and retry.");
          return;
        }

        try {
          await disconnectMutation.mutateAsync();
          queryClient.setQueryData(["gmail-status", authToken], { connected: false });
        } catch {
          setConnectError("Failed to disconnect Gmail. Please try again.");
        }
      },
    [authToken, disconnectMutation, queryClient]
  );

  if (loading) return <div>Loading Gmail status...</div>;

  return (
    <div
      style={{
        border: "0.5px solid var(--color-border-tertiary)",
        borderRadius: "var(--border-radius-lg)",
        padding: "20px",
        background: "var(--color-background-primary)"
      }}
    >
      {gmailParam === "connected" && (
        <div style={{ color: "var(--color-text-success)", fontSize: 13, marginBottom: 12 }}>
          Gmail connected successfully.
        </div>
      )}
      {gmailParam === "error" && (
        <div style={{ color: "var(--color-text-danger)", fontSize: 13, marginBottom: 12 }}>
          Connection failed. Please try again.
        </div>
      )}
      {gmailParam === "denied" && (
        <div style={{ color: "var(--color-text-danger)", fontSize: 13, marginBottom: 12 }}>
          Permission denied. Please try again.
        </div>
      )}
      {connectError && (
        <div style={{ color: "var(--color-text-danger)", fontSize: 13, marginBottom: 12 }}>
          {connectError}
        </div>
      )}

      {status.connected ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Gmail connected</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 3 }}>{status.email}</div>
          </div>
          <button
            onClick={() => {
              void handleDisconnect();
            }}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              border: "0.5px solid var(--color-border-danger)",
              borderRadius: "var(--border-radius-md)",
              color: "var(--color-text-danger)",
              background: "transparent",
              cursor: "pointer"
            }}
          >
            Disconnect
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 500 }}>Connect your Gmail</div>
            <div style={{ fontSize: 12, color: "var(--color-text-secondary)", marginTop: 3 }}>
              Required to send applications from your email address
            </div>
          </div>
          <button
            onClick={() => {
              void handleConnect();
            }}
            disabled={connectMutation.isPending}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              background: "#378ADD",
              color: "#fff",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              cursor: connectMutation.isPending ? "not-allowed" : "pointer",
              opacity: connectMutation.isPending ? 0.7 : 1
            }}
          >
            {connectMutation.isPending ? "Connecting..." : "Connect Gmail"}
          </button>
        </div>
      )}
    </div>
  );
}
