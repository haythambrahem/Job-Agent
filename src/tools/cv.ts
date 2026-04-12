import Groq from "groq-sdk";
import fs from "fs";
import "dotenv/config";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function readCV(): Promise<string> {
  if (!fs.existsSync("cv.pdf")) {
    console.log("⚠️ Aucun fichier cv.pdf trouvé");
    return "Pas de CV trouvé";
  }
  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const buffer = fs.readFileSync("cv.pdf");
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;
    let fullText = "";
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      fullText += content.items.map((item: any) => item.str).join(" ") + "\n";
    }
    console.log(`✅ CV lu : ${pdf.numPages} page(s)`);
    return fullText.slice(0, 1500); // ← réduit de 3000 à 1500
  } catch (err: any) {
    console.error("❌ Erreur lecture CV:", err.message);
    return "Erreur lecture CV";
  }
}

export async function generateCoverLetter(args: any): Promise<string> {
  const cvText = args.cv_summary || await readCV();

  const res = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{
      role: "user",
      content: `Génère une lettre de motivation COURTE en français (maximum 150 mots).

Poste: ${args.job_title}
Entreprise: ${args.company}
CV résumé: ${cvText}

Format STRICT :
- Commence par "Madame, Monsieur,"
- 2 paragraphes courts maximum
- Termine par "Cordialement,"
- Texte simple, pas de HTML
- Maximum 150 mots`
    }],
    max_tokens: 400 // ← réduit de 1000 à 400
  });

  return res.choices[0].message.content || "";
}