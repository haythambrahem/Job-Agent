import { google } from "googleapis";
import fs from "fs";
import readline from "readline";

export async function getAuth() {
  const creds = JSON.parse(fs.readFileSync("credentials.json", "utf8"));
  const { client_id, client_secret, redirect_uris } = creds.installed;
  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);
  if (fs.existsSync("token.json")) {
    auth.setCredentials(JSON.parse(fs.readFileSync("token.json", "utf8")));
    return auth;
  }
  const url = auth.generateAuthUrl({ access_type: "offline", scope: ["https://www.googleapis.com/auth/gmail.send"] });
  console.log("\n🔗 Ouvre ce lien:\n" + url);
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>(r => rl.question("\nColle le code ici: ", r));
  rl.close();
  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);
  fs.writeFileSync("token.json", JSON.stringify(tokens));
  return auth;
}

export async function sendApplicationEmail(args: any): Promise<string> {
  if (args?.application?.status !== "approved") {
    throw new Error("Email blocked: application not approved by user");
  }

  const auth = await getAuth();
  const gmail = google.gmail({ version: "v1", auth });

  // Formate la lettre avec des vrais sauts de ligne
  const letterLines = args.cover_letter
    .replace(/\\n/g, "\n")
    .split("\n")
    .map((line: string) => line.trim())
    .filter((line: string) => line.length > 0)
    .map((line: string) => `<p style="margin:0 0 14px 0;">${line}</p>`)
    .join("");

  const htmlBody = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:30px 0;">
    <tr><td align="center">
      <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:8px;overflow:hidden;">

        <!-- Header -->
        <tr>
          <td style="background:#1a1a2e;padding:28px 40px;">
            <p style="margin:0;color:#ffffff;font-size:20px;font-weight:600;font-family:Arial,sans-serif;">
              Haytham Brahem
            </p>
            <p style="margin:4px 0 0;color:#a0a8c0;font-size:13px;font-family:Arial,sans-serif;">
              Ingénieur Logiciel Full-Stack
            </p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:36px 40px 24px;font-family:Arial,sans-serif;font-size:15px;line-height:1.7;color:#2d2d2d;">
            ${letterLines}
          </td>
        </tr>

        <!-- Divider -->
        <tr>
          <td style="padding:0 40px;">
            <hr style="border:none;border-top:1px solid #e8e8e8;margin:0;">
          </td>
        </tr>

        <!-- Signature -->
        <tr>
          <td style="padding:24px 40px 32px;font-family:Arial,sans-serif;">
            <p style="margin:0 0 4px;font-size:15px;font-weight:700;color:#1a1a2e;">Haytham Brahem</p>
            <p style="margin:0 0 2px;font-size:13px;color:#666;">Ingénieur Logiciel Full-Stack · Java | Spring Boot | Angular</p>
            <p style="margin:0 0 10px;font-size:13px;color:#666;">Tunis, Tunisie</p>
            <table cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding-right:16px;">
                  <a href="mailto:haythambrahem@gmail.com" style="font-size:13px;color:#4a6cf7;text-decoration:none;">
                    haythambrahem@gmail.com
                  </a>
                </td>
                <td style="padding-right:16px;">
                  <a href="https://linkedin.com/in/haytham-brahem" style="font-size:13px;color:#4a6cf7;text-decoration:none;">
                    LinkedIn
                  </a>
                </td>
                <td>
                  <a href="https://github.com/haythambrahem" style="font-size:13px;color:#4a6cf7;text-decoration:none;">
                    GitHub
                  </a>
                </td>
              </tr>
            </table>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;

  // Construire l'email multipart avec pièce jointe
  const boundary = "====boundary_job_agent====";
  const cvBuffer = fs.existsSync("cv.pdf") ? fs.readFileSync("cv.pdf").toString("base64") : null;

  let rawParts = [
    `To: ${args.to_email}`,
    `Subject: =?UTF-8?B?${Buffer.from(`Candidature – ${args.job_title} chez ${args.company}`).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    ``,
    `--${boundary}`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(htmlBody).toString("base64"),
  ];

  if (cvBuffer) {
    rawParts = rawParts.concat([
      ``,
      `--${boundary}`,
      `Content-Type: application/pdf; name="CV_Haytham_Brahem.pdf"`,
      `Content-Transfer-Encoding: base64`,
      `Content-Disposition: attachment; filename="CV_Haytham_Brahem.pdf"`,
      ``,
      cvBuffer,
    ]);
  }

  rawParts.push(``, `--${boundary}--`);

  const raw = Buffer.from(rawParts.join("\r\n"))
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
  return `✅ Email envoyé à ${args.to_email} pour ${args.job_title} chez ${args.company}`;
}
