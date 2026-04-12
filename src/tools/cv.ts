import Groq from "groq-sdk";
import fs from "fs";
import "dotenv/config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function readCV(): Promise<string> {
  if (!fs.existsSync("cv.pdf")) return "Développeur full-stack, Java, Spring Boot, Angular, 3 ans d'expérience";
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const buffer = fs.readFileSync("cv.pdf");
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    let text = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    console.log(`✅ CV lu : ${pdf.numPages} page(s)`);
    // Extrait seulement les infos clés — max 600 chars
    return text.slice(0, 600);
  } catch (err: any) {
    return "Développeur full-stack expérimenté";
  }
}

export async function generateCoverLetter(args: any): Promise<string> {
  const cvText = args.cv_summary || await readCV();

  // Prompt ultra-court pour rester sous la limite de tokens
  const prompt = `Lettre de motivation TRÈS COURTE (max 80 mots) en français.
Poste: ${args.job_title} chez ${args.company}
Profil: ${cvText.slice(0, 300)}
Format: "Madame, Monsieur," + 1 paragraphe + "Cordialement,"
MAXIMUM 80 MOTS. Pas de HTML.`;

  // Retry automatique si rate limit
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await groq.chat.completions.create({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 200  // très strict
      });
      const letter = res.choices[0].message.content || "";
      console.log(`   📝 Lettre générée (${letter.length} chars)`);
      return letter;
    } catch (err: any) {
      if (err.status === 429 && attempt < 3) {
        console.log(`   ⏳ Rate limit, attente ${attempt * 10}s...`);
        await new Promise(r => setTimeout(r, attempt * 10000));
      } else {
        // Lettre de secours si tout échoue
        return `Madame, Monsieur,\n\nJe vous soumets ma candidature pour le poste de ${args.job_title} au sein de ${args.company}. Mon expérience en développement logiciel correspond aux exigences de ce poste.\n\nCordialement,`;
      }
    }
  }
  return "";
}