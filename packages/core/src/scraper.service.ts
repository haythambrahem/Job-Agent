import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
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

function nowMs(): number {
  return Date.now();
}

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
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

function absolutizeUrl(url: string, source: JobSource): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;
  if (source === "indeed") return `https://fr.indeed.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  if (source === "tanitjobs") return `https://www.tanitjobs.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  return `https://www.linkedin.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
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
      company: source === "tanitjobs" ? "Unknown company" : "Unknown",
      description: stripTags(html.slice(windowStart, windowEnd)),
      locationText: location ?? "Unknown",
      applyUrl: absolutizeUrl(href, source)
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

    const browser = await chromium.launch({ headless: process.env.SCRAPER_HEADLESS !== "false" });
    try {
      const results = await Promise.all(
        SCRAPER_SOURCES.map(async (source) => {
          sourceTimers[source] = nowMs();
          const jobs = await this.scrapeSource(browser, source, args, sourceMetrics[source]);
          sourceMetrics[source].executionMs = nowMs() - sourceTimers[source];
          return jobs;
        })
      );

      const merged = results.flat();
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
      logger.error({ error: this.toErrorMessage(error) }, "scrape failed unexpectedly");
      throw error;
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

  private async createHumanContext(browser: Browser): Promise<BrowserContext> {
    return browser.newContext({
      userAgent: pickRandom(SCRAPER_ANTIBOT_PROFILES.userAgents),
      viewport: pickRandom(SCRAPER_ANTIBOT_PROFILES.viewports),
      locale: "en-US"
    });
  }

  private async scrapeLinkedIn(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
    const context = await this.createHumanContext(browser);
    const page = await context.newPage();
    const limit = args.limitPerSource ?? 10;
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;

    try {
      await gotoAndStabilize(page, "linkedin", url);
      await humanDelayFor("linkedin");
      const jobs = await page.evaluate(
        (innerLimit: number) =>
          Array.from(document.querySelectorAll(".base-card, .job-search-card, li"))
            .slice(0, innerLimit)
            .map((card) => {
              const title = card.querySelector("h3, .base-search-card__title")?.textContent?.trim() ?? "";
              const company = card.querySelector("h4, .base-search-card__subtitle")?.textContent?.trim() ?? "";
              const description =
                card.querySelector(".base-search-card__metadata, .job-search-card__snippet, p")?.textContent?.trim() ?? "";
              const locationText = card.querySelector(".job-search-card__location")?.textContent?.trim() ?? "";
              const applyUrl = (card.querySelector("a.base-card__full-link, a") as HTMLAnchorElement | null)?.href?.trim() ?? "";
              return { title, company, description, locationText, applyUrl };
            })
            .filter((job) => job.title && job.applyUrl),
        limit
      );

      let extractedJobs = jobs as ExtractedJob[];
      if (extractedJobs.length === 0) {
        const html = await page.content().catch(() => "");
        extractedJobs = parseJobsFromHtmlFallback(html, "linkedin", limit, args.location);
        logger.warn({ source: "linkedin" }, "using html fallback parser");
      }

      return mapWithConcurrency(
        extractedJobs,
        SCRAPER_SOURCE_CONFIG.linkedin.maxConcurrentRequests,
        async (job): Promise<ScrapedJob> => {
          let detailPage: import("playwright").Page | undefined;
          let description = getDescriptionOrDefault(job);
          let applyEmail: string | null = null;

          try {
            detailPage = await context.newPage();
            await gotoAndStabilize(detailPage, "linkedin", job.applyUrl);
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
          } catch (error) {
            logger.debug({ source: "linkedin", url: job.applyUrl, error: this.toErrorMessage(error) }, "linkedin detail enrichment failed");
          } finally {
            await detailPage?.close().catch(() => undefined);
          }

          return {
            title: normalize(job.title),
            company: normalize(job.company || "Unknown"),
            description,
            url: job.applyUrl,
            source: "linkedin",
            location: normalize(job.locationText || args.location || "Unknown"),
            applyEmail
          };
        }
      );
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
    }
  }

  private async scrapeIndeed(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
    const context = await this.createHumanContext(browser);
    const page = await context.newPage();
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

      return extractedJobs.map((job) => ({
        title: normalize(job.title),
        company: normalize(job.company || "Unknown"),
        description: getDescriptionOrDefault(job),
        url: job.applyUrl,
        source: "indeed",
        location: normalize(job.locationText || args.location || "Unknown")
      }));
    } finally {
      await page.close().catch(() => undefined);
      await context.close().catch(() => undefined);
    }
  }

  private async scrapeTanitJobs(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
    const context = await this.createHumanContext(browser);
    const page = await context.newPage();
    const limit = args.limitPerSource ?? 10;
    const query = encodeURIComponent(args.keywords);
    const url = `https://www.tanitjobs.com/jobs/?q=${query}`;

    try {
      await gotoAndStabilize(page, "tanitjobs", url);
      await humanDelayFor("tanitjobs");

      const tanitEvaluator = (innerLimit: number) => {
        const resolveUrl = (href: string): string => {
          if (!href) return "";
          try { return new URL(href, window.location.origin).toString(); } catch { return href; }
        };
        return Array.from(document.querySelectorAll("article, .job-item, .job, .media, .card, .search-results li, li"))
          .slice(0, innerLimit)
          .map((card) => {
            const title = card.querySelector("h2 a, h3 a, .job-title a, .media-heading a, a")?.textContent?.trim() ?? "";
            const company =
              card.querySelector(".company, .job-company, .listing-company, .media-body .small")?.textContent?.trim() ?? "";
            const description = card.querySelector(".description, .job-description, p")?.textContent?.trim() ?? "";
            const locationText = card.querySelector(".location, .job-location, .listing-location")?.textContent?.trim() ?? "";
            const href =
              (card.querySelector("h2 a, h3 a, .job-title a, .media-heading a, a") as HTMLAnchorElement | null)?.getAttribute(
                "href"
              )?.trim() ?? "";
            return { title, company, description, locationText, applyUrl: resolveUrl(href) };
          })
          .filter((job) => job.title && job.applyUrl);
      };

      const jobs = await page.evaluate(tanitEvaluator, limit);

      let extractedJobs = jobs as ExtractedJob[];
      if (extractedJobs.length === 0) {
        logger.warn({ source: "tanitjobs" }, "no jobs on first pass, waiting 5s before retry");
        await page.waitForTimeout(5000);
        const retryJobs = await page.evaluate(tanitEvaluator, limit);
        extractedJobs = retryJobs as ExtractedJob[];
      }
      if (extractedJobs.length === 0) {
        const html = await page.content().catch(() => "");
        extractedJobs = parseJobsFromHtmlFallback(html, "tanitjobs", limit, args.location);
        logger.warn({ source: "tanitjobs" }, "using html fallback parser");
      }

      return extractedJobs.map((job) => ({
        title: normalize(job.title),
        company: normalize(job.company || "Unknown company"),
        description: getDescriptionOrDefault(job),
        url: job.applyUrl,
        source: "tanitjobs",
        location: normalize(job.locationText || args.location || "Tunisie")
      }));
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
