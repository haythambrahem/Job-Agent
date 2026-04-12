import { chromium } from "playwright";

export async function searchJobs(args: any): Promise<string> {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  const q = encodeURIComponent(args.keywords);
  const loc = encodeURIComponent(args.location || "");
  await page.goto(`https://www.linkedin.com/jobs/search/?keywords=${q}&location=${loc}`);
  await page.waitForSelector(".job-search-card", { timeout: 15000 }).catch(() => {});
  const jobs = await page.evaluate(() =>
    Array.from(document.querySelectorAll(".job-search-card")).slice(0, 5).map(c => ({
      title: c.querySelector(".base-search-card__title")?.textContent?.trim(),
      company: c.querySelector(".base-search-card__subtitle")?.textContent?.trim(),
      location: c.querySelector(".job-search-card__location")?.textContent?.trim(),
      link: (c.querySelector("a") as HTMLAnchorElement)?.href
    }))
  );
  await browser.close();
  return JSON.stringify(jobs, null, 2);
}