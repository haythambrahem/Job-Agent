import { chromium } from "playwright-extra";
import StealthPlugin from "playwright-extra-plugin-stealth";
import type { Browser, BrowserContext, Page } from "playwright";
import { promises as fs } from "node:fs";
import path from "node:path";
import pino from "pino";
import type { ScrapedJob } from "./types.js";
import {
  SCRAPER_ANTIBOT_PROFILES,
  SCRAPER_SOURCE_CONFIG,
  SCRAPER_SOURCES,
  type JobSource,
  type SourceScraperConfig
} from "./scraper.config.js";

export interface ScrapeJobsInput {
  keywords: string;
  location?: string;
  limitPerSource?: number;
}

export interface SourceScrapeMetrics {
  requests: number;
  successes: number;
  failures: number;
  retries: number;
  successRate: number;
  failureRate: number;
  executionMs: number;
  circuitState: "closed" | "open" | "half_open";
  lastError?: string;
}

export interface ScrapeExecutionMetrics {
  startedAt: string;
  finishedAt: string;
  executionMs: number;
  totalJobsBeforeDeduplication: number;
  totalJobsAfterDeduplication: number;
  sources: Record<JobSource, SourceScrapeMetrics>;
}

export interface ScrapeJobsResult {
  jobs: ScrapedJob[];
  metrics: ScrapeExecutionMetrics;
}

type ExtractedJob = {
  title: string;
  company: string;
  description: string;
  locationText: string;
  applyUrl: string;
};

type NormalizedJobInput = ExtractedJob & {
  source: JobSource;
  applyEmail?: string | null;
};

type ProxySettings = {
  server: string;
  username?: string;
  password?: string;
  bypass?: string;
};

chromium.use(StealthPlugin());

class CircuitBreaker {
  private consecutiveFailures = 0;
  private state: "closed" | "open" | "half_open" = "closed";
  private openedAtMs = 0;

  constructor(private readonly config: SourceScraperConfig["circuitBreaker"]) {}

  canRequest(nowMs = Date.now()): boolean {
    if (this.state !== "open") return true;
    if (nowMs - this.openedAtMs >= this.config.resetTimeoutMs) {
      this.state = "half_open";
      return true;
    }
    return false;
  }

  onSuccess(): void {
    this.consecutiveFailures = 0;
    this.state = "closed";
  }

  onFailure(nowMs = Date.now()): void {
    this.consecutiveFailures += 1;
    if (this.state === "half_open" || this.consecutiveFailures >= this.config.failureThreshold) {
      this.state = "open";
      this.openedAtMs = nowMs;
    }
  }

  getState(): "closed" | "open" | "half_open" {
    return this.state;
  }
}

const logger = pino({
  name: "job-scraper",
  level: process.env.LOG_LEVEL || "info",
  transport: {
    target: "pino-pretty",
  },
});

const DEBUG_ARTIFACTS_ENABLED = process.env.SCRAPER_DEBUG === "true";
const DEBUG_ARTIFACTS_DIR = process.env.SCRAPER_DEBUG_DIR ?? path.join(process.cwd(), "tmp", "scraper-debug");

const PROXY_SERVERS = (process.env.SCRAPER_PROXY_SERVERS || process.env.SCRAPER_PROXY_SERVER || "")
  .split(",")
  .map((entry) => entry.trim())
  .filter(Boolean);

const DEFAULT_COMPANY = "Unknown company";
const DEFAULT_LOCATION = "Unknown";
const DEFAULT_TUNISIA_LOCATION = "Tunisie";

function nowMs(): number {
  return Date.now();
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function isPresent<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

function resolveBaseUrl(source: JobSource): string {
  if (source === "indeed") return "https://fr.indeed.com";
  if (source === "tanitjobs") return "https://www.tanitjobs.com";
  return "https://www.linkedin.com";
}

function normalizeUrl(url: string, source: JobSource): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  try {
    const normalized = new URL(trimmed, resolveBaseUrl(source));
    normalized.hash = "";
    return normalized.toString();
  } catch {
    return "";
  }
}

function isValidHttpUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

function dedupe(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>();
  return jobs.filter((job) => {
    const key = `${normalize(job.title).toLowerCase()}::${normalize(job.company).toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function delay(ms: number): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

async function humanDelayFor(source: JobSource): Promise<void> {
  const { min, max } = SCRAPER_SOURCE_CONFIG[source].antiBotDelayMs;
  await delay(randomInt(min, max));
}

function stripTags(html: string): string {
  return normalize(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function extractEmailFromText(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function getDescriptionOrDefault(job: ExtractedJob): string {
  const normalizedDescription = normalize(job.description);
  if (normalizedDescription) return normalizedDescription;
  return normalize(`${job.title} at ${job.company} - ${job.locationText}`);
}

function pickRandom<T>(values: readonly T[]): T {
  return values[randomInt(0, values.length - 1)] ?? values[0];
}

function normalizeScrapedJob(job: NormalizedJobInput, args: ScrapeJobsInput): ScrapedJob | null {
  const title = normalize(job.title);
  const company = normalize(job.company || DEFAULT_COMPANY);
  const description = normalize(getDescriptionOrDefault(job));
  const locationFallback = job.source === "tanitjobs" ? DEFAULT_TUNISIA_LOCATION : DEFAULT_LOCATION;
  const location = normalize(job.locationText || args.location || locationFallback);
  const url = normalizeUrl(job.applyUrl, job.source);
  if (!title || !company || !description || !location || !isValidHttpUrl(url)) {
    return null;
  }
  return {
    title,
    company,
    description,
    url,
    source: job.source,
    location,
    applyEmail: job.applyEmail ? normalize(job.applyEmail) : undefined
  };
}

function looksLikeJobUrl(href: string, source: JobSource): boolean {
  const value = href.toLowerCase();
  if (source === "linkedin") return value.includes("/jobs/");
  if (source === "indeed") return value.includes("viewjob") || value.includes("/rc/clk") || value.includes("/pagead/");
  return value.includes("job") || value.includes("offre") || value.includes("emploi");
}

function parseJobsFromHtmlFallback(html: string, source: JobSource, limit: number, location?: string): ExtractedJob[] {
  const jobs: ExtractedJob[] = [];
  const anchorRegex = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;

  for (const match of html.matchAll(anchorRegex)) {
    if (jobs.length >= limit) break;
    const href = match[1] ?? "";
    if (!looksLikeJobUrl(href, source)) continue;
    const title = normalize(stripTags(match[2] ?? ""));
    if (!title || title.length < 4) continue;
    const windowStart = Math.max(0, (match.index ?? 0) - 350);
    const windowEnd = Math.min(html.length, (match.index ?? 0) + 700);
    jobs.push({
      title,
      company: DEFAULT_COMPANY,
      description: stripTags(html.slice(windowStart, windowEnd)),
      locationText: location ?? DEFAULT_LOCATION,
      applyUrl: normalizeUrl(href, source)
    });
  }

  return jobs;
}

async function gotoAndStabilize(page: Page, source: JobSource, url: string): Promise<void> {
  await humanDelayFor(source);
  await page.goto(url, {
    waitUntil: SCRAPER_SOURCE_CONFIG[source].waitUntil,
    timeout: SCRAPER_SOURCE_CONFIG[source].timeoutMs
  });
  await humanDelayFor(source);
}

function configurePage(page: Page, source: JobSource): void {
  const timeoutMs = SCRAPER_SOURCE_CONFIG[source].timeoutMs;
  page.setDefaultTimeout(timeoutMs);
  page.setDefaultNavigationTimeout(timeoutMs);
}

async function mapWithConcurrency<T, R>(items: readonly T[], concurrency: number, worker: (item: T) => Promise<R>): Promise<R[]> {
  if (items.length === 0) return [];
  const results = new Array<R>(items.length);
  let index = 0;

  const runners = Array.from({ length: Math.max(1, Math.min(concurrency, items.length)) }, async () => {
    while (index < items.length) {
      const current = index;
      index += 1;
      results[current] = await worker(items[current]!);
    }
  });

  await Promise.all(runners);
  return results;
}

function buildProxySettings(): ProxySettings | undefined {
  if (PROXY_SERVERS.length === 0) return undefined;
  const server = pickRandom(PROXY_SERVERS);
  const username = process.env.SCRAPER_PROXY_USERNAME?.trim();
  const password = process.env.SCRAPER_PROXY_PASSWORD?.trim();
  return {
    server,
    username: username || undefined,
    password: password || undefined
  };
}

class JobScraperService {
  private readonly breakers: Record<JobSource, CircuitBreaker> = {
    linkedin: new CircuitBreaker(SCRAPER_SOURCE_CONFIG.linkedin.circuitBreaker),
    indeed: new CircuitBreaker(SCRAPER_SOURCE_CONFIG.indeed.circuitBreaker),
    tanitjobs: new CircuitBreaker(SCRAPER_SOURCE_CONFIG.tanitjobs.circuitBreaker)
  };

  private lastMetrics: ScrapeExecutionMetrics | null = null;

  getLastMetrics(): ScrapeExecutionMetrics | null {
    return this.lastMetrics;
  }

  async scrapeJobsWithMetrics(args: ScrapeJobsInput): Promise<ScrapeJobsResult> {
    if (!args.keywords.trim()) {
      logger.warn({ keywords: args.keywords }, "scrape skipped: missing keywords");
      const timestamp = new Date().toISOString();
      const emptyMetrics = this.createMetricsSkeleton(timestamp, timestamp, 0, 0, 0);
      this.lastMetrics = emptyMetrics;
      return { jobs: [], metrics: emptyMetrics };
    }

    const startedAtMs = nowMs();
    const startedAt = new Date(startedAtMs).toISOString();
    const sourceTimers: Record<JobSource, number> = {
      linkedin: nowMs(),
      indeed: nowMs(),
      tanitjobs: nowMs()
    };

    const sourceMetrics: Record<JobSource, SourceScrapeMetrics> = {
      linkedin: this.createSourceMetric("linkedin"),
      indeed: this.createSourceMetric("indeed"),
      tanitjobs: this.createSourceMetric("tanitjobs")
    };

    const browser = await chromium.launch({
      headless: process.env.SCRAPER_HEADLESS !== "false"
    });
    try {
      logger.info({ keywords: args.keywords, location: args.location, sources: SCRAPER_SOURCES }, "scrape started");

      const results = await Promise.allSettled(
        SCRAPER_SOURCES.map(async (source) => {
          sourceTimers[source] = nowMs();
          try {
            return await this.scrapeSource(browser, source, args, sourceMetrics[source]);
          } finally {
            sourceMetrics[source].executionMs = nowMs() - sourceTimers[source];
          }
        })
      );

      const merged = results.flatMap((result, index) => {
        const source = SCRAPER_SOURCES[index];
        if (!source) return [];
        if (result.status === "fulfilled") return result.value;
        const errorMessage = this.toErrorMessage(result.reason);
        sourceMetrics[source].failures += 1;
        sourceMetrics[source].lastError = errorMessage;
        logger.error({ source, error: errorMessage }, "source scrape crashed");
        return [];
      });
      const deduped = dedupe(merged);
      const finishedAtMs = nowMs();
      const metrics = this.createMetricsSkeleton(
        startedAt,
        new Date(finishedAtMs).toISOString(),
        finishedAtMs - startedAtMs,
        merged.length,
        deduped.length,
        sourceMetrics
      );

      this.lastMetrics = metrics;
      logger.info(
        {
          executionMs: metrics.executionMs,
          totalBeforeDedupe: metrics.totalJobsBeforeDeduplication,
          totalAfterDedupe: metrics.totalJobsAfterDeduplication,
          sourceMetrics: metrics.sources
        },
        "scrape completed"
      );

      return { jobs: deduped, metrics };
    } catch (error) {
      const finishedAtMs = nowMs();
      const metrics = this.createMetricsSkeleton(
        startedAt,
        new Date(finishedAtMs).toISOString(),
        finishedAtMs - startedAtMs,
        0,
        0,
        sourceMetrics
      );
      this.lastMetrics = metrics;
      logger.error({ error: this.toErrorMessage(error) }, "scrape failed unexpectedly");
      return { jobs: [], metrics };
    } finally {
      await browser.close().catch(() => undefined);
    }
  }

  async scrapeJobs(args: ScrapeJobsInput): Promise<ScrapedJob[]> {
    const result = await this.scrapeJobsWithMetrics(args);
    return result.jobs;
  }

  private createSourceMetric(source: JobSource): SourceScrapeMetrics {
    return {
      requests: 0,
      successes: 0,
      failures: 0,
      retries: 0,
      successRate: 0,
      failureRate: 0,
      executionMs: 0,
      circuitState: this.breakers[source].getState()
    };
  }

  private createMetricsSkeleton(
    startedAt: string,
    finishedAt: string,
    executionMs: number,
    totalJobsBeforeDeduplication: number,
    totalJobsAfterDeduplication: number,
    providedSourceMetrics?: Record<JobSource, SourceScrapeMetrics>
  ): ScrapeExecutionMetrics {
    const sources = providedSourceMetrics ?? {
      linkedin: this.createSourceMetric("linkedin"),
      indeed: this.createSourceMetric("indeed"),
      tanitjobs: this.createSourceMetric("tanitjobs")
    };

    for (const source of SCRAPER_SOURCES) {
      const attempts = sources[source].successes + sources[source].failures;
      sources[source].successRate = attempts ? Number((sources[source].successes / attempts).toFixed(3)) : 0;
      sources[source].failureRate = attempts ? Number((sources[source].failures / attempts).toFixed(3)) : 0;
      sources[source].circuitState = this.breakers[source].getState();
    }

    return {
      startedAt,
      finishedAt,
      executionMs,
      totalJobsBeforeDeduplication,
      totalJobsAfterDeduplication,
      sources
    };
  }

  private async scrapeSource(
    browser: Browser,
    source: JobSource,
    args: ScrapeJobsInput,
    metrics: SourceScrapeMetrics
  ): Promise<ScrapedJob[]> {
    const breaker = this.breakers[source];
    if (!breaker.canRequest()) {
      metrics.failures += 1;
      metrics.lastError = "Circuit breaker open";
      metrics.circuitState = breaker.getState();
      logger.warn({ source, circuitState: breaker.getState() }, "source skipped due to open circuit breaker");
      return [];
    }

    try {
      logger.info({ source }, "source scrape started");
      const jobs = await this.withRetry(source, metrics, async () => {
        if (source === "linkedin") return this.scrapeLinkedIn(browser, args);
        if (source === "indeed") return this.scrapeIndeed(browser, args);
        return this.scrapeTanitJobs(browser, args);
      });
      breaker.onSuccess();
      metrics.successes += 1;
      metrics.circuitState = breaker.getState();
      logger.info({ source, jobs: jobs.length }, "source scrape succeeded");
      return jobs;
    } catch (error) {
      breaker.onFailure();
      metrics.failures += 1;
      metrics.circuitState = breaker.getState();
      metrics.lastError = this.toErrorMessage(error);
      logger.error({ source, error: metrics.lastError, circuitState: breaker.getState() }, "source scrape failed");
      return [];
    }
  }

  private async withRetry<T>(source: JobSource, metrics: SourceScrapeMetrics, run: () => Promise<T>): Promise<T> {
    const config = SCRAPER_SOURCE_CONFIG[source];
    metrics.requests += 1;
    let attempt = 0;

    while (attempt <= config.maxRetries) {
      const startedAtMs = nowMs();
      try {
        const result = await run();
        logger.info({ source, attempt: attempt + 1, durationMs: nowMs() - startedAtMs }, "attempt succeeded");
        return result;
      } catch (error) {
        const message = this.toErrorMessage(error);
        const isLastAttempt = attempt === config.maxRetries;
        logger.warn({ source, attempt: attempt + 1, durationMs: nowMs() - startedAtMs, error: message }, "attempt failed");
        if (isLastAttempt) {
          throw error;
        }
        attempt += 1;
        metrics.retries += 1;
        const backoffDelayMs = config.backoffBaseMs * 2 ** (attempt - 1) + randomInt(100, 400);
        await delay(backoffDelayMs);
      }
    }

    throw new Error(`Unexpected retry exit for ${source}`);
  }

  private async createHumanContext(browser: Browser, source: JobSource): Promise<BrowserContext> {
    const proxy = buildProxySettings();
    if (proxy) {
      logger.info({ source, proxyServer: proxy.server }, "proxy enabled for context");
    }
    return browser.newContext({
      userAgent: pickRandom(SCRAPER_ANTIBOT_PROFILES.userAgents),
      viewport: pickRandom(SCRAPER_ANTIBOT_PROFILES.viewports),
      locale: pickRandom(SCRAPER_ANTIBOT_PROFILES.locales),
      timezoneId: pickRandom(SCRAPER_ANTIBOT_PROFILES.timezones),
      deviceScaleFactor: pickRandom(SCRAPER_ANTIBOT_PROFILES.deviceScaleFactors),
      colorScheme: pickRandom(SCRAPER_ANTIBOT_PROFILES.colorSchemes),
      proxy
    });
  }

  private async captureDebugArtifacts(page: Page, source: JobSource, label: string): Promise<void> {
    if (!DEBUG_ARTIFACTS_ENABLED) return;
    try {
      await fs.mkdir(DEBUG_ARTIFACTS_DIR, { recursive: true });
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const safeLabel = label.replace(/[^a-z0-9-_]+/gi, "-");
      const baseName = `${source}-${safeLabel}-${timestamp}`;
      const htmlPath = path.join(DEBUG_ARTIFACTS_DIR, `${baseName}.html`);
      const screenshotPath = path.join(DEBUG_ARTIFACTS_DIR, `${baseName}.png`);
      const [html] = await Promise.all([
        page.content().catch(() => ""),
        page.screenshot({ path: screenshotPath, fullPage: true }).catch(() => undefined)
      ]);
      if (html) {
        await fs.writeFile(htmlPath, html, "utf8");
      }
      logger.warn({ source, htmlPath, screenshotPath }, "saved debug artifacts");
    } catch (error) {
      logger.debug({ source, error: this.toErrorMessage(error) }, "failed to save debug artifacts");
    }
  }

  private async scrapeLinkedIn(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
    const context = await this.createHumanContext(browser, "linkedin");
    const page = await context.newPage();
    configurePage(page, "linkedin");
    const limit = args.limitPerSource ?? 10;
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;

    try {
      await gotoAndStabilize(page, "linkedin", url);
      await humanDelayFor("linkedin");
      const jobs = await page.evaluate(
        (innerLimit: number) => {
          const resolveUrl = (href: string): string => {
            if (!href) return "";
            try { return new URL(href, window.location.origin).toString(); } catch { return href; }
          };
          return Array.from(document.querySelectorAll(".base-card, .job-search-card, li"))
            .slice(0, innerLimit)
            .map((card) => {
              const title = card.querySelector("h3, .base-search-card__title")?.textContent?.trim() ?? "";
              const company = card.querySelector("h4, .base-search-card__subtitle")?.textContent?.trim() ?? "";
              const description =
                card.querySelector(".base-search-card__metadata, .job-search-card__snippet, p")?.textContent?.trim() ?? "";
              const locationText = card.querySelector(".job-search-card__location")?.textContent?.trim() ?? "";
              const link = (card.querySelector("a.base-card__full-link, a") as HTMLAnchorElement | null);
              const href = link?.getAttribute("href")?.trim() ?? link?.href?.trim() ?? "";
              const applyUrl = resolveUrl(href);
              return { title, company, description, locationText, applyUrl };
            })
            .filter((job) => job.title && job.applyUrl);
        },
        limit
      );

      let extractedJobs = jobs as ExtractedJob[];
      if (extractedJobs.length === 0) {
        const html = await page.content().catch(() => "");
        extractedJobs = parseJobsFromHtmlFallback(html, "linkedin", limit, args.location);
        logger.warn({ source: "linkedin" }, "using html fallback parser");
      }
      if (extractedJobs.length === 0) {
        await this.captureDebugArtifacts(page, "linkedin", "empty-results");
      }

      const normalized = await mapWithConcurrency(
        extractedJobs,
        SCRAPER_SOURCE_CONFIG.linkedin.maxConcurrentRequests,
        async (job): Promise<ScrapedJob | null> => {
          let detailPage: Page | undefined;
          let description = getDescriptionOrDefault(job);
          let applyEmail: string | null = null;

          try {
            const detailUrl = normalizeUrl(job.applyUrl, "linkedin");
            if (detailUrl) {
              detailPage = await context.newPage();
              configurePage(detailPage, "linkedin");
              await gotoAndStabilize(detailPage, "linkedin", detailUrl);
              const detailDescription =
                (await detailPage
                  .innerText(".show-more-less-html__markup, .description__text, .jobs-description__content")
                  .catch(() => "")) || stripTags(await detailPage.content().catch(() => ""));

              if (normalize(detailDescription)) {
                description = normalize(detailDescription);
              }

              const html = await detailPage.content().catch(() => "");
              const mailtoMatch = html.match(/mailto:([^\"'?>\s]+)/i);
              applyEmail = mailtoMatch?.[1] ? mailtoMatch[1].split("?")[0].trim() : extractEmailFromText(stripTags(html));
            }
          } catch (error) {
            logger.debug({ source: "linkedin", url: job.applyUrl, error: this.toErrorMessage(error) }, "linkedin detail enrichment failed");
          } finally {
            await detailPage?.close().catch(() => undefined);
          }

          return normalizeScrapedJob(
            {
              ...job,
              description,
              source: "linkedin",
              applyEmail
            },
            args
          );
        }
      );
      return normalized.filter(isPresent);
    } catch (error) {
      await this.captureDebugArtifacts(page, "linkedin", "list-error");
      throw error;
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
    }
  }

  private async scrapeIndeed(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
    const context = await this.createHumanContext(browser, "indeed");
    const page = await context.newPage();
    configurePage(page, "indeed");
    const limit = args.limitPerSource ?? 10;
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://fr.indeed.com/jobs?q=${query}&l=${location}`;

    try {
      await gotoAndStabilize(page, "indeed", url);
      await humanDelayFor("indeed");
      const jobs = await page.evaluate(
        (innerLimit: number) => {
          const resolveUrl = (href: string): string => {
            if (!href) return "";
            try { return new URL(href, window.location.origin).toString(); } catch { return href; }
          };
          return Array.from(document.querySelectorAll(".job_seen_beacon, .result, [data-testid='slider_item'], li"))
            .slice(0, innerLimit)
            .map((card) => {
              const title = card.querySelector("h2 a span, [data-testid='jobTitle']")?.textContent?.trim() ?? "";
              const company = card.querySelector("[data-testid='company-name'], .companyName")?.textContent?.trim() ?? "";
              const description = card.querySelector(".job-snippet, [data-testid='job-snippet']")?.textContent?.trim() ?? "";
              const locationText = card.querySelector("[data-testid='text-location'], .companyLocation")?.textContent?.trim() ?? "";
              const link =
                (card.querySelector("h2 a") as HTMLAnchorElement | null)?.getAttribute("href")?.trim() ??
                (card.querySelector("a[data-jk]") as HTMLAnchorElement | null)?.getAttribute("href")?.trim() ??
                "";
              return { title, company, description, locationText, applyUrl: resolveUrl(link) };
            })
            .filter((job) => job.title && job.applyUrl);
        },
        limit
      );

      let extractedJobs = jobs as ExtractedJob[];
      if (extractedJobs.length === 0) {
        const html = await page.content().catch(() => "");
        extractedJobs = parseJobsFromHtmlFallback(html, "indeed", limit, args.location);
        logger.warn({ source: "indeed" }, "using html fallback parser");
      }
      if (extractedJobs.length === 0) {
        await this.captureDebugArtifacts(page, "indeed", "empty-results");
      }

      return extractedJobs
        .map((job) =>
          normalizeScrapedJob(
            {
              ...job,
              source: "indeed"
            },
            args
          )
        )
        .filter(isPresent);
    } catch (error) {
      await this.captureDebugArtifacts(page, "indeed", "list-error");
      throw error;
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
    }
  }

  private async scrapeTanitJobs(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
    const context = await this.createHumanContext(browser, "tanitjobs");
    const page = await context.newPage();
    configurePage(page, "tanitjobs");
    const limit = args.limitPerSource ?? 10;
    const query = encodeURIComponent(args.keywords);
    const url = `https://www.tanitjobs.com/jobs/?q=${query}`;
    const cardSelectors = [
      "article",
      ".job-item",
      ".job-card",
      ".job",
      ".job-listing",
      ".listing-item",
      ".media",
      ".card",
      ".search-results li",
      ".jobs-list li",
      "[data-job-id]",
      "[data-job]",
      "li"
    ];
    const titleSelectors = [
      "h2 a",
      "h3 a",
      ".job-title a",
      ".job-card__title a",
      ".listing-title a",
      ".media-heading a",
      "a"
    ];
    const companySelectors = [
      ".company",
      ".job-company",
      ".job-card__company",
      ".listing-company",
      ".company-name",
      ".media-body .small"
    ];
    const descriptionSelectors = [
      ".description",
      ".job-description",
      ".job-card__description",
      ".listing-description",
      ".excerpt",
      "p"
    ];
    const locationSelectors = [
      ".location",
      ".job-location",
      ".job-card__location",
      ".listing-location",
      "[class*='location']"
    ];

    try {
      await gotoAndStabilize(page, "tanitjobs", url);
      await humanDelayFor("tanitjobs");
      await page
        .waitForSelector(cardSelectors.join(", "), { timeout: SCRAPER_SOURCE_CONFIG.tanitjobs.timeoutMs })
        .catch(() => undefined);

      const extractJobs = async () =>
        page.evaluate(
          ({
            innerLimit,
            cardSelectorList,
            titleSelectorList,
            companySelectorList,
            descriptionSelectorList,
            locationSelectorList
          }: {
            innerLimit: number;
            cardSelectorList: string[];
            titleSelectorList: string[];
            companySelectorList: string[];
            descriptionSelectorList: string[];
            locationSelectorList: string[];
          }) => {
            const resolveUrl = (href: string): string => {
              if (!href) return "";
              try { return new URL(href, window.location.origin).toString(); } catch { return href; }
            };
            const cards = Array.from(document.querySelectorAll(cardSelectorList.join(", ")));
            const titleSelector = titleSelectorList.join(", ");
            const companySelector = companySelectorList.join(", ");
            const descriptionSelector = descriptionSelectorList.join(", ");
            const locationSelector = locationSelectorList.join(", ");
            return cards
              .slice(0, innerLimit)
              .map((card) => {
                const title = card.querySelector(titleSelector)?.textContent?.trim() ?? "";
                const company = card.querySelector(companySelector)?.textContent?.trim() ?? "";
                const description = card.querySelector(descriptionSelector)?.textContent?.trim() ?? "";
                const locationText = card.querySelector(locationSelector)?.textContent?.trim() ?? "";
                const link = card.querySelector(titleSelector) as HTMLAnchorElement | null;
                const href = link?.getAttribute("href")?.trim() ?? link?.href?.trim() ?? "";
                return { title, company, description, locationText, applyUrl: resolveUrl(href) };
              })
              .filter((job) => job.title && job.applyUrl);
          },
          {
            innerLimit: limit,
            cardSelectorList: cardSelectors,
            titleSelectorList: titleSelectors,
            companySelectorList: companySelectors,
            descriptionSelectorList: descriptionSelectors,
            locationSelectorList: locationSelectors
          }
        );

      const jobs = await extractJobs();

      let extractedJobs = jobs as ExtractedJob[];
      if (extractedJobs.length === 0) {
        logger.warn({ source: "tanitjobs" }, "no jobs on first pass, waiting 5s before retry");
        await page.waitForTimeout(5000);
        const retryJobs = await extractJobs();
        extractedJobs = retryJobs as ExtractedJob[];
      }
      if (extractedJobs.length === 0) {
        const html = await page.content().catch(() => "");
        extractedJobs = parseJobsFromHtmlFallback(html, "tanitjobs", limit, args.location);
        logger.warn({ source: "tanitjobs" }, "using html fallback parser");
      }
      if (extractedJobs.length === 0) {
        await this.captureDebugArtifacts(page, "tanitjobs", "empty-results");
      }

      return extractedJobs
        .map((job) =>
          normalizeScrapedJob(
            {
              ...job,
              source: "tanitjobs"
            },
            args
          )
        )
        .filter(isPresent);
    } catch (error) {
      await this.captureDebugArtifacts(page, "tanitjobs", "list-error");
      throw error;
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
    }
  }

  private toErrorMessage(error: unknown): string {
    return error instanceof Error ? error.message : String(error);
  }
}

const scraperService = new JobScraperService();

export async function scrapeJobsWithMetrics(args: ScrapeJobsInput): Promise<ScrapeJobsResult> {
  return scraperService.scrapeJobsWithMetrics(args);
}

export async function scrapeJobs(args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  return scraperService.scrapeJobs(args);
}

export function getLastScrapeMetrics(): ScrapeExecutionMetrics | null {
  return scraperService.getLastMetrics();
}
