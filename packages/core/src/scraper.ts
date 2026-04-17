import { chromium, type Browser } from "playwright";
import type { ScrapedJob } from "./types.js";

export interface ScrapeJobsInput {
  keywords: string;
  location?: string;
  limitPerSource?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_LIMIT_PER_SOURCE = 10;
const SCRAPE_DELAY_MS = 2_500;

function normalize(value: string): string {
  return value.replace(/\s+/g, " ").trim();
}

function extractEmail(text: string): string | undefined {
  const match = text.match(/[\w._%+-]+@[\w.-]+\.[a-zA-Z]{2,}/);
  return match?.[0];
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

async function gotoAndStabilize(page: Awaited<ReturnType<Browser["newPage"]>>, url: string): Promise<void> {
  await page.goto(url, { waitUntil: "networkidle", timeout: DEFAULT_TIMEOUT_MS });
  await page.waitForTimeout(SCRAPE_DELAY_MS);
}

async function scrapeLinkedIn(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  const page = await browser.newPage();
  try {
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;

    await gotoAndStabilize(page, url);
    await page.waitForSelector(".base-card", { timeout: DEFAULT_TIMEOUT_MS }).catch((error) => {
      throw new Error(
        `LinkedIn selector wait failed (.base-card): ${error instanceof Error ? error.message : String(error)}`
      );
    });

    const jobs = await page.evaluate(
      (limit: number) =>
        Array.from(document.querySelectorAll(".base-card"))
          .slice(0, limit)
          .map((card) => {
            const title = card.querySelector("h3")?.textContent?.trim() ?? "";
            const company = card.querySelector("h4")?.textContent?.trim() ?? "";
            const description = card.querySelector(".base-search-card__metadata, .job-search-card__snippet, p")?.textContent?.trim() ?? "";
            const locationText = card.querySelector(".job-search-card__location")?.textContent?.trim() ?? "";
            const applyUrl = (card.querySelector("a.base-card__full-link, a") as HTMLAnchorElement | null)?.href?.trim() ?? "";
            return { title, company, description, locationText, applyUrl };
          })
          .filter((job) => job.title && job.company && job.applyUrl),
      args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE
    );

    return (jobs as ExtractedJob[]).map((job: ExtractedJob) => ({
      title: normalize(job.title),
      company: normalize(job.company),
      description: getDescriptionOrDefault(job),
      url: job.applyUrl,
      source: "linkedin",
      location: normalize(job.locationText || args.location || "Unknown"),
      email: extractEmail(job.description)
    }));
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function scrapeIndeed(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  const page = await browser.newPage();
  try {
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://fr.indeed.com/jobs?q=${query}&l=${location}`;

    await gotoAndStabilize(page, url);
    await page
      .waitForSelector(".job_seen_beacon, .result, [data-testid='slider_item']", { timeout: DEFAULT_TIMEOUT_MS })
      .catch((error) => {
        throw new Error(
          `Indeed selector wait failed (.job_seen_beacon/.result/[data-testid='slider_item']): ${
            error instanceof Error ? error.message : String(error)
          }`
        );
      });

    const jobs = await page.evaluate(
      (limit: number) =>
        Array.from(document.querySelectorAll(".job_seen_beacon, .result, [data-testid='slider_item']"))
          .slice(0, limit)
          .map((card) => {
            const title = card.querySelector("h2 a span, [data-testid='jobTitle']")?.textContent?.trim() ?? "";
            const company = card.querySelector("[data-testid='company-name'], .companyName")?.textContent?.trim() ?? "";
            const description = card.querySelector(".job-snippet, [data-testid='job-snippet']")?.textContent?.trim() ?? "";
            const locationText = card.querySelector("[data-testid='text-location'], .companyLocation")?.textContent?.trim() ?? "";
            const link = (card.querySelector("h2 a") as HTMLAnchorElement | null)?.getAttribute("href")?.trim() ?? "";
            const applyUrl = link.startsWith("http") ? link : `https://fr.indeed.com${link}`;
            return { title, company, description, locationText, applyUrl };
          })
          .filter((job) => job.title && job.company && job.applyUrl),
      args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE
    );

    return (jobs as ExtractedJob[]).map((job: ExtractedJob) => ({
      title: normalize(job.title),
      company: normalize(job.company),
      description: getDescriptionOrDefault(job),
      url: job.applyUrl,
      source: "indeed",
      location: normalize(job.locationText || args.location || "Unknown"),
      email: extractEmail(job.description)
    }));
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function scrapeTanitJobs(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  const page = await browser.newPage();
  try {
    const query = encodeURIComponent(args.keywords);
    const url = `https://www.tanitjobs.com/jobs/?q=${query}`;

    await gotoAndStabilize(page, url);
    await page.waitForSelector("article, .job-item, .search-results li", { timeout: DEFAULT_TIMEOUT_MS }).catch((error) => {
      throw new Error(
        `TanitJobs selector wait failed (article/.job-item/.search-results li): ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    });

    const jobs = await page.evaluate(
      (limit: number) =>
        Array.from(document.querySelectorAll("article, .job-item, .search-results li, .media"))
          .slice(0, limit)
          .map((card) => {
            const title = card.querySelector("h2 a, h3 a, .job-title a, .media-heading a")?.textContent?.trim() ?? "";
            const company = card.querySelector(".company, .job-company, .listing-company")?.textContent?.trim() ?? "";
            const description = card.querySelector(".description, .job-description, p")?.textContent?.trim() ?? "";
            const locationText = card.querySelector(".location, .job-location, .listing-location")?.textContent?.trim() ?? "";
            const applyUrl = (card.querySelector("h2 a, h3 a, .job-title a, .media-heading a") as HTMLAnchorElement | null)?.href?.trim() ?? "";
            return { title, company, description, locationText, applyUrl };
          })
          .filter((job) => job.title && job.applyUrl),
      args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE
    );

    return (jobs as ExtractedJob[]).map((job: ExtractedJob) => ({
      title: normalize(job.title),
      company: normalize(job.company || "Unknown company"),
      description: getDescriptionOrDefault(job),
      url: job.applyUrl,
      source: "tanitjobs",
      location: normalize(job.locationText || args.location || "Tunisie"),
      email: extractEmail(job.description)
    }));
  } finally {
    await page.close().catch(() => undefined);
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

    const [linkedin, tanitJobs, indeed] = await Promise.all([
      runSource("linkedin", () => scrapeLinkedIn(browser, args)),
      runSource("tanitjobs", () => scrapeTanitJobs(browser, args)),
      runSource("indeed", () => scrapeIndeed(browser, args))
    ]);

    const merged = dedupe([...linkedin, ...tanitJobs, ...indeed]);
    console.log(`[scraper] total deduped jobs: ${merged.length}`);
    return merged;
  } finally {
    await browser.close().catch(() => undefined);
  }
}
