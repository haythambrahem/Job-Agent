import Groq from "groq-sdk";
import type { MatchResult } from "./types.js";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

const REQUIRED_SKILLS = [
  { label: "Java", pattern: /\bjava\b/i },
  { label: "Spring Boot", pattern: /\bspring\s*boot\b/i },
  { label: "Angular", pattern: /\bangular\b/i },
  { label: "APIs", pattern: /\bapi(s)?\b/i },
  { label: "Docker", pattern: /\bdocker\b/i }
];

function mergeSkills(primary: string[], secondary: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];
  for (const skill of [...primary, ...secondary]) {
    const trimmed = String(skill).trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(trimmed);
  }
  return merged;
}

function extractRequiredSkillMatches(jobText: string, cvText: string): string[] {
  return REQUIRED_SKILLS.filter((skill) => skill.pattern.test(jobText) && skill.pattern.test(cvText)).map((skill) => skill.label);
}

function parseMatchResponse(content: string): {
  score?: number;
  reasons?: unknown;
  matchedSkills?: unknown;
  matched_skills?: unknown;
} {
  const match = content.match(/\{[\s\S]*\}/);
  if (!match) return {};
  try {
    return JSON.parse(match[0]);
  } catch {
    return {};
  }
}

export async function matchJobToCV(jobDescription: string, cvText: string, jobTitle?: string): Promise<MatchResult> {
  if (!groq) {
    throw new Error("GROQ_API_KEY not configured");
  }

  try {
    const jobBlock = `${jobTitle ? `Title: ${jobTitle}\n` : ""}Description: ${jobDescription.slice(0, 1200)}`;
    const prompt = `You are a CV-to-job matching engine. Compare the job with the candidate CV and return JSON only.

Rules:
- Output must be valid JSON with keys: score (0-100), matchedSkills (string[]), reasons (string[]).
- Penalize irrelevant roles; only give scores >= 70 for strong matches.
- Ensure matchedSkills includes any of these when present in both CV and job: Java, Spring Boot, Angular, APIs, Docker.
- No markdown or extra text.

Job:
${jobBlock}

CV:
${cvText.slice(0, 1200)}

Return JSON only.`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = parseMatchResponse(content);
    const modelSkills = Array.isArray(parsed.matchedSkills)
      ? parsed.matchedSkills.map(String)
      : Array.isArray(parsed.matched_skills)
        ? parsed.matched_skills.map(String)
        : [];
    const skillMatches = extractRequiredSkillMatches(`${jobTitle ?? ""} ${jobDescription}`, cvText);

    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : [],
      matchedSkills: mergeSkills(modelSkills, skillMatches)
    };
  } catch {
    return { score: 0, reasons: ["Unable to evaluate match"], matchedSkills: [] };
  }
}
