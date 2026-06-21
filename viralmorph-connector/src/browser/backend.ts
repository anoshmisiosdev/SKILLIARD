/**
 * Which browser ViralMorph uses for staging/publishing.
 *
 *  - "claude_in_chrome" (DEFAULT): ViralMorph does NOT drive a browser itself.
 *    Instead, stage/publish tools return a step-by-step PLAN plus the exact text,
 *    and the host AI (Claude Desktop) executes it with its Claude-in-Chrome tools
 *    in the user's real Chrome — real cursor movement + screenshots. This is the
 *    preferred mode.
 *  - "playwright": ViralMorph drives its own persistent Chromium via Playwright
 *    (the original self-contained mode). Use when the Claude-in-Chrome extension
 *    isn't available.
 */
export type BrowserBackend = "claude_in_chrome" | "playwright";

export function browserBackend(): BrowserBackend {
  const v = (process.env.BROWSER_BACKEND ?? "claude_in_chrome").toLowerCase();
  return v === "playwright" ? "playwright" : "claude_in_chrome";
}
