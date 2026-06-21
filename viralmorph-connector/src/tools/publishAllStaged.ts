/**
 * Tool: publish_all_staged — publish every staged post with ONE confirmation.
 *
 * Honors "no confirmation between posts": a single explicit confirmation
 * authorizes publishing all currently-staged platforms in sequence. Publishing
 * to live social accounts is irreversible, so we keep this one gate.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Platform, PublishResult } from "../types/postPlan.js";
import { PLATFORMS } from "../types/postPlan.js";
import { publishAllStagedShape, SAFETY_WARNING } from "../types/toolSchemas.js";
import { state } from "../browser/browserContext.js";
import { browserBackend } from "../browser/backend.js";
import { isConfirmed, publishOne } from "./publishStagedPost.js";
import { textResult } from "./shared.js";

export function registerPublishAllStaged(server: McpServer): void {
  server.registerTool(
    "publish_all_staged",
    {
      title: "Publish All Staged Posts",
      description:
        "Publish EVERY currently-staged post in one call, after a SINGLE explicit confirmation (must contain both " +
        "'confirm' and 'publish'). No per-post confirmation. Posts to live external sites using the user's own session; " +
        "irreversible. DEFAULT (claude_in_chrome): returns one publish `plan` per platform for YOU to execute in order " +
        "with Claude-in-Chrome. Only call after the user has reviewed the staged posts and clearly approved publishing all. " +
        "Never use for spam or mass posting.",
      inputSchema: publishAllStagedShape,
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async (args) => {
      if (!isConfirmed(args.confirmation)) {
        return textResult({
          status: "error",
          message:
            "Publishing blocked: confirmation was not explicit. Re-run with something like " +
            "'I confirm I want to publish all the staged posts.'",
          results: [],
          safety_notice: SAFETY_WARNING,
        });
      }

      if (!state.stagedPostReady || state.stagedPlatforms.length === 0) {
        return textResult({
          status: "manual_fallback_required",
          message: "Nothing is staged. Stage posts first (stage_all_posts), review them, then confirm publishing.",
          results: [],
          safety_notice: SAFETY_WARNING,
        });
      }

      // Publish in native order, limited to what's actually staged (and optionally filtered).
      const filter = args.platforms;
      const platforms = PLATFORMS.filter(
        (p) => state.stagedPlatforms.includes(p) && (!filter || filter.includes(p))
      ) as Platform[];

      const results: PublishResult[] = [];
      for (const platform of platforms) {
        results.push(await publishOne(platform));
      }

      const backend = browserBackend();
      const directive =
        backend === "claude_in_chrome"
          ? "Execute each publish `plan` IN ORDER with your Claude-in-Chrome tools (click the final Post/Share for each, screenshot to confirm). No further confirmation needed between platforms."
          : "Published sequentially via ViralMorph's Playwright browser.";

      return textResult({
        backend,
        published_platforms: platforms,
        directive,
        results,
        safety_notice: SAFETY_WARNING,
      });
    }
  );
}
