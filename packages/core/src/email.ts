import fs from "node:fs";
import readline from "node:readline";
import { google } from "googleapis";
import type { SendEmailInput } from "./types.js";

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

export async function sendEmail(input: SendEmailInput): Promise<void> {
  const auth = await getAuth();
  const gmail = google.gmail({ version: "v1", auth });

  const body = [
    `To: ${input.toEmail}`,
    `Subject: =?UTF-8?B?${Buffer.from(`Candidature – ${input.jobTitle} chez ${input.company}`).toString("base64")}?=`,
    "MIME-Version: 1.0",
    "Content-Type: text/plain; charset=UTF-8",
    "",
    input.coverLetter
  ].join("\r\n");

  const raw = Buffer.from(body)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");

  await gmail.users.messages.send({ userId: "me", requestBody: { raw } });
}
