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
  const auth = await getAuth();
  const gmail = google.gmail({ version: "v1", auth });

  // Email HTML bien formaté
  const htmlBody = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="font-family: Arial, sans-serif; font-size: 15px; color: #222; max-width: 650px; margin: auto; padding: 32px;">
  <p style="margin-bottom: 24px;">${args.cover_letter.replace(/\n/g, "<br>")}</p>
  <hr style="border: none; border-top: 1px solid #ddd; margin: 24px 0;">
  <p style="font-size: 13px; color: #888;">Candidature envoyée via Job Application Agent</p>
</body>
</html>`;

  const msg = [
    `To: ${args.to_email}`,
    `Subject: =?UTF-8?B?${Buffer.from(`Candidature – ${args.job_title} chez ${args.company}`).toString("base64")}?=`,
    `MIME-Version: 1.0`,
    `Content-Type: text/html; charset=UTF-8`,
    `Content-Transfer-Encoding: base64`,
    ``,
    Buffer.from(htmlBody).toString("base64")
  ].join("\r\n");

  const encoded = Buffer.from(msg).toString("base64").replace(/\+/g, "-").replace(/\//g, "_");
  await gmail.users.messages.send({ userId: "me", requestBody: { raw: encoded } });
  return `✅ Email envoyé à ${args.to_email} pour ${args.job_title} chez ${args.company}`;
}