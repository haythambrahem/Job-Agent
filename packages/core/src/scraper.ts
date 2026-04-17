import { chromium, type Browser, type BrowserContext, type Page } from "playwright";
import type { ScrapedJob } from "./types.js";

export interface ScrapeJobsInput {
  keywords: string;
  location?: string;
  limitPerSource?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_LIMIT_PER_SOURCE = 10;
const MIN_HUMAN_DELAY_MS = 2_000;
const MAX_HUMAN_DELAY_MS = 3_000;

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 13_6_6) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36"
] as const;

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

type ExtractedJob = {
  title: string;
  company: string;
  description: string;
  locationText: string;
  applyUrl: string;
};

function getDescriptionOrDefault(job: ExtractedJob): string {
  const normalizedDescription = normalize(job.description);
  if (normalizedDescription) return normalizedDescription;
  return normalize(`${job.title} at ${job.company} - ${job.locationText}`);
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function humanDelay(min = MIN_HUMAN_DELAY_MS, max = MAX_HUMAN_DELAY_MS): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, randomInt(min, max)));
}

function pickUserAgent(): string {
  return USER_AGENTS[randomInt(0, USER_AGENTS.length - 1)] ?? USER_AGENTS[0];
}

async function newHumanContext(browser: Browser): Promise<BrowserContext> {
  return browser.newContext({
    userAgent: pickUserAgent(),
    viewport: {
      width: randomInt(1280, 1680),
      height: randomInt(720, 980)
    },
    locale: "en-US"
  });
}

function stripTags(html: string): string {
  return normalize(html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " "));
}

function extractEmailFromText(text: string): string | null {
  const match = text.match(/[\w.+-]+@[\w-]+\.[a-zA-Z]{2,}/);
  return match ? match[0] : null;
}

function absolutizeUrl(url: string, source: "linkedin" | "tanitjobs" | "indeed"): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http")) return trimmed;

  if (source === "indeed") {
    return `https://fr.indeed.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  }

  if (source === "tanitjobs") {
    return `https://www.tanitjobs.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  }

  if (source === "linkedin") {
    return `https://www.linkedin.com${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
  }

  return trimmed;
}

function looksLikeJobUrl(href: string, source: "linkedin" | "tanitjobs" | "indeed"): boolean {
  const value = href.toLowerCase();
  if (source === "linkedin") return value.includes("/jobs/");
  if (source === "indeed") return value.includes("viewjob") || value.includes("/rc/clk") || value.includes("/pagead/");
  return value.includes("job") || value.includes("offre") || value.includes("emploi");
}

function parseJobsFromHtmlFallback(
  html: string,
  source: "linkedin" | "tanitjobs" | "indeed",
  limit: number,
  location?: string
): ExtractedJob[] {
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
    const nearText = stripTags(html.slice(windowStart, windowEnd));

    jobs.push({
      title,
      company: source === "tanitjobs" ? "Unknown company" : "Unknown",
      description: nearText,
      locationText: location ?? "Unknown",
      applyUrl: absolutizeUrl(href, source)
    });
  }

  return jobs;
}

async function gotoAndStabilize(page: Page, url: string): Promise<void> {
  await humanDelay();
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: DEFAULT_TIMEOUT_MS });
  await humanDelay();
}

async function extractApplyEmail(page: Page): Promise<string | null> {
  const html = await page.content().catch(() => "");
  const mailtoMatch = html.match(/mailto:([^\"'?>\s]+)/i);
  if (mailtoMatch?.[1]) return mailtoMatch[1].split("?")[0].trim();
  return extractEmailFromText(stripTags(html));
}

async function scrapeLinkedIn(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  const context = await newHumanContext(browser);
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;

    await gotoAndStabilize(page, url);

    await humanDelay();
    const jobs = await page.evaluate(
      (limit: number) =>
        Array.from(document.querySelectorAll(".base-card, .job-search-card, li"))
          .slice(0, limit)
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
      args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE
    );

    let extractedJobs = jobs as ExtractedJob[];
    if (extractedJobs.length === 0) {
      const html = await page.content().catch(() => "");
      extractedJobs = parseJobsFromHtmlFallback(
        html,
        "linkedin",
        args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE,
        args.location
      );
      console.warn("[scraper] linkedin used page.content fallback parsing");
    }

    const enrichedJobs: ScrapedJob[] = [];

    for (const job of extractedJobs) {
      let description = getDescriptionOrDefault(job);
      let applyEmail: string | null = null;

      try {
        await humanDelay();
        await gotoAndStabilize(page, job.applyUrl);
        const detailDescription =
          (await page
            .innerText(".show-more-less-html__markup, .description__text, .jobs-description__content")
            .catch(() => "")) || stripTags(await page.content().catch(() => ""));

        if (normalize(detailDescription)) {
          description = normalize(detailDescription);
        }

        applyEmail = await extractApplyEmail(page);
      } catch {
        applyEmail = null;
      }

      enrichedJobs.push({
        title: normalize(job.title),
        company: normalize(job.company || "Unknown"),
        description,
        url: job.applyUrl,
        source: "linkedin",
        location: normalize(job.locationText || args.location || "Unknown"),
        applyEmail
      });
    }

    return enrichedJobs;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scraper] linkedin scraping failed: ${message}`);
    return [];
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}

async function scrapeIndeed(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  const context = await newHumanContext(browser);
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://fr.indeed.com/jobs?q=${query}&l=${location}`;

    await gotoAndStabilize(page, url);

    await humanDelay();
    const jobs = await page.evaluate(
      (limit: number) =>
        Array.from(document.querySelectorAll(".job_seen_beacon, .result, [data-testid='slider_item'], li"))
          .slice(0, limit)
          .map((card) => {
            const title = card.querySelector("h2 a span, [data-testid='jobTitle']")?.textContent?.trim() ?? "";
            const company = card.querySelector("[data-testid='company-name'], .companyName")?.textContent?.trim() ?? "";
            const description = card.querySelector(".job-snippet, [data-testid='job-snippet']")?.textContent?.trim() ?? "";
            const locationText = card.querySelector("[data-testid='text-location'], .companyLocation")?.textContent?.trim() ?? "";
            const link =
              (card.querySelector("h2 a") as HTMLAnchorElement | null)?.getAttribute("href")?.trim() ??
              (card.querySelector("a[data-jk]") as HTMLAnchorElement | null)?.getAttribute("href")?.trim() ??
              "";
            const applyUrl = link.startsWith("http") ? link : `https://fr.indeed.com${link}`;
            return { title, company, description, locationText, applyUrl };
          })
          .filter((job) => job.title && job.applyUrl),
      args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE
    );

    let extractedJobs = jobs as ExtractedJob[];
    if (extractedJobs.length === 0) {
      const html = await page.content().catch(() => "");
      extractedJobs = parseJobsFromHtmlFallback(
        html,
        "indeed",
        args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE,
        args.location
      );
      console.warn("[scraper] indeed used page.content fallback parsing");
    }

    return extractedJobs.map((job: ExtractedJob) => ({
      title: normalize(job.title),
      company: normalize(job.company || "Unknown"),
      description: getDescriptionOrDefault(job),
      url: job.applyUrl,
      source: "indeed",
      location: normalize(job.locationText || args.location || "Unknown")
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scraper] indeed scraping failed: ${message}`);
    return [];
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}

async function scrapeTanitJobs(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  const context = await newHumanContext(browser);
  const page = await context.newPage();

  try {
    const query = encodeURIComponent(args.keywords);
    const url = `https://www.tanitjobs.com/jobs/?q=${query}`;

    await gotoAndStabilize(page, url);

    await humanDelay();
    const jobs = await page.evaluate(
      (limit: number) =>
        Array.from(document.querySelectorAll("article, .job-item, .search-results li, .media, li"))
          .slice(0, limit)
          .map((card) => {
            const title = card.querySelector("h2 a, h3 a, .job-title a, .media-heading a, a")?.textContent?.trim() ?? "";
            const company =
              card.querySelector(".company, .job-company, .listing-company, .media-body .small")?.textContent?.trim() ?? "";
            const description = card.querySelector(".description, .job-description, p")?.textContent?.trim() ?? "";
            const locationText = card.querySelector(".location, .job-location, .listing-location")?.textContent?.trim() ?? "";
            const applyUrl =
              (card.querySelector("h2 a, h3 a, .job-title a, .media-heading a, a") as HTMLAnchorElement | null)?.href?.trim() ?? "";
            return { title, company, description, locationText, applyUrl };
          })
          .filter((job) => job.title && job.applyUrl),
      args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE
    );

    let extractedJobs = jobs as ExtractedJob[];
    if (extractedJobs.length === 0) {
      const html = await page.content().catch(() => "");
      extractedJobs = parseJobsFromHtmlFallback(
        html,
        "tanitjobs",
        args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE,
        args.location
      );
      console.warn("[scraper] tanitjobs used page.content fallback parsing");
    }

    return extractedJobs.map((job: ExtractedJob) => ({
      title: normalize(job.title),
      company: normalize(job.company || "Unknown company"),
      description: getDescriptionOrDefault(job),
      url: job.applyUrl,
      source: "tanitjobs",
      location: normalize(job.locationText || args.location || "Tunisie")
    }));
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scraper] tanitjobs scraping failed: ${message}`);
    return [];
  } finally {
    await page.close().catch(() => undefined);
    await context.close().catch(() => undefined);
  }
}

export async function scrapeJobs(args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  if (!args.keywords.trim()) {
    console.warn("[scraper] missing keywords; skipping scraping");
    return [];
  }

  const browser = await chromium.launch({ headless: false });
  try {
    const runSource = async (source: "linkedin" | "tanitjobs" | "indeed", fn: () => Promise<ScrapedJob[]>): Promise<ScrapedJob[]> => {
      console.log(`[scraper] starting ${source} scraping`);
      try {
        const jobs = await fn();
        console.log(`[scraper] ${source} jobs found: ${jobs.length}`);
        return jobs;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.error(`[scraper] ${source} scraping failed: ${message}`);
        return [];
      }
    };

    const linkedin = await runSource("linkedin", () => scrapeLinkedIn(browser, args));
    await humanDelay();
    const tanitJobs = await runSource("tanitjobs", () => scrapeTanitJobs(browser, args));
    await humanDelay();
    const indeed = await runSource("indeed", () => scrapeIndeed(browser, args));

    const merged = dedupe([...linkedin, ...tanitJobs, ...indeed]);
    console.log(`[scraper] total deduped jobs: ${merged.length}`);
    return merged;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[scraper] unified scraping failed: ${message}`);
    return [];
  } finally {
    await browser.close().catch(() => undefined);
  }
}
