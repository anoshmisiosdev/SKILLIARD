#!/usr/bin/env node
/**
 * ViralMorph Connector — local MCP server (stdio).
 *
 * Registers the eight ViralMorph tools and serves them over stdio so MCP clients
 * (Claude Desktop, Claude Code, Codex-style agents) can drive social post
 * generation + local browser staging/publishing.
 *
 * IMPORTANT: stdout is the MCP transport. All logging MUST go to stderr.
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

import { registerGenerateSocialPosts } from "./tools/generateSocialPosts.js";
import { registerGetDraft } from "./tools/getDraft.js";
import { registerUpdatePlatformPost } from "./tools/updatePlatformPost.js";
import { registerRegeneratePlatformPost } from "./tools/regeneratePlatformPost.js";
import { registerStagePostInBrowser } from "./tools/stagePostInBrowser.js";
import { registerStageAllPosts } from "./tools/stageAllPosts.js";
import { registerPublishStagedPost } from "./tools/publishStagedPost.js";
import { registerPublishAllStaged } from "./tools/publishAllStaged.js";
import { registerCopyPostToClipboard } from "./tools/copyPostToClipboard.js";
import { registerGetBrowserStatus } from "./tools/getBrowserStatus.js";
import { closeBrowser } from "./browser/browserContext.js";
import { browserBackend } from "./browser/backend.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");

/** Minimal .env loader (no dependency). Only fills keys not already set. */
async function loadEnvFile(): Promise<void> {
  try {
    const raw = await fs.readFile(path.join(PROJECT_ROOT, ".env"), "utf8");
    for (const line of raw.split("\n")) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) continue;
      const eq = trimmed.indexOf("=");
      if (eq === -1) continue;
      const key = trimmed.slice(0, eq).trim();
      let value = trimmed.slice(eq + 1).trim();
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      if (key && process.env[key] === undefined) process.env[key] = value;
    }
  } catch {
    // No .env file — fine. Env may be provided by the MCP client config.
  }
}

function log(...args: unknown[]): void {
  // stderr only — never pollute the stdio protocol on stdout.
  console.error("[viralmorph]", ...args);
}

/** Server-level guidance surfaced to the host AI (Claude Desktop / Code). */
const SERVER_INSTRUCTIONS = `ViralMorph turns one context block into platform-native posts for Instagram, LinkedIn, and X, then helps stage and publish them.

BROWSER EXECUTION — use Claude in Chrome by default:
- ViralMorph does NOT drive a browser itself in the default mode. The stage/publish tools return an ordered "plan" plus the exact "post_text".
- You MUST execute those plans with your Claude-in-Chrome tools (navigate, screenshot, find, form_input/computer, file_upload) in the user's REAL Chrome — real cursor + screenshots. Do not use any other browser, and do not fall back to a different automation unless the user explicitly asks.
- If the Claude-in-Chrome tools are unavailable, tell the user, and only then suggest setting BROWSER_BACKEND=playwright.

ONE PROMPT, ALL THREE POSTS:
- To stage, prefer stage_all_posts — it returns one plan per platform. Execute them ALL in order in a single turn. Do NOT pause for confirmation between platforms.
- Type each post_text verbatim, screenshot each staged post, and never click the final Post/Share during staging.

PUBLISHING (the only confirmation gate):
- After staging everything, show the user the screenshots and ask ONCE whether to publish.
- If they approve, call publish_all_staged with a confirmation that contains both "confirm" and "publish". That single confirmation covers all platforms — no per-post confirmation.

SAFETY: only ever create/stage/publish the user's OWN post. Never automate likes, comments, follows, DMs, reposts, scraping, mass mentions, or engagement. Instagram needs a photo/video (pass media_paths).`;

async function main(): Promise<void> {
  await loadEnvFile();

  const server = new McpServer(
    {
      name: "viralmorph",
      version: "0.1.0",
    },
    { instructions: SERVER_INSTRUCTIONS }
  );

  registerGenerateSocialPosts(server);
  registerGetDraft(server);
  registerUpdatePlatformPost(server);
  registerRegeneratePlatformPost(server);
  registerStagePostInBrowser(server);
  registerStageAllPosts(server);
  registerPublishStagedPost(server);
  registerPublishAllStaged(server);
  registerCopyPostToClipboard(server);
  registerGetBrowserStatus(server);

  // Best-effort browser cleanup on shutdown.
  const shutdown = async () => {
    await closeBrowser().catch(() => {});
    process.exit(0);
  };
  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);

  const transport = new StdioServerTransport();
  await server.connect(transport);
  log(
    `ready. provider=${process.env.LLM_PROVIDER ?? "mock"} backend=${browserBackend()} (10 tools registered)`
  );
}

main().catch((err) => {
  log("fatal:", err);
  process.exit(1);
});
