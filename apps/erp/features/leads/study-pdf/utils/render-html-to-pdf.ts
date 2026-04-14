import { chromium } from "playwright";

export async function renderHtmlToPdfBuffer(html: string): Promise<Buffer> {
  let browser;
  try {
    browser = await chromium.launch({ headless: true });
  } catch {
    // Fallback: utilise Chrome local si le binaire Playwright n'est pas installé.
    browser = await chromium.launch({ channel: "chrome", headless: true });
  }

  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle" });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: true,
    });
    return Buffer.from(pdf);
  } finally {
    await browser.close();
  }
}
