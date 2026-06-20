/** Tool: publish_staged_post — click the final Post/Share, only after confirmation. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Platform, PublishResult } from "../types/postPlan.js";
import { publishStagedPostShape, SAFETY_WARNING } from "../types/toolSchemas.js";
import { state } from "../browser/browserContext.js";
import { publishXPost } from "../browser/xPoster.js";
import { publishLinkedInPost } from "../browser/linkedinPoster.js";
import { publishInstagramPost } from "../browser/instagramPoster.js";
import { textResult } from "./shared.js";

/** Require explicit intent: confirmation must contain both "confirm" and "publish". */
function isConfirmed(confirmation: string): boolean {
  const c = confirmation.toLowerCase();
  return c.includes("confirm") && c.includes("publish");
}

export function registerPublishStagedPost(server: McpServer): void {
  server.registerTool(
    "publish_staged_post",
    {
      title: "Publish Staged Post",
      description:
        "Click the final Post/Share button for the CURRENTLY STAGED post. This publishes to an external social " +
        "media website using your own session and cannot be undone by ViralMorph. ONLY call this after the user has " +
        "reviewed the staged post and explicitly confirmed. The confirmation string must clearly say the user wants " +
        "to publish (contain both 'confirm' and 'publish'). Never call this for spam or mass posting.",
      inputSchema: publishStagedPostShape,
      annotations: { destructiveHint: true, openWorldHint: true },
    },
    async (args) => {
      const platform = args.platform as Platform;

      // 1) Explicit-confirmation gate.
      if (!isConfirmed(args.confirmation)) {
        return textResult({
          status: "error",
          platform,
          message:
            "Publishing blocked: confirmation was not explicit. Re-run with a confirmation that clearly states you " +
            "want to publish, e.g. 'I confirm I want to publish this post.'",
          post_url: "",
          manual_instructions: [],
          safety_notice: SAFETY_WARNING,
        });
      }

      // 2) Something must actually be staged.
      if (!state.stagedPostReady || !state.stagedPlatform) {
        return textResult({
          status: "manual_fallback_required",
          platform,
          message:
            "No post is currently staged in the browser. Stage a post first with stage_post_in_browser, review it, then confirm.",
          post_url: "",
          manual_instructions: ["Run stage_post_in_browser for this platform.", "Review it in the browser.", "Then confirm publishing."],
          safety_notice: SAFETY_WARNING,
        });
      }

      // 3) The requested platform must match what's staged.
      if (state.stagedPlatform !== platform) {
        return textResult({
          status: "error",
          platform,
          message: `The staged post is for '${state.stagedPlatform}', not '${platform}'. Stage the ${platform} post first, or confirm publishing the ${state.stagedPlatform} post instead.`,
          post_url: "",
          manual_instructions: [],
          safety_notice: SAFETY_WARNING,
        });
      }

      let result: PublishResult;
      if (platform === "x") {
        result = await publishXPost();
      } else if (platform === "linkedin") {
        result = await publishLinkedInPost();
      } else {
        result = await publishInstagramPost();
      }

      return textResult({ ...result, safety_notice: SAFETY_WARNING });
    }
  );
}
