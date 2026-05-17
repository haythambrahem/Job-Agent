"use client";

import dynamic from "next/dynamic";
import { useRef, useState, type FormEvent } from "react";
import { useSession } from "next-auth/react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import Input from "@/components/ui/Input";
import Alert from "@/components/ui/Alert";
import Badge from "@/components/ui/Badge";
import { apiFetch } from "@/hooks/apiClient";
import { useProfile } from "@/hooks/useProfile";
import type { Profile } from "@/hooks/types";

const GmailConnect = dynamic(() => import("./GmailConnect"), {
  ssr: false,
  loading: () => <div>Loading Gmail integration...</div>
});

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:4000";

export default function ProfileClient({
  initialProfile,
  apiToken
}: {
  initialProfile: Profile;
  apiToken: string;
}) {
  const { update: updateSession } = useSession();
  const queryClient = useQueryClient();
  const [alert, setAlert] = useState<{ msg: string; type: "success" | "error" } | null>(null);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const cvInputRef = useRef<HTMLInputElement>(null);

  const profileQuery = useProfile(apiToken, initialProfile.id, { initialData: initialProfile });
  const profile = profileQuery.data;

  const showAlert = (msg: string, type: "success" | "error" = "success") => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  const updateProfileMutation = useMutation({
    mutationFn: async (payload: { name: string; phone: string; location: string }) =>
      apiFetch<Pick<Profile, "name" | "phone" | "location">>("/profile", apiToken, {
        method: "PATCH",
        body: JSON.stringify(payload)
      })
  });

  const avatarMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("avatar", file);
      return apiFetch<{ image: string }>("/profile/avatar", apiToken, { method: "POST", body: form });
    }
  });

  const cvMutation = useMutation({
    mutationFn: async (file: File) => {
      const form = new FormData();
      form.append("cv", file);
      return apiFetch<Pick<Profile, "cvPath" | "cvOriginalName" | "cvUploadedAt">>("/profile/cv", apiToken, {
        method: "POST",
        body: form
      });
    }
  });

  const savePersonalInfo = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const body = {
      name: String(form.get("name") ?? ""),
      phone: String(form.get("phone") ?? ""),
      location: String(form.get("location") ?? "")
    };

    try {
      const data = await updateProfileMutation.mutateAsync(body);
      queryClient.setQueryData<Profile>(["profile", initialProfile.id], (current) =>
        current ? { ...current, ...data } : current
      );
      await updateSession({ name: data.name ?? undefined });
      showAlert("Profile updated successfully");
    } catch {
      showAlert("Failed to save changes", "error");
    }
  };

  const uploadAvatar = async (file: File) => {
    try {
      const { image } = await avatarMutation.mutateAsync(file);
      queryClient.setQueryData<Profile>(["profile", initialProfile.id], (current) =>
        current ? { ...current, image } : current
      );
      await updateSession({ image });
      showAlert("Profile photo updated");
    } catch {
      showAlert("Photo upload failed", "error");
    }
  };

  const uploadCv = async (file: File) => {
    if (file.type !== "application/pdf") {
      showAlert("Only PDF files are accepted", "error");
      return;
    }

    try {
      const data = await cvMutation.mutateAsync(file);
      queryClient.setQueryData<Profile>(["profile", initialProfile.id], (current) =>
        current ? { ...current, ...data } : current
      );
      showAlert("CV uploaded and ready to use");
    } catch {
      showAlert("CV upload failed", "error");
    }
  };

  if (!profile) {
    return <div>Loading profile...</div>;
  }

  const isSaving = updateProfileMutation.isPending;
  const isUploading = avatarMutation.isPending || cvMutation.isPending;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Profile Settings</h1>
        <p className="text-gray-600">Manage your account information and preferences</p>
      </div>

      {alert && <Alert type={alert.type} message={alert.msg} onClose={() => setAlert(null)} />}

      {/* Account Overview */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Account Overview</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-blue-500 to-emerald-500 flex items-center justify-center text-white font-bold text-2xl mb-4 overflow-hidden">
              {profile.image ? (
                <img
                  src={profile.image}
                  alt={profile.name || "Avatar"}
                  className="w-full h-full object-cover"
                />
              ) : (
                profile.name?.charAt(0).toUpperCase() || profile.email.charAt(0).toUpperCase()
              )}
            </div>
            <h3 className="text-lg font-bold text-gray-900">{profile.name || "Not set"}</h3>
            <p className="text-sm text-gray-600">{profile.email}</p>
            <div className="mt-4">
              <Badge variant="primary">{profile.plan?.toUpperCase() || "FREE"}</Badge>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Phone</p>
                <p className="text-gray-900 font-medium">{profile.phone || "Not provided"}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Location</p>
                <p className="text-gray-900 font-medium">{profile.location || "Not provided"}</p>
              </div>
            </div>
          </div>

          <div className="flex flex-col justify-center">
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Subscription</p>
                <Badge
                  variant={profile.subscriptionStatus === "active" ? "success" : "warning"}
                >
                  {profile.subscriptionStatus || "inactive"}
                </Badge>
              </div>
              <button
                onClick={() => avatarInputRef.current?.click()}
                className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
              >
                Change Photo
              </button>
              <input
                ref={avatarInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.currentTarget.files?.[0];
                  if (file) uploadAvatar(file);
                }}
                disabled={isUploading}
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Personal Information */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Personal Information</h2>
        <form onSubmit={savePersonalInfo} className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Full Name"
              type="text"
              name="name"
              placeholder="John Doe"
              defaultValue={profile.name ?? ""}
            />
            <Input
              label="Email"
              type="email"
              value={profile.email}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Phone Number"
              type="tel"
              name="phone"
              placeholder="+1 (555) 123-4567"
              defaultValue={profile.phone ?? ""}
            />
            <Input
              label="Location"
              type="text"
              name="location"
              placeholder="San Francisco, CA"
              defaultValue={profile.location ?? ""}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isSaving}
            loadingText="Saving..."
            className="w-full"
          >
            Save Changes
          </Button>
        </form>
      </Card>

      {/* CV Management */}
      <Card>
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Resume (CV)</h2>
        <div className="space-y-4">
          {profile.cvPath ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900 mb-1">
                    📄 {profile.cvOriginalName}
                  </p>
                  <p className="text-sm text-gray-600">
                    Uploaded {new Date(profile.cvUploadedAt || "").toLocaleDateString()}
                  </p>
                </div>
                <a
                  href={`${API_BASE_URL}${profile.cvPath}`}
                  className="text-blue-600 hover:text-blue-700 font-medium text-sm transition-colors"
                  target="_blank"
                  rel="noreferrer"
                >
                  Download
                </a>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-gray-700">No CV uploaded yet.</p>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            onClick={() => cvInputRef.current?.click()}
            isLoading={isUploading}
            loadingText="Uploading..."
            className="w-full"
          >
            {profile.cvPath ? "Update CV" : "Upload CV (PDF)"}
          </Button>
          <input
            ref={cvInputRef}
            type="file"
            accept=".pdf"
            className="hidden"
            onChange={(e) => {
              const file = e.currentTarget.files?.[0];
              if (file) uploadCv(file);
            }}
            disabled={isUploading}
          />
          <p className="text-xs text-gray-500">Only PDF files are accepted. Maximum size: 10MB</p>
        </div>
      </Card>

      {/* Gmail Integration */}
      <GmailConnect apiToken={apiToken} />

      {/* Danger Zone */}
      <Card className="border-2 border-red-200 bg-red-50">
        <h2 className="text-2xl font-bold text-red-900 mb-4">Danger Zone</h2>
        <p className="text-red-700 mb-6">
          These actions are irreversible. Please proceed with caution.
        </p>
        <Button variant="danger" className="w-full">
          Delete Account
        </Button>
      </Card>
    </div>
  );
}
