import fs from "node:fs";
import readline from "node:readline";
import path from "node:path";
import { google } from "googleapis";

async function getAuth() {
  const credentialsPath = process.env.GMAIL_CREDENTIALS_PATH || "credentials.json";
  const tokenPath = process.env.GMAIL_TOKEN_PATH || "token.json";

  const creds = JSON.parse(fs.readFileSync(credentialsPath, "utf8"));
  const { client_id, client_secret, redirect_uris } = creds.installed;
  const auth = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

  if (fs.existsSync(tokenPath)) {
    auth.setCredentials(JSON.parse(fs.readFileSync(tokenPath, "utf8")));
    return auth;
  }

  const url = auth.generateAuthUrl({
    access_type: "offline",
    scope: ["https://www.googleapis.com/auth/gmail.send"]
  });

  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const code = await new Promise<string>((resolve) => rl.question(`Open URL then paste code:\n${url}\n`, resolve));
  rl.close();

  const { tokens } = await auth.getToken(code);
  auth.setCredentials(tokens);
  fs.writeFileSync(tokenPath, JSON.stringify(tokens));
  return auth;
}

function toBase64Url(value: string | Buffer): string {
  return Buffer.from(value)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function buildPlainTextFromHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, "\"")
    .replace(/&#39;/g, "'")
    .trim();
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  htmlBody: string;
  cvPdfPath: string;
}): Promise<void> {
  const auth = await getAuth();
  const gmail = google.gmail({ version: "v1", auth });
  const mixedBoundary = `mix_${Date.now().toString(16)}`;
  const altBoundary = `alt_${Date.now().toString(16)}`;
  const resolvedPdfPath = path.resolve(opts.cvPdfPath);
  const cvPdf = fs.readFileSync(resolvedPdfPath);
  const cvPdfName = path.basename(resolvedPdfPath);
  const plainText = buildPlainTextFromHtml(opts.htmlBody);

  const rawMessage = [
    `To: ${opts.to}`,
    `Subject: =?UTF-8?B?${Buffer.from(opts.subject).toString("base64")}?=`,
    "MIME-Version: 1.0",
    `Content-Type: multipart/mixed; boundary="${mixedBoundary}"`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: multipart/alternative; boundary="${altBoundary}"`,
    "",
    `--${altBoundary}`,
    "Content-Type: text/plain; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    plainText,
    "",
    `--${altBoundary}`,
    "Content-Type: text/html; charset=UTF-8",
    "Content-Transfer-Encoding: 7bit",
    "",
    opts.htmlBody,
    "",
    `--${altBoundary}--`,
    "",
    `--${mixedBoundary}`,
    `Content-Type: application/pdf; name="${cvPdfName}"`,
    "Content-Transfer-Encoding: base64",
    `Content-Disposition: attachment; filename="${cvPdfName}"`,
    "",
    cvPdf.toString("base64").replace(/(.{76})/g, "$1\r\n"),
    "",
    `--${mixedBoundary}--`
  ].join("\r\n");

  const raw = toBase64Url(rawMessage);

  await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
}
