"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";

interface GmailStatus {
  connected: boolean;
  email?: string;
  expiresAt?: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function GmailConnect({ apiToken }: { apiToken: string }) {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<GmailStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const headers = useMemo(
    () => ({
      Authorization: `Bearer ${apiToken}`
    }),
    [apiToken]
  );

  useEffect(() => {
    if (!apiToken) {
      setLoading(false);
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
  }, [apiToken, headers]);

  const gmailParam = searchParams.get("gmail");

  const handleConnect = () => {
    window.location.href = `${API_BASE_URL}/gmail/connect`;
  };

  const handleDisconnect = async () => {
    if (!confirm("Disconnect Gmail? You will not be able to apply until reconnected.")) return;
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
            onClick={handleConnect}
            style={{
              fontSize: 12,
              padding: "6px 14px",
              background: "#378ADD",
              color: "#fff",
              border: "none",
              borderRadius: "var(--border-radius-md)",
              cursor: "pointer"
            }}
          >
            Connect Gmail
          </button>
        </div>
      )}
    </div>
  );
}
