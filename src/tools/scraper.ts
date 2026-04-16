import { chromium, type Browser } from "playwright";

export type JobSource = "linkedin" | "tanitjobs" | "indeed";

export interface ScrapedJob {
  title: string;
  company: string;
  description: string;
  applyUrl: string;
  email?: string;
  source: JobSource;
  location: string;
}

export interface ScraperArgs {
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
  const match = text.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i);
  return match?.[0];
}

function deduplicateJobs(jobs: ScrapedJob[]): ScrapedJob[] {
  const seen = new Set<string>();
  const unique: ScrapedJob[] = [];

  for (const job of jobs) {
    const key = `${normalize(job.title).toLowerCase()}::${normalize(job.company).toLowerCase()}`;
    if (seen.has(key)) continue;
    seen.add(key);
    unique.push(job);
  }

  return unique;
}

async function scrapeLinkedIn(browser: Browser, args: ScraperArgs): Promise<ScrapedJob[]> {
  const page = await browser.newPage();

  try {
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://www.linkedin.com/jobs/search/?keywords=${query}&location=${location}`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: DEFAULT_TIMEOUT_MS });
    await page.waitForSelector(".job-search-card, .base-card", { timeout: DEFAULT_TIMEOUT_MS }).catch(() => {});

    const rawJobs = await page.evaluate((limit) => {
      const cards = Array.from(
        document.querySelectorAll(".job-search-card, .base-card, li")
      ).slice(0, limit);

      return cards
        .map((card) => {
          const title =
            card.querySelector(".base-search-card__title, .base-search-card__title span, h3")?.textContent?.trim() ?? "";
          const company =
            card.querySelector(".base-search-card__subtitle, h4, .job-search-card__subtitle")?.textContent?.trim() ?? "";
          const location =
            card.querySelector(".job-search-card__location, .job-search-card__location span")?.textContent?.trim() ?? "";
          const description =
            card.querySelector(".job-search-card__snippet, .job-search-card__snippet-text, p")?.textContent?.trim() ?? "";
          const applyUrl =
            (card.querySelector("a.base-card__full-link, a") as HTMLAnchorElement | null)?.href?.trim() ?? "";

          return { title, company, location, description, applyUrl };
        })
        .filter((job) => job.title && job.company && job.applyUrl);
    }, args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE);

    return rawJobs.map((job) => ({
      title: normalize(job.title),
      company: normalize(job.company),
      description: normalize(job.description),
      applyUrl: job.applyUrl,
      email: extractEmail(job.description),
      source: "linkedin" as const,
      location: normalize(job.location || args.location || "Non spécifiée"),
    }));
  } catch (error) {
    console.warn("⚠️ LinkedIn scraping failed:", error instanceof Error ? error.message : String(error));
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

async function scrapeTanitJobs(browser: Browser, args: ScraperArgs): Promise<ScrapedJob[]> {
  const page = await browser.newPage();

  try {
    const query = encodeURIComponent(args.keywords);
    const url = `https://www.tanitjobs.com/jobs/?q=${query}`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: DEFAULT_TIMEOUT_MS });
    await page.waitForSelector("article, .job-item, .search-results li", { timeout: DEFAULT_TIMEOUT_MS }).catch(() => {});

    const rawJobs = await page.evaluate((limit) => {
      const cards = Array.from(
        document.querySelectorAll("article, .job-item, .search-results li, .media")
      ).slice(0, limit);

      return cards
        .map((card) => {
          const title =
            card.querySelector("h2 a, h3 a, .job-title a, .media-heading a, a")?.textContent?.trim() ?? "";
          const company =
            card.querySelector(".company, .job-company, .listing-company, .media-body .small")?.textContent?.trim() ?? "";
          const location =
            card.querySelector(".location, .job-location, .listing-location, .fa-map-marker")?.parentElement?.textContent?.trim() ??
            "";
          const description =
            card.querySelector(".description, .job-description, .listing-description, p")?.textContent?.trim() ?? "";
          const applyUrl =
            (card.querySelector("h2 a, h3 a, .job-title a, .media-heading a, a") as HTMLAnchorElement | null)?.href?.trim() ??
            "";

          return { title, company, location, description, applyUrl };
        })
        .filter((job) => job.title && job.applyUrl);
    }, args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE);

    return rawJobs.map((job) => ({
      title: normalize(job.title),
      company: normalize(job.company || "Entreprise non précisée"),
      description: normalize(job.description),
      applyUrl: job.applyUrl,
      email: extractEmail(`${job.description} ${job.company}`),
      source: "tanitjobs" as const,
      location: normalize(job.location || args.location || "Tunisie"),
    }));
  } catch (error) {
    console.warn("⚠️ TanitJobs scraping failed:", error instanceof Error ? error.message : String(error));
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

async function scrapeIndeed(browser: Browser, args: ScraperArgs): Promise<ScrapedJob[]> {
  const page = await browser.newPage();

  try {
    const query = encodeURIComponent(args.keywords);
    const location = encodeURIComponent(args.location ?? "");
    const url = `https://fr.indeed.com/jobs?q=${query}&l=${location}`;

    await page.goto(url, { waitUntil: "domcontentloaded", timeout: DEFAULT_TIMEOUT_MS });
    await page.waitForSelector(".job_seen_beacon, .result, [data-testid='slider_item']", {
      timeout: DEFAULT_TIMEOUT_MS,
    }).catch(() => {});

    const rawJobs = await page.evaluate((limit) => {
      const cards = Array.from(
        document.querySelectorAll(".job_seen_beacon, .result, [data-testid='slider_item']")
      ).slice(0, limit);

      return cards
        .map((card) => {
          const title =
            card.querySelector("h2 a span, h2 a, [data-testid='jobTitle']")?.textContent?.trim() ?? "";
          const company =
            card.querySelector("[data-testid='company-name'], .companyName")?.textContent?.trim() ?? "";
          const location =
            card.querySelector("[data-testid='text-location'], .companyLocation")?.textContent?.trim() ?? "";
          const description =
            card.querySelector(".job-snippet, [data-testid='job-snippet']")?.textContent?.trim() ?? "";
          const linkNode =
            (card.querySelector("h2 a") as HTMLAnchorElement | null) ??
            (card.querySelector("a[data-jk]") as HTMLAnchorElement | null);
          const href = linkNode?.getAttribute("href")?.trim() ?? "";
          const applyUrl = href.startsWith("http") ? href : `https://fr.indeed.com${href}`;

          return { title, company, location, description, applyUrl };
        })
        .filter((job) => job.title && job.company && job.applyUrl);
    }, args.limitPerSource ?? DEFAULT_LIMIT_PER_SOURCE);

    return rawJobs.map((job) => ({
      title: normalize(job.title),
      company: normalize(job.company),
      description: normalize(job.description),
      applyUrl: job.applyUrl,
      email: extractEmail(job.description),
      source: "indeed" as const,
      location: normalize(job.location || args.location || "Non spécifiée"),
    }));
  } catch (error) {
    console.warn("⚠️ Indeed scraping failed:", error instanceof Error ? error.message : String(error));
    return [];
  } finally {
    await page.close().catch(() => {});
  }
}

export async function scrapeJobs(args: ScraperArgs): Promise<ScrapedJob[]> {
  if (!args.keywords || !args.keywords.trim()) {
    return [];
  }

  const browser = await chromium.launch({ headless: true });

  try {
    const [linkedinJobs, tanitJobs, indeedJobs] = await Promise.all([
      scrapeLinkedIn(browser, args),
      scrapeTanitJobs(browser, args),
      scrapeIndeed(browser, args),
    ]);

    return deduplicateJobs([...linkedinJobs, ...tanitJobs, ...indeedJobs]);
  } catch (error) {
    console.warn("⚠️ Unified scraping failed:", error instanceof Error ? error.message : String(error));
    return [];
  } finally {
    await browser.close().catch(() => {});
  }
}
