import type { PrismaClient } from "@prisma/client";
import { google } from "googleapis";
import { buildOAuth2Client, GmailProvider } from "@job-agent/core";
import { GmailRepository } from "./gmail.repository.js";

const GMAIL_SCOPES = [
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.modify"
];

export class GmailService {
  private readonly repo: GmailRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new GmailRepository(prisma);
  }

  getAuthUrl(userId: string): string {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
    return oauth2.generateAuthUrl({
      access_type: "offline",
      prompt: "consent",
      scope: GMAIL_SCOPES,
      state: userId
    });
  }

  async handleCallback(code: string, userId: string): Promise<void> {
    const oauth2 = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await oauth2.getToken(code);

    if (!tokens.access_token || !tokens.refresh_token) {
      throw new Error("Incomplete tokens from Google — user must reconnect");
    }

    oauth2.setCredentials(tokens);
    const gmail = google.gmail({ version: "v1", auth: oauth2 });
    const profile = await gmail.users.getProfile({ userId: "me" });
    const email = profile.data.emailAddress ?? "";

    await this.repo.upsertTokens({
      userId,
      email,
      tokens: {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: Math.floor((tokens.expiry_date ?? Date.now() + 3_600_000) / 1000)
      },
      scope: tokens.scope ?? GMAIL_SCOPES.join(" ")
    });
  }

  async disconnect(userId: string): Promise<void> {
    const tokenData = await this.repo.getTokens(userId);
    if (tokenData) {
      const oauth2 = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
      );
      oauth2.setCredentials({ access_token: tokenData.accessToken });
      await oauth2.revokeCredentials().catch(() => undefined);
    }
    await this.repo.disconnect(userId);
  }

  async getStatus(userId: string): Promise<{ connected: boolean; email?: string; expiresAt?: number }> {
    return this.repo.getStatus(userId);
  }

  async buildProviderForUser(userId: string): Promise<GmailProvider> {
    const tokenData = await this.repo.getTokens(userId);
    if (!tokenData) {
      throw new Error("NO_GMAIL_CONNECTED");
    }

    const oauth2Client = await buildOAuth2Client({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      tokens: tokenData,
      onRefresh: async (result) => {
        await this.repo.updateAccessToken(userId, result.accessToken, result.expiresAt);
      }
    });

    return new GmailProvider(oauth2Client, tokenData.email);
  }
}
