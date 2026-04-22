import type { PrismaClient } from "@prisma/client";
import type { GmailTokenSet } from "@job-agent/core";
import { decrypt, encrypt } from "../../lib/encryption.js";

export class GmailRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async upsertTokens(opts: {
    userId: string;
    email: string;
    tokens: GmailTokenSet;
    scope: string;
  }): Promise<void> {
    await this.prisma.connectedAccount.upsert({
      where: { userId_provider: { userId: opts.userId, provider: "gmail" } },
      create: {
        userId: opts.userId,
        provider: "gmail",
        email: opts.email,
        accessTokenEncrypted: encrypt(opts.tokens.accessToken),
        refreshTokenEncrypted: encrypt(opts.tokens.refreshToken),
        expiresAt: opts.tokens.expiresAt,
        scope: opts.scope
      },
      update: {
        email: opts.email,
        accessTokenEncrypted: encrypt(opts.tokens.accessToken),
        refreshTokenEncrypted: encrypt(opts.tokens.refreshToken),
        expiresAt: opts.tokens.expiresAt,
        scope: opts.scope
      }
    });
  }

  async getTokens(userId: string): Promise<(GmailTokenSet & { email: string }) | null> {
    const account = await this.prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider: "gmail" } }
    });
    if (!account) {
      return null;
    }
    return {
      email: account.email,
      accessToken: decrypt(account.accessTokenEncrypted),
      refreshToken: decrypt(account.refreshTokenEncrypted),
      expiresAt: account.expiresAt
    };
  }

  async updateAccessToken(userId: string, accessToken: string, expiresAt: number): Promise<void> {
    await this.prisma.connectedAccount.update({
      where: { userId_provider: { userId, provider: "gmail" } },
      data: {
        accessTokenEncrypted: encrypt(accessToken),
        expiresAt
      }
    });
  }

  async disconnect(userId: string): Promise<void> {
    await this.prisma.connectedAccount.deleteMany({
      where: { userId, provider: "gmail" }
    });
  }

  async getStatus(userId: string): Promise<{ connected: boolean; email?: string; expiresAt?: number }> {
    const account = await this.prisma.connectedAccount.findUnique({
      where: { userId_provider: { userId, provider: "gmail" } },
      select: { email: true, expiresAt: true }
    });
    if (!account) {
      return { connected: false };
    }
    return { connected: true, email: account.email, expiresAt: account.expiresAt };
  }
}
