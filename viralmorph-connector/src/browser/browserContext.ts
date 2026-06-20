/**
 * Single shared persistent Chromium context for the whole MCP server.
 *
 * - Uses launchPersistentContext so the user's real login session is reused and
 *   stored ONLY under browser_profiles/ (never in our draft JSON).
 * - Keeps a small mutable `state` object that `get_browser_status` reports.
 * - Provides bounded helpers (findFirst / waitForLogin) so automation never
 *   loops forever or clicks aggressively.
 */
import path from "node:path";
import { fileURLToPath } from "node:url";
import { chromium, type BrowserContext, type Page, type Locator } from "playwright";
import type { Platform } from "../types/postPlan.js";
import type { PlatformSelectors } from "./selectors.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..");

export interface BrowserState {
  browserOpen: boolean;
  currentPlatform: Platform | "";
  currentStep: string;
  waitingForLogin: boolean;
  stagedPostReady: boolean;
  /** Which platform currently has content staged (for publish step). */
  stagedPlatform: Platform | "";
  lastError: string;
}

export const state: BrowserState = {
  browserOpen: false,
  currentPlatform: "",
  currentStep: "idle",
  waitingForLogin: false,
  stagedPostReady: false,
  stagedPlatform: "",
  lastError: "",
};

let context: BrowserContext | null = null;
let page: Page | null = null;

function resolveProfileDir(): string {
  const configured = process.env.BROWSER_PROFILE_DIR || "./browser_profiles/default";
  return path.isAbsolute(configured) ? configured : path.resolve(PROJECT_ROOT, configured);
}

function headless(): boolean {
  return (process.env.BROWSER_HEADLESS || "false").toLowerCase() === "true";
}

export function loginWaitMs(): number {
  const n = Number(process.env.LOGIN_WAIT_MS);
  return Number.isFinite(n) && n > 0 ? n : 120000;
}

/** Launch (or reuse) the persistent context. */
export async function getContext(): Promise<BrowserContext> {
  if (context) return context;
  const profileDir = resolveProfileDir();
  context = await chromium.launchPersistentContext(profileDir, {
    headless: headless(),
    viewport: null,
    args: ["--start-maximized", "--disable-blink-features=AutomationControlled"],
  });
  state.browserOpen = true;
  context.on("close", () => {
    state.browserOpen = false;
    state.stagedPostReady = false;
    state.currentStep = "closed";
    context = null;
    page = null;
  });
  return context;
}

/** Get the active page (reuse the first one the profile opens, else create). */
export async function getPage(): Promise<Page> {
  const ctx = await getContext();
  if (page && !page.isClosed()) return page;
  const existing = ctx.pages();
  page = existing.length > 0 ? existing[0] : await ctx.newPage();
  return page;
}

export async function gotoPlatform(url: string): Promise<Page> {
  const p = await getPage();
  await p.goto(url, { waitUntil: "domcontentloaded", timeout: 45000 }).catch(() => {
    // Navigation hiccups (slow feed, redirects) shouldn't crash the tool.
  });
  return p;
}

/**
 * Return the first visible locator among `selectors`, polling up to
 * `totalTimeoutMs`. Returns null instead of throwing when nothing matches.
 */
export async function findFirst(
  p: Page,
  selectors: string[],
  totalTimeoutMs = 8000
): Promise<Locator | null> {
  const deadline = Date.now() + totalTimeoutMs;
  do {
    for (const sel of selectors) {
      const loc = p.locator(sel).first();
      const visible = await loc.isVisible().catch(() => false);
      if (visible) return loc;
    }
    await p.waitForTimeout(300);
  } while (Date.now() < deadline);
  return null;
}

export type LoginState = "logged_in" | "logged_out" | "unknown";

/** One quick pass to decide whether the login wall is up. */
export async function detectLogin(p: Page, sel: PlatformSelectors): Promise<LoginState> {
  for (const s of sel.loggedInSignals) {
    if (await p.locator(s).first().isVisible().catch(() => false)) return "logged_in";
  }
  for (const s of sel.loggedOutSignals) {
    if (await p.locator(s).first().isVisible().catch(() => false)) return "logged_out";
  }
  return "unknown";
}

/** Wait (bounded) for the user to finish manual login. */
export async function waitForLogin(p: Page, sel: PlatformSelectors, timeoutMs: number): Promise<boolean> {
  state.waitingForLogin = true;
  state.currentStep = "waiting_for_manual_login";
  try {
    const found = await findFirst(p, sel.loggedInSignals, timeoutMs);
    return found !== null;
  } finally {
    state.waitingForLogin = false;
  }
}

export async function closeBrowser(): Promise<void> {
  if (context) {
    await context.close().catch(() => {});
  }
  context = null;
  page = null;
  state.browserOpen = false;
  state.stagedPostReady = false;
  state.stagedPlatform = "";
  state.currentStep = "closed";
}
