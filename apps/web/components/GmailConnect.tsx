"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";

interface GmailStatus {
  connected: boolean;
  email?: string;
  expiresAt?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function GmailConnect({ apiToken }: { apiToken: string }) {
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connectLoading, setConnectLoading] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);

  const authToken = session?.accessToken ?? apiToken;
  const headers = useMemo(() => {
    if (!authToken) return null;
    return {
      Authorization: `Bearer ${authToken}`
    };
  }, [authToken]);

  useEffect(() => {
    if (!headers) {
      setLoading(false);
      setStatus({ connected: false });
      return;
    }

    void fetch(`${API_BASE_URL}/gmail/status`, { headers })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load Gmail status");
        }
        return response.json() as Promise<GmailStatus>;
      })
      .then(setStatus)
      .catch(() => setStatus({ connected: false }))
      .finally(() => setLoading(false));
  }, [headers]);

  const gmailParam = searchParams.get("gmail");

  const handleConnect = async () => {
    if (!headers) {
      setConnectError("Your session has expired. Please sign in again and retry.");
      return;
    }

    setConnectLoading(true);
    setConnectError(null);

    try {
      const response = await fetch(`${API_BASE_URL}/gmail/connect`, {
        headers: {
          ...headers,
          Accept: "application/json"
        }
      });

      if (response.status === 401) {
        setConnectError("Your session has expired. Please sign in again and retry.");
        return;
      }

      if (!response.ok) {
        setConnectError("Could not start Gmail connection. Please try again.");
        return;
      }

      const data = (await response.json()) as { url?: string };
      if (!data.url) {
        setConnectError("Could not start Gmail connection. Please try again.");
        return;
      }

      window.location.href = data.url;
    } catch {
      setConnectError("Could not start Gmail connection. Please try again.");
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Gmail? You will not be able to apply until reconnected.")) return;
    if (!headers) {
      setConnectError("Your session has expired. Please sign in again and retry.");
      return;
    }
    await fetch(`${API_BASE_URL}/gmail/disconnect`, { method: "DELETE", headers });
    setStatus({ connected: false });
  };

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

      {status?.connected ? (
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
            disabled={connectLoading}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              background: "#378ADD",
              color: "#fff",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              cursor: connectLoading ? "not-allowed" : "pointer",
              opacity: connectLoading ? 0.7 : 1
            }}
          >
            {connectLoading ? "Connecting..." : "Connect Gmail"}
          </button>
        </div>
      )}
    </div>
  );
}
