import Groq from "groq-sdk";
import type { MatchResult } from "./types.js";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

export async function matchJobToCV(jobDescription: string, cvText: string): Promise<MatchResult> {
  if (!groq) {
    return { score: 75, reasons: ["GROQ_API_KEY not configured; using fallback score"], matchedSkills: [] };
  }

  try {
    const prompt = `Analyze if this job matches the candidate profile.\n\nJob:\n${jobDescription.slice(0, 800)}\n\nCV:\n${cvText.slice(0, 800)}\n\nReturn JSON only:\n{\"score\":number,\"reasons\":string[],\"matched_skills\":string[]}`;
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 300,
      temperature: 0.2
    });

    const content = response.choices[0]?.message?.content || "{}";
    const parsed = JSON.parse(content.match(/\{[\s\S]*\}/)?.[0] || "{}");

    return {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      reasons: Array.isArray(parsed.reasons) ? parsed.reasons.map(String) : [],
      matchedSkills: Array.isArray(parsed.matched_skills) ? parsed.matched_skills.map(String) : []
    };
  } catch {
    return { score: 0, reasons: ["Unable to evaluate match"], matchedSkills: [] };
  }
}
