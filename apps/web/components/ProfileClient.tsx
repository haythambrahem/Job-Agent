"use client";

import { useRef, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";

interface Profile {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  phone: string | null;
  location: string | null;
  plan: string;
  subscriptionStatus: string;
  cvPath: string | null;
  cvOriginalName: string | null;
  cvUploadedAt: string | null;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function ProfileClient({ initialProfile, apiToken }: { initialProfile: Profile; apiToken: string }) {
  const { update: updateSession } = useSession();
  const [profile, setProfile] = useState<Profile>(initialProfile);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const showToast = (msg: string, type: "success" | "error" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const apiCall = async (path: string, options: RequestInit) => {
    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${apiToken}`,
        ...(options.headers ?? {})
      }
    });
  };

  const savePersonalInfo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      location: String(form.get("location") ?? "")
    };
    const res = await apiCall("/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    setSaving(false);
    if (res.ok) {
      const data = (await res.json()) as Pick<Profile, "name" | "phone" | "location">;
      setProfile((p) => ({ ...p, ...data }));
      await updateSession({ name: data.name ?? undefined });
      showToast("Profile updated successfully");
    } else {
      showToast("Failed to save changes", "error");
    }
  };

  const uploadAvatar = async (file: File) => {
    const form = new FormData();
    form.append("avatar", file);
    const res = await apiCall("/profile/avatar", { method: "POST", body: form });
    if (res.ok) {
      const { image } = (await res.json()) as { image: string };
      setProfile((p) => ({ ...p, image }));
      await updateSession({ image });
      showToast("Profile photo updated");
    } else {
      showToast("Photo upload failed", "error");
    }
  };

  const uploadCv = async (file: File) => {
    if (file.type !== "application/pdf") {
      showToast("Only PDF files are accepted", "error");
      return;
    }
    const form = new FormData();
    form.append("cv", file);
    const res = await apiCall("/profile/cv", { method: "POST", body: form });
    if (res.ok) {
      const data = (await res.json()) as Pick<Profile, "cvPath" | "cvOriginalName" | "cvUploadedAt">;
      setProfile((p) => ({ ...p, ...data }));
      showToast("CV uploaded and ready to use");
    } else {
      showToast("CV upload failed", "error");
    }
  };

  const removeCv = async () => {
    if (!confirm("Remove your CV? You will need to upload a new one to apply.")) return;
    const res = await apiCall("/profile/cv", { method: "DELETE" });
    if (res.ok) {
      setProfile((p) => ({ ...p, cvPath: null, cvOriginalName: null, cvUploadedAt: null }));
      showToast("CV removed");
    }
  };

  const changePassword = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const newPassword = String(form.get("newPassword") ?? "");
    const confirmPassword = String(form.get("confirmPassword") ?? "");
    if (newPassword !== confirmPassword) {
      showToast("Passwords do not match", "error");
      return;
    }
    if (newPassword.length < 8) {
      showToast("Password must be at least 8 characters", "error");
      return;
    }
    const res = await apiCall("/profile/password", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        currentPassword: String(form.get("currentPassword") ?? ""),
        newPassword
      })
    });
    if (res.ok) {
      e.currentTarget.reset();
      showToast("Password updated successfully");
    } else {
      const err = (await res.json().catch(() => ({ error: "Failed to update password" }))) as { error?: string };
      showToast(err.error ?? "Failed to update password", "error");
    }
  };

  const initials = profile.name
    ? profile.name
      .split(" ")
      .map((n) => n[0] ?? "")
      .join("")
      .toUpperCase()
      .slice(0, 2)
    : (profile.email[0] ?? "U").toUpperCase();

  return (
    <div style={{ display: "grid", gap: 16, maxWidth: 840 }}>
      {toast ? (
        <p style={{ margin: 0, color: toast.type === "error" ? "#dc2626" : "#0a66c2" }}>
          {toast.msg}
        </p>
      ) : null}

      <section style={{ background: "white", borderRadius: 12, padding: 16 }}>
        <h2>Personal info</h2>
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
          {profile.image ? (
            <img src={`${API_BASE_URL}${profile.image}`} alt="Avatar" width={64} height={64} style={{ borderRadius: "50%" }} />
          ) : (
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: "50%",
                background: "#1e293b",
                color: "white",
                display: "grid",
                placeItems: "center"
              }}
            >
              {initials}
            </div>
          )}
          <button type="button" onClick={() => avatarInputRef.current?.click()}>Upload photo</button>
          <input
            ref={avatarInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadAvatar(file);
            }}
          />
        </div>
        <form onSubmit={savePersonalInfo} style={{ display: "grid", gap: 10 }}>
          <input name="name" placeholder="Full name" defaultValue={profile.name ?? ""} />
          <input name="email" value={profile.email} disabled />
          <input name="phone" placeholder="Phone" defaultValue={profile.phone ?? ""} />
          <input name="location" placeholder="Location" defaultValue={profile.location ?? ""} />
          <button type="submit" disabled={saving}>{saving ? "Saving..." : "Save changes"}</button>
        </form>
      </section>

      <section style={{ background: "white", borderRadius: 12, padding: 16 }}>
        <h2>CV</h2>
        {profile.cvPath ? (
          <p>
            Current file: <strong>{profile.cvOriginalName ?? "CV"}</strong>
            {profile.cvUploadedAt ? ` · ${new Date(profile.cvUploadedAt).toLocaleString()}` : ""}
          </p>
        ) : (
          <p>No CV uploaded yet.</p>
        )}
        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={() => cvInputRef.current?.click()}>
            {profile.cvPath ? "Replace CV" : "Upload CV"}
          </button>
          {profile.cvPath ? <button type="button" onClick={removeCv}>Remove CV</button> : null}
          <input
            ref={cvInputRef}
            type="file"
            accept="application/pdf"
            style={{ display: "none" }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void uploadCv(file);
            }}
          />
        </div>
      </section>

      <section style={{ background: "white", borderRadius: 12, padding: 16 }}>
        <h2>Change password</h2>
        <form onSubmit={changePassword} style={{ display: "grid", gap: 10 }}>
          <input name="currentPassword" type="password" placeholder="Current password" required />
          <input name="newPassword" type="password" placeholder="New password" required minLength={8} />
          <input name="confirmPassword" type="password" placeholder="Confirm new password" required minLength={8} />
          <button type="submit">Update password</button>
        </form>
      </section>

      <section style={{ background: "white", borderRadius: 12, padding: 16, border: "1px solid #fecaca" }}>
        <h2 style={{ color: "#b91c1c" }}>Danger zone</h2>
        <p style={{ marginTop: 0 }}>Account deletion is not enabled yet.</p>
        <button type="button" disabled>Delete account</button>
      </section>
    </div>
  );
}
