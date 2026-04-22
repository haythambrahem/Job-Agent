export interface SendEmailInput {
  to: string;
  subject: string;
  htmlBody: string;
  attachments?: Array<{
    filename: string;
    mimeType: string;
    data: Buffer;
  }>;
}

export interface MailProvider {
  sendEmail(input: SendEmailInput): Promise<void>;
  getConnectedEmail(): string;
}
