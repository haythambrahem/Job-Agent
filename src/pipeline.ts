import { scrapeAllSources } from "./tools/scraper.js";
import { readCV, generateCoverLetter } from "./tools/cv.js";
import { matchJobToCV } from "./tools/matcher.js";
import { sendApplicationEmail, getAuth } from "./tools/gmail.js";
import { saveCandidature } from "./tools/tracker.js";
import { google } from "googleapis";
import "dotenv/config";

interface PipelineResult {
  total_found: number;
  matched: number;
  applied: number;
  failed: number;
  applied_jobs: Array<{ title: string; company: string; email: string; status: string }>;
}

async function sendSummaryEmail(result: PipelineResult): Promise<void> {
  try {
    const auth = await getAuth();
    const gmail = google.gmail({ version: "v1", auth });

    const htmlTable = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 14px; color: #222; max-width: 800px; margin: auto; padding: 32px;">
  <h2 style="color: #0066cc;">📊 Résumé des candidatures du jour</h2>
  
  <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
    <p><strong>📈 Statistiques:</strong></p>
    <ul style="line-height: 1.8;">
      <li>Offres trouvées: <strong>${result.total_found}</strong></li>
      <li>Offres correspondantes: <strong style="color: #28a745;">${result.matched}</strong></li>
      <li>Candidatures envoyées: <strong style="color: #007bff;">${result.applied}</strong></li>
      <li>Erreurs: <strong style="color: ${result.failed > 0 ? "#dc3545" : "#28a745"};">${result.failed}</strong></li>
    </ul>
  </div>

  <h3>Détail des candidatures:</h3>
  <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
    <thead>
      <tr style="background: #0066cc; color: white;">
        <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Poste</th>
        <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Entreprise</th>
        <th style="padding: 12px; text-align: left; border: 1px solid #ddd;">Email</th>
        <th style="padding: 12px; text-align: center; border: 1px solid #ddd;">Statut</th>
      </tr>
    </thead>
    <tbody>
      ${result.applied_jobs.map(job => `
      <tr style="border: 1px solid #ddd;">
        <td style="padding: 12px; border: 1px solid #ddd;">${job.title}</td>
        <td style="padding: 12px; border: 1px solid #ddd;">${job.company}</td>
        <td style="padding: 12px; border: 1px solid #ddd; font-size: 12px;">${job.email}</td>
        <td style="padding: 12px; text-align: center; border: 1px solid #ddd;">${job.status}</td>
      </tr>
      `).join("")}
    </tbody>
  </table>

  <hr style="border: none; border-top: 1px solid #ddd; margin: 32px 0;">
  <p style="font-size: 12px; color: #888;">
    Rapport généré par Job Application Agent<br>
    ${new Date().toLocaleString("fr-FR")}
  </p>
</body>
</html>`;

    const boundary = "==boundary_" + Math.random().toString(36).substring(2, 15);
    let message = `To: haythambrahem@gmail.com\r\n`;
    message += `Subject: =?UTF-8?B?${Buffer.from(`📊 Résumé des candidatures - ${new Date().toLocaleDateString("fr-FR")}`).toString("base64")}?=\r\n`;
    message += `MIME-Version: 1.0\r\n`;
    message += `Content-Type: multipart/alternative; boundary="${boundary}"\r\n`;
    message += `\r\n`;

    // HTML part
    message += `--${boundary}\r\n`;
    message += `Content-Type: text/html; charset=UTF-8\r\n`;
    message += `Content-Transfer-Encoding: base64\r\n`;
    message += `\r\n`;
    message += Buffer.from(htmlTable).toString("base64") + "\r\n";

    message += `--${boundary}--\r\n`;

    const encoded = Buffer.from(message).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
    await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
    
    console.log("\n📧 Summary email sent to haythambrahem@gmail.com");
  } catch (err: any) {
    console.error("⚠️ Failed to send summary email:", err.message);
  }
}

export async function runDailyPipeline(keywords: string[], location: string): Promise<PipelineResult> {
  const result: PipelineResult = {
    total_found: 0,
    matched: 0,
    applied: 0,
    failed: 0,
    applied_jobs: []
  };

  console.log("\n╔════════════════════════════════════════╗");
  console.log("║   🚀 Daily Job Application Pipeline    ║");
  console.log("╚════════════════════════════════════════╝");

  // Step 1: Read CV
  console.log("\n📄 Reading CV...");
  const cvText = await readCV();
  if (cvText.length === 0) {
    console.error("❌ Failed to read CV. Aborting pipeline.");
    return result;
  }

  // Step 2: Scrape all sources
  let allJobs = [];
  for (const keyword of keywords) {
    try {
      const jobs = await scrapeAllSources(keyword, location);
      allJobs = allJobs.concat(jobs);
    } catch (err: any) {
      console.error(`❌ Error scraping for "${keyword}":`, err.message);
    }
  }

  result.total_found = allJobs.length;
  console.log(`\n📊 Total jobs found: ${allJobs.length}`);

  // Step 3: Match jobs to CV and apply
  for (let i = 0; i < allJobs.length; i++) {
    const job = allJobs[i];

    try {
      console.log(`\n[${i + 1}/${allJobs.length}] Matching: "${job.title}" @ ${job.company}...`);

      // Match job to CV
      const matchResult = await matchJobToCV(job.description, cvText);
      console.log(`   Score: ${matchResult.score}/100`);

      if (matchResult.score >= 70) {
        result.matched++;
        console.log(`   ✅ Match! Matched skills: ${matchResult.matched_skills.join(", ")}`);

        // Generate cover letter
        console.log(`   📝 Generating cover letter...`);
        const coverLetter = await generateCoverLetter({
          job_title: job.title,
          company: job.company,
          job_description: job.description,
          cv_summary: cvText
        });

        // Wait 1500ms before next Groq call (rate limit)
        await new Promise(r => setTimeout(r, 1500));

        // Send email
        const emailToUse = job.email || "jobs@" + job.company.toLowerCase().replace(/\s+/g, "-") + ".com";
        console.log(`   📧 Sending email to ${emailToUse}...`);
        const emailResult = await sendApplicationEmail({
          to_email: emailToUse,
          company: job.company,
          job_title: job.title,
          cover_letter: coverLetter
        });
        console.log(`   ${emailResult}`);

        // Save to Excel
        await saveCandidature({
          to_email: emailToUse,
          company: job.company,
          job_title: job.title
        });

        result.applied++;
        result.applied_jobs.push({
          title: job.title,
          company: job.company,
          email: emailToUse,
          status: "✅ Envoyée"
        });

        // Wait 3 seconds between applications
        if (i < allJobs.length - 1) {
          await new Promise(r => setTimeout(r, 3000));
        }
      } else {
        console.log(`   ❌ Score too low (${matchResult.score}/100). Skipping.`);
      }
    } catch (err: any) {
      result.failed++;
      console.error(`   ❌ Error processing job:`, err.message);
      result.applied_jobs.push({
        title: job.title,
        company: job.company,
        email: "unknown",
        status: "❌ Erreur"
      });
    }
  }

  // Step 4: Send summary email
  console.log("\n\n📊 Pipeline Summary:");
  console.log(`   Total found: ${result.total_found}`);
  console.log(`   Matched: ${result.matched}`);
  console.log(`   Applied: ${result.applied}`);
  console.log(`   Failed: ${result.failed}`);

  return result;
}

async function main() {
  const keywords = ["développeur Java", "développeur React", "full stack"];
  const location = "Tunisie";

  try {
    const result = await runDailyPipeline(keywords, location);
    
    // Send summary email
    await sendSummaryEmail(result);
    
    console.log("\n✅ Pipeline completed successfully!");
    process.exit(0);
  } catch (err: any) {
    console.error("❌ Pipeline error:", err.message);
    process.exit(1);
  }
}

main().catch(console.error);
