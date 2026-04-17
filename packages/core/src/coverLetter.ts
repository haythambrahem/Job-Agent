import Groq from "groq-sdk";
import type { GenerateCoverLetterInput } from "./types.js";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const DEFAULT_CV_SUMMARY = "Développeur full-stack, Java, Spring Boot, Angular, 3 ans d'expérience";

export interface CoverLetterContent {
  subject: string;
  opening: string;
  body: string;
  closing: string;
}

function fallbackCoverLetter(input: GenerateCoverLetterInput): CoverLetterContent {
  return {
    subject: `Application for ${input.jobTitle} — Haytham Brahem`,
    opening: `Dear Hiring Manager at ${input.company},`,
    body: `I am applying for the ${input.jobTitle} role at ${input.company}. With hands-on full-stack experience in Spring Boot and Angular, I can contribute quickly to product delivery and maintainable solutions.\n\nI would welcome the opportunity to discuss how my experience aligns with your team’s goals.`,
    closing: "Thank you for your time and consideration."
  };
}

function parseCoverLetterContent(raw: string, input: GenerateCoverLetterInput): CoverLetterContent {
  const trimmed = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/\s*```$/, "");

  try {
    const parsed = JSON.parse(trimmed) as Partial<CoverLetterContent>;
    if (typeof parsed.subject === "string" && typeof parsed.opening === "string" && typeof parsed.body === "string" && typeof parsed.closing === "string") {
      return {
        subject: parsed.subject.trim(),
        opening: parsed.opening.trim(),
        body: parsed.body.trim(),
        closing: parsed.closing.trim()
      };
    }
  } catch {
    // fall through to fallback
  }

  return fallbackCoverLetter(input);
}

export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<CoverLetterContent> {
  const cvSummary = input.cvSummary || DEFAULT_CV_SUMMARY;

  if (!groq) {
    return fallbackCoverLetter(input);
  }

  const prompt = `You are writing a professional job application email content.
Return ONLY a valid JSON object with this exact shape and keys:
{"subject":"Application for ${input.jobTitle} — Haytham Brahem","opening":"...","body":"...","closing":"..."}

Rules:
- No markdown, no code fences, no extra keys
- "opening": one sentence greeting addressed to hiring manager or company
- "body": maximum 3 short paragraphs in plain text (use \\n\\n between paragraphs)
- "closing": one single closing sentence
- Keep professional and concise

Role: ${input.jobTitle}
Company: ${input.company}
Job description: ${input.jobDescription.slice(0, 800)}
CV summary: ${cvSummary.slice(0, 800)}`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 280,
      temperature: 0.4
    });

    const raw = response.choices[0]?.message?.content?.trim() || "";
    return parseCoverLetterContent(raw, input);
  } catch {
    return fallbackCoverLetter(input);
  }
}
