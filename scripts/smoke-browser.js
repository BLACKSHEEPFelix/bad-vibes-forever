const { spawn } = require("node:child_process");
const fs = require("node:fs/promises");
const path = require("node:path");
const { chromium } = require("playwright");

const ROOT = path.resolve(__dirname, "..");
const PORT = 4311;
const BASE_URL = `http://127.0.0.1:${PORT}`;
const DATA_DIR = path.join(ROOT, "tmp", "smoke-browser-data");
const INVITE_CODE = "invite-smoke";
const ADMIN_CODE = "admin-smoke";

let server;
let browser;

main().catch(async (error) => {
  console.error(error);
  await cleanup();
  process.exit(1);
});

async function main() {
  await fs.rm(DATA_DIR, { recursive: true, force: true });
  server = spawn(process.execPath, ["server.js"], {
    cwd: ROOT,
    env: {
      ...process.env,
      PORT: String(PORT),
      HOST: "127.0.0.1",
      BVF_DATA_DIR: DATA_DIR,
      BVF_INVITE_CODE: INVITE_CODE,
      BVF_ADMIN_CODE: ADMIN_CODE
    },
    stdio: ["ignore", "pipe", "pipe"]
  });
  server.stdout.on("data", (chunk) => process.stdout.write(chunk));
  server.stderr.on("data", (chunk) => process.stderr.write(chunk));
  await waitForServer();

  browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  await page.goto(BASE_URL);

  await expectVisible(page, "#splashScreen", "splash should be visible at page load");
  await page.waitForFunction(() => document.querySelector("#splashScreen")?.hidden === true, null, { timeout: 4000 });

  await page.fill("#inviteCode", INVITE_CODE);
  await page.click("#loginButton");
  await page.waitForFunction(() => document.body.classList.contains("is-authenticated"));

  await page.fill("#authorInput", "browser-smoke");
  await page.fill("#bodyInput", "browser smoke vibe");
  await page.fill("#linkInput", "https://music.163.com/#/song?id=1824045033");
  await page.click(".submit-button");
  await page.waitForSelector(".vibe-card >> text=browser smoke vibe", { timeout: 5000 });
  await page.waitForSelector("iframe.netease-player[src*='id=1824045033']", { timeout: 5000 });
  await page.waitForSelector("a.netease-open[href*='id=1824045033']", { timeout: 5000 });

  await page.click(".card-flip");
  await page.waitForSelector(".card-back >> text=智能回复留言", { timeout: 5000 });

  await page.click("#themeSwitch");
  await page.waitForFunction(() => document.body.dataset.theme === "good");

  await page.setViewportSize({ width: 390, height: 780 });
  const sheepVisible = await page.locator("#sideSheep").evaluate((element) => {
    const style = getComputedStyle(element);
    const rect = element.getBoundingClientRect();
    return style.display !== "none" && rect.width > 0 && rect.height > 0;
  });
  assert(sheepVisible, "side sheep should remain visible on mobile");

  await cleanup();
  console.log("smoke:browser passed");
}

async function waitForServer() {
  for (let attempt = 0; attempt < 50; attempt += 1) {
    try {
      const response = await fetch(`${BASE_URL}/api/session`);
      if (response.ok) return;
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
  }
  throw new Error("server did not start");
}

async function expectVisible(page, selector, message) {
  const visible = await page.locator(selector).isVisible();
  assert(visible, message);
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function cleanup() {
  if (browser) await browser.close();
  if (server && !server.killed) {
    server.kill();
    await new Promise((resolve) => server.once("exit", resolve));
  }
  await fs.rm(DATA_DIR, { recursive: true, force: true });
}
