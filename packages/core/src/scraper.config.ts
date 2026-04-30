export type JobSource = "linkedin" | "indeed" | "tanitjobs";

export interface SourceScraperConfig {
  timeoutMs: number;
  maxRetries: number;
  backoffBaseMs: number;
  maxConcurrentRequests: number;
  waitUntil: "domcontentloaded";
  antiBotDelayMs: {
    min: number;
    max: number;
  };
  circuitBreaker: {
    failureThreshold: number;
    resetTimeoutMs: number;
  };
}

export const SCRAPER_SOURCES: readonly JobSource[] = ["linkedin", "indeed", "tanitjobs"] as const;

export const SCRAPER_SOURCE_CONFIG: Record<JobSource, SourceScraperConfig> = {
  linkedin: {
    timeoutMs: 45_000,
    maxRetries: 3,
    backoffBaseMs: 700,
    maxConcurrentRequests: 2,
    waitUntil: "domcontentloaded",
    antiBotDelayMs: { min: 1_500, max: 3_200 },
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeoutMs: 90_000
    }
  },
  indeed: {
    timeoutMs: 35_000,
    maxRetries: 3,
    backoffBaseMs: 600,
    maxConcurrentRequests: 2,
    waitUntil: "domcontentloaded",
    antiBotDelayMs: { min: 1_200, max: 2_800 },
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeoutMs: 75_000
    }
  },
  tanitjobs: {
    timeoutMs: 25_000,
    maxRetries: 2,
    backoffBaseMs: 500,
    maxConcurrentRequests: 1,
    waitUntil: "domcontentloaded",
    antiBotDelayMs: { min: 900, max: 2_200 },
    circuitBreaker: {
      failureThreshold: 3,
      resetTimeoutMs: 60_000
    }
  }
};

export const SCRAPER_ANTIBOT_PROFILES = {
  userAgents: [
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
  ] as const,
  viewports: [
    { width: 1366, height: 768 },
    { width: 1440, height: 900 },
    { width: 1536, height: 864 },
    { width: 1600, height: 900 }
  ] as const,
  locales: ["en-US", "fr-FR", "en-GB"] as const,
  timezones: ["Europe/Paris", "Africa/Tunis", "Europe/London"] as const,
  deviceScaleFactors: [1, 2] as const,
  colorSchemes: ["light", "dark"] as const
};
