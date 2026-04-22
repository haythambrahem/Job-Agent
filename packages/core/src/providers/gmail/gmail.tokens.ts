import { google } from "googleapis";

export interface GmailTokenSet {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface RefreshResult {
  accessToken: string;
  expiresAt: number;
  changed: boolean;
}

const TOKEN_EXPIRY_BUFFER_SECONDS = 300;

export function isTokenExpired(expiresAt: number): boolean {
  return Date.now() / 1000 > expiresAt - TOKEN_EXPIRY_BUFFER_SECONDS;
}

export async function refreshAccessToken(opts: {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
}): Promise<RefreshResult> {
  const oauth2 = new google.auth.OAuth2(opts.clientId, opts.clientSecret);
  oauth2.setCredentials({ refresh_token: opts.refreshToken });

  const { credentials } = await oauth2.refreshAccessToken();

  if (!credentials.access_token) {
    throw new Error("Google refresh returned no access_token — user must reconnect");
  }

  return {
    accessToken: credentials.access_token,
    expiresAt: Math.floor((credentials.expiry_date ?? Date.now() + 3_600_000) / 1000),
    changed: true
  };
}

export async function buildOAuth2Client(opts: {
  clientId: string;
  clientSecret: string;
  tokens: GmailTokenSet;
  onRefresh: (result: RefreshResult) => Promise<void>;
}): Promise<InstanceType<typeof google.auth.OAuth2>> {
  const oauth2 = new google.auth.OAuth2(opts.clientId, opts.clientSecret);

  let { accessToken, refreshToken, expiresAt } = opts.tokens;

  if (isTokenExpired(expiresAt)) {
    const refreshed = await refreshAccessToken({
      clientId: opts.clientId,
      clientSecret: opts.clientSecret,
      refreshToken
    });
    if (refreshed.changed) {
      accessToken = refreshed.accessToken;
      expiresAt = refreshed.expiresAt;
      await opts.onRefresh(refreshed);
    }
  }

  oauth2.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken,
    expiry_date: expiresAt * 1000
  });

  return oauth2;
}
