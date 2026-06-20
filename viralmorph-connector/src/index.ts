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
import { registerPublishStagedPost } from "./tools/publishStagedPost.js";
import { registerCopyPostToClipboard } from "./tools/copyPostToClipboard.js";
import { registerGetBrowserStatus } from "./tools/getBrowserStatus.js";
import { closeBrowser } from "./browser/browserContext.js";

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

async function main(): Promise<void> {
  await loadEnvFile();

  const server = new McpServer({
    name: "viralmorph",
    version: "0.1.0",
  });

  registerGenerateSocialPosts(server);
  registerGetDraft(server);
  registerUpdatePlatformPost(server);
  registerRegeneratePlatformPost(server);
  registerStagePostInBrowser(server);
  registerPublishStagedPost(server);
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
  log(`ready. provider=${process.env.LLM_PROVIDER ?? "mock"} (8 tools registered)`);
}

main().catch((err) => {
  log("fatal:", err);
  process.exit(1);
});
