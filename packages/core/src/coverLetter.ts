import Groq from "groq-sdk";
import type { GenerateCoverLetterInput } from "./types.js";

const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const DEFAULT_CV_SUMMARY = "Développeur full-stack, Java, Spring Boot, Angular, 3 ans d'expérience";

export async function generateCoverLetter(input: GenerateCoverLetterInput): Promise<string> {
  const cvSummary = input.cvSummary || DEFAULT_CV_SUMMARY;

  if (!groq) {
    return `Madame, Monsieur,\n\nJe vous propose ma candidature pour le poste de ${input.jobTitle} chez ${input.company}. Mon expérience full-stack correspond à vos besoins et je serais ravi de contribuer à vos projets.\n\nCordialement,`;
  }

  const prompt = `Write a concise French cover letter (max 140 words).\nRole: ${input.jobTitle}\nCompany: ${input.company}\nJob description: ${input.jobDescription.slice(0, 800)}\nCV summary: ${cvSummary.slice(0, 800)}\nReturn plain text only.`;

  try {
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 280,
      temperature: 0.4
    });

    return response.choices[0]?.message?.content?.trim() || "";
  } catch {
    return `Madame, Monsieur,\n\nJe vous propose ma candidature pour le poste de ${input.jobTitle} chez ${input.company}. Je suis motivé à mettre mes compétences techniques au service de votre équipe.\n\nCordialement,`;
  }
}
