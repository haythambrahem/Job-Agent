import { chromium } from "playwright";

export interface Job {
  title: string;
  company: string;
  description: string;
  email?: string;
  applyUrl: string;
  source: "LinkedIn" | "TanitJobs" | "Indeed";
  location: string;
}

// Deduplicate jobs by title + company
function deduplicateJobs(jobs: Job[]): Job[] {
  const seen = new Set<string>();
  return jobs.filter(job => {
    const key = `${job.title}|${job.company}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

export async function scraperLinkedIn(keywords: string, location: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    const q = encodeURIComponent(keywords);
    const loc = encodeURIComponent(location || "");
    const url = `https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`;
    
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForSelector(".job-search-card", { timeout: 10000 }).catch(() => {});

    const jobList = await page.evaluate(() => {
      return Array.from(document.querySelectorAll(".job-search-card")).slice(0, 10).map(card => ({
        title: (card.querySelector(".base-search-card__title") as HTMLElement)?.innerText?.trim() || "",
        company: (card.querySelector(".base-search-card__subtitle") as HTMLElement)?.innerText?.trim() || "",
        location: (card.querySelector(".job-search-card__location") as HTMLElement)?.innerText?.trim() || "",
        url: (card.querySelector("a") as HTMLAnchorElement)?.href || "",
        description: (card.querySelector(".base-search-card__info") as HTMLElement)?.innerText?.trim() || ""
      }));
    });

    for (const job of jobList) {
      if (job.title && job.company) {
        jobs.push({
          title: job.title,
          company: job.company,
          description: job.description || job.title,
          applyUrl: job.url || "",
          source: "LinkedIn",
          location: job.location
        });
      }
    }
  } catch (err: any) {
    console.error("❌ LinkedIn scraper error:", err.message);
  } finally {
    await browser.close();
  }

  return jobs;
}

export async function scraperTanitJobs(keywords: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    const q = encodeURIComponent(keywords);
    const url = `https://www.tanitjobs.com/jobs/?q=${q}`;

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForSelector("a[data-job-id]", { timeout: 10000 }).catch(() => {});

    const jobList = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[data-job-id]")).slice(0, 10).map(card => ({
        title: (card.querySelector(".job-title") as HTMLElement)?.innerText?.trim() || (card.textContent?.split("\n")[0] || ""),
        company: (card.querySelector(".company-name") as HTMLElement)?.innerText?.trim() || (card.textContent?.split("\n")[1] || ""),
        location: (card.querySelector(".job-location") as HTMLElement)?.innerText?.trim() || "",
        url: (card as HTMLAnchorElement)?.href || "",
        description: card.textContent?.trim() || ""
      }));
    });

    for (const job of jobList) {
      if (job.title && job.company) {
        jobs.push({
          title: job.title,
          company: job.company,
          description: job.description.substring(0, 200),
          applyUrl: job.url || "",
          source: "TanitJobs",
          location: job.location
        });
      }
    }
  } catch (err: any) {
    console.error("❌ TanitJobs scraper error:", err.message);
  } finally {
    await browser.close();
  }

  return jobs;
}

export async function scraperIndeed(keywords: string, location: string): Promise<Job[]> {
  const jobs: Job[] = [];
  const browser = await chromium.launch({ headless: true });

  try {
    const page = await browser.newPage();
    const q = encodeURIComponent(keywords);
    const loc = encodeURIComponent(location || "");
    const url = `https://fr.indeed.com/jobs?q=${q}&l=${loc}`;

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 }).catch(() => {});
    await page.waitForSelector("a[data-jk]", { timeout: 10000 }).catch(() => {});

    const jobList = await page.evaluate(() => {
      return Array.from(document.querySelectorAll("a[data-jk]")).slice(0, 10).map(card => ({
        title: (card.querySelector(".jcs-JobTitle") as HTMLElement)?.innerText?.trim() || "",
        company: (card.querySelector(".companyName") as HTMLElement)?.innerText?.trim() || "",
        location: (card.querySelector(".companyLocation") as HTMLElement)?.innerText?.trim() || "",
        url: (card as HTMLAnchorElement)?.href || "",
        description: (card.querySelector(".job-snippet") as HTMLElement)?.innerText?.trim() || ""
      }));
    });

    for (const job of jobList) {
      if (job.title && job.company) {
        jobs.push({
          title: job.title,
          company: job.company,
          description: job.description || job.title,
          applyUrl: job.url || "",
          source: "Indeed",
          location: job.location
        });
      }
    }
  } catch (err: any) {
    console.error("❌ Indeed scraper error:", err.message);
  } finally {
    await browser.close();
  }

  return jobs;
}

export async function scrapeAllSources(keywords: string, location: string): Promise<Job[]> {
  console.log(`\n🕷️ Scraping for "${keywords}" in "${location}"...`);

  const [linkedInJobs, tanitJobs, indeedJobs] = await Promise.all([
    scraperLinkedIn(keywords, location),
    scraperTanitJobs(keywords),
    scraperIndeed(keywords, location)
  ]);

  const allJobs = [...linkedInJobs, ...tanitJobs, ...indeedJobs];
  const deduped = deduplicateJobs(allJobs);

  console.log(`✅ Found ${deduped.length} unique jobs (${linkedInJobs.length} LinkedIn, ${tanitJobs.length} TanitJobs, ${indeedJobs.length} Indeed)`);
  return deduped;
}
