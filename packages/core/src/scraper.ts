import { chromium, type Browser } from "playwright";
import type { ScrapedJob } from "./types.js";

export interface ScrapeJobsInput {
  keywords: string;
  location?: string;
  limitPerSource?: number;
}

const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_LIMIT_PER_SOURCE = 10;

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

async function scrapeLinkedIn(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  const page = await browser.newPage();
  try {
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: DEFAULT_TIMEOUT_MS });
    await page.waitForSelector(".job-search-card, .base-card", { timeout: DEFAULT_TIMEOUT_MS }).catch(() => undefined);

    const jobs = await page.evaluate((limit) =>
      Array.from(document.querySelectorAll(".job-search-card, .base-card, li"))
        .slice(0, limit)
        .map((card) => {
          const title = card.querySelector(".base-search-card__title, h3")?.textContent?.trim() ?? "";
          const company = card.querySelector(".base-search-card__subtitle, h4")?.textContent?.trim() ?? "";
          const description = card.querySelector(".job-search-card__snippet, p")?.textContent?.trim() ?? "";
          const locationText = card.querySelector(".job-search-card__location")?.textContent?.trim() ?? "";
          const applyUrl = (card.querySelector("a.base-card__full-link, a") as HTMLAnchorElement | null)?.href?.trim() ?? "";
          return { title, company, description, locationText, applyUrl };
        })
        .filter((job) => job.title && job.company && job.applyUrl),
      args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE
    );

    return jobs.map((job) => ({
      title: normalize(job.title),
      company: normalize(job.company),
      description: normalize(job.description),
      url: job.applyUrl,
      source: "linkedin",
      location: normalize(job.locationText || args.location || "Unknown"),
      email: extractEmail(job.description)
    }));
  } catch {
    return [];
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

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: DEFAULT_TIMEOUT_MS });
    await page.waitForSelector(".job_seen_beacon, .result", { timeout: DEFAULT_TIMEOUT_MS }).catch(() => undefined);

    const jobs = await page.evaluate((limit) =>
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

    return jobs.map((job) => ({
      title: normalize(job.title),
      company: normalize(job.company),
      description: normalize(job.description),
      url: job.applyUrl,
      source: "indeed",
      location: normalize(job.locationText || args.location || "Unknown"),
      email: extractEmail(job.description)
    }));
  } catch {
    return [];
  } finally {
    await page.close().catch(() => undefined);
  }
}

async function scrapeTanitJobs(browser: Browser, args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  const page = await browser.newPage();
  try {
    const query = encodeURIComponent(args.keywords);
    const url = `https://www.tanitjobs.com/jobs/?q=${query}`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: DEFAULT_TIMEOUT_MS });
    await page.waitForSelector("article, .job-item, .search-results li", { timeout: DEFAULT_TIMEOUT_MS }).catch(() => undefined);

    const jobs = await page.evaluate((limit) =>
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

    return jobs.map((job) => ({
      title: normalize(job.title),
      company: normalize(job.company || "Unknown company"),
      description: normalize(job.description),
      url: job.applyUrl,
      source: "tanitjobs",
      location: normalize(job.locationText || args.location || "Tunisie"),
      email: extractEmail(job.description)
    }));
  } catch {
    return [];
  } finally {
    await page.close().catch(() => undefined);
  }
}

export async function scrapeJobs(args: ScrapeJobsInput): Promise<ScrapedJob[]> {
  if (!args.keywords.trim()) return [];

  const browser = await chromium.launch({ headless: true });
  try {
    const [linkedin, tanitJobs, indeed] = await Promise.all([
      scrapeLinkedIn(browser, args),
      scrapeTanitJobs(browser, args),
      scrapeIndeed(browser, args)
    ]);

    return dedupe([...linkedin, ...tanitJobs, ...indeed]);
  } finally {
    await browser.close().catch(() => undefined);
  }
}
