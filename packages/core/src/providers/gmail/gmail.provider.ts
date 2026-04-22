import { google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { MailProvider, SendEmailInput } from "../mail/mail.provider.js";

export class GmailProvider implements MailProvider {
  constructor(
    private readonly oauth2Client: OAuth2Client,
    private readonly fromEmail: string
  ) {}

  getConnectedEmail(): string {
    return this.fromEmail;
  }

  async sendEmail(input: SendEmailInput): Promise<void> {
    const gmail = google.gmail({ version: "v1", auth: this.oauth2Client });
    const raw = buildMimeMessage({ from: this.fromEmail, ...input });
    const encoded = Buffer.from(raw).toString("base64url");
    await gmail.users.messages.send({
      userId: "me",
      requestBody: { raw: encoded }
    });
  }
}

function buildMimeMessage(opts: {
  from: string;
  to: string;
  subject: string;
  htmlBody: string;
  attachments?: SendEmailInput["attachments"];
}): string {
  const boundary = `boundary_${Date.now().toString(36)}`;
  const lines: string[] = [];

  lines.push("MIME-Version: 1.0");
  lines.push(`From: ${opts.from}`);
  lines.push(`To: ${opts.to}`);
  lines.push(`Subject: ${opts.subject}`);
  lines.push(`Content-Type: multipart/mixed; boundary="${boundary}"`);
  lines.push("");
  lines.push(`--${boundary}`);
  lines.push("Content-Type: text/html; charset=UTF-8");
  lines.push("Content-Transfer-Encoding: quoted-printable");
  lines.push("");
  lines.push(opts.htmlBody);

  for (const att of opts.attachments ?? []) {
    const b64 = att.data.toString("base64");
    const chunks = b64.match(/.{1,76}/g) ?? [];
    lines.push(`--${boundary}`);
    lines.push(`Content-Type: ${att.mimeType}; name="${att.filename}"`);
    lines.push(`Content-Disposition: attachment; filename="${att.filename}"`);
    lines.push("Content-Transfer-Encoding: base64");
    lines.push("");
    lines.push(chunks.join("\r\n"));
  }

  lines.push(`--${boundary}--`);
  return lines.join("\r\n");
}
