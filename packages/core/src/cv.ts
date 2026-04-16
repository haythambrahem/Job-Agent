import fs from "node:fs";

const DEFAULT_CV_SUMMARY = "Développeur full-stack, Java, Spring Boot, Angular, 3 ans d'expérience";

export async function readCV(cvPath = process.env.CV_PATH || "cv.pdf"): Promise<string> {
  if (!fs.existsSync(cvPath)) return DEFAULT_CV_SUMMARY;

  try {
    const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const buffer = fs.readFileSync(cvPath);
    const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buffer) }).promise;

    let text = "";
    for (let i = 1; i <= pdf.numPages; i += 1) {
      const page = await pdf.getPage(i);
      const content = await page.getTextContent();
      text += content.items.map((item: any) => item.str).join(" ") + "\n";
    }

    return text.trim().slice(0, 1500) || DEFAULT_CV_SUMMARY;
  } catch {
    return DEFAULT_CV_SUMMARY;
  }
}
