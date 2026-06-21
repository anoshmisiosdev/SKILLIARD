/** Tool: publish_staged_post — click the final Post/Share, only after confirmation. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Platform, PublishResult } from "../types/postPlan.js";
import { publishStagedPostShape, SAFETY_WARNING } from "../types/toolSchemas.js";
import { state, markPublished } from "../browser/browserContext.js";
import { browserBackend } from "../browser/backend.js";
import { buildPublishPlan } from "../browser/stagingPlan.js";
import { publishXPost } from "../browser/xPoster.js";
import { publishLinkedInPost } from "../browser/linkedinPoster.js";
import { publishInstagramPost } from "../browser/instagramPoster.js";
import { textResult } from "./shared.js";

/** Require explicit intent: confirmation must contain both "confirm" and "publish". */
export function isConfirmed(confirmation: string): boolean {
  const c = confirmation.toLowerCase();
  return c.includes("confirm") && c.includes("publish");
}

/**
 * Publish one platform. Claude-in-Chrome backend returns a PLAN for the host to
 * execute; Playwright backend clicks the button itself. Reused by publish_all_staged.
 */
export async function publishOne(platform: Platform): Promise<PublishResult> {
  if (browserBackend() === "claude_in_chrome") {
    const plan = buildPublishPlan(platform);
    markPublished(platform);
    state.currentStep = "delegated_to_claude_in_chrome";
    return plan;
  }
  if (platform === "x") return publishXPost();
  if (platform === "linkedin") return publishLinkedInPost();
  return publishInstagramPost();
}

export function registerPublishStagedPost(server: McpServer): void {
  server.registerTool(
    "publish_staged_post",
    {
      title: "Publish Staged Post",
      description:
        "Publish ONE currently-staged post (click its final Post/Share). This posts to a live external site using the " +
        "user's own session and cannot be undone by ViralMorph. ONLY call after the user reviewed it and explicitly " +
        "confirmed (confirmation must contain both 'confirm' and 'publish'). " +
        "DEFAULT (claude_in_chrome): returns a `plan` for YOU to execute with Claude-in-Chrome. " +
        "To publish several staged posts at once with a single confirmation, use publish_all_staged. " +
        "Never call for spam or mass posting.",
      inputSchema: publishStagedPostShape,
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async (args) => {
      const platform = args.platform as Platform;

      if (!isConfirmed(args.confirmation)) {
        return textResult({
          status: "error",
          platform,
          message:
            "Publishing blocked: confirmation was not explicit. Re-run with a confirmation that clearly says you want " +
            "to publish, e.g. 'I confirm I want to publish this post.'",
          post_url: "",
          manual_instructions: [],
          safety_notice: SAFETY_WARNING,
        });
      }

      if (!state.stagedPostReady || state.stagedPlatforms.length === 0) {
        return textResult({
          status: "manual_fallback_required",
          platform,
          message:
            "No post is currently staged. Stage one first (stage_post_in_browser or stage_all_posts), review it, then confirm.",
          post_url: "",
          manual_instructions: ["Stage the post.", "Review it in the browser.", "Then confirm publishing."],
          safety_notice: SAFETY_WARNING,
        });
      }

      if (!state.stagedPlatforms.includes(platform)) {
        return textResult({
          status: "error",
          platform,
          message: `'${platform}' is not staged. Staged platforms: ${state.stagedPlatforms.join(", ") || "(none)"}. Stage it first, or publish one of those.`,
          post_url: "",
          manual_instructions: [],
          safety_notice: SAFETY_WARNING,
        });
      }

      const result = await publishOne(platform);
      return textResult({ ...result, backend: browserBackend(), safety_notice: SAFETY_WARNING });
    }
  );
}
