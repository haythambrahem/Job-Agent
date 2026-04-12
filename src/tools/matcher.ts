import Groq from "groq-sdk";
import "dotenv/config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export interface MatchResult {
  score: number;
  reasons: string[];
  matched_skills: string[];
}

export async function matchJobToCV(jobDescription: string, cvText: string): Promise<MatchResult> {
  try {
    const prompt = `Analyze if this job matches the candidate's CV profile.

Job Description:
${jobDescription.substring(0, 500)}

CV Summary:
${cvText.substring(0, 500)}

Respond ONLY with valid JSON (no markdown, no extra text):
{
  "score": <number 0-100>,
  "reasons": [<list of 2-3 short reasons why this matches or doesn't match>],
  "matched_skills": [<list of top 3-5 matched skills from CV to job>]
}`;

    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{
        role: "user",
        content: prompt
      }],
      max_tokens: 300,
      temperature: 0.3
    });

    const content = response.choices[0].message.content || "{}";
    
    // Try to extract JSON from the response
    let match: MatchResult;
    try {
      match = JSON.parse(content);
    } catch {
      // If JSON parsing fails, try to find JSON in the content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        match = JSON.parse(jsonMatch[0]);
      } else {
        match = { score: 0, reasons: ["Failed to parse response"], matched_skills: [] };
      }
    }

    // Validate score is in range
    match.score = Math.max(0, Math.min(100, match.score || 0));
    match.reasons = Array.isArray(match.reasons) ? match.reasons : [];
    match.matched_skills = Array.isArray(match.matched_skills) ? match.matched_skills : [];

    return match;
  } catch (err: any) {
    console.error("❌ Matcher error:", err.message);
    return {
      score: 0,
      reasons: ["Error during matching: " + err.message],
      matched_skills: []
    };
  }
}

export async function shouldApply(matchResult: MatchResult): Promise<boolean> {
  return matchResult.score >= 70;
}
