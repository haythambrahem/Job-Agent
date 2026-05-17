import type { CoverLetterContent } from "@job-agent/core";

export function parseCoverLetterContent(
  coverLetterJson: string,
  fallbackTitle: string,
  fallbackCompany: string
): CoverLetterContent {
  try {
    const parsed = JSON.parse(coverLetterJson) as Partial<CoverLetterContent>;
    if (
      typeof parsed.subject === "string" &&
      typeof parsed.opening === "string" &&
      typeof parsed.body === "string" &&
      typeof parsed.closing === "string"
    ) {
      return {
        subject: parsed.subject,
        opening: parsed.opening,
        body: parsed.body,
        closing: parsed.closing
      };
    }
  } catch {
    // fallback below
  }

  return {
    subject: `Application for ${fallbackTitle} — Haytham Brahem`,
    opening: `Dear Hiring Manager at ${fallbackCompany},`,
    body: coverLetterJson,
    closing: "Thank you for your time and consideration."
  };
}
