/**
 * Tool: stage_all_posts — stage every platform in ONE call / one prompt.
 *
 * No per-post confirmation: the user asks once, and all requested platforms are
 * staged back-to-back. Nothing is published here. In the default Claude-in-Chrome
 * backend this returns one plan per platform for the host to run in sequence.
 */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Draft, Platform, StageResult } from "../types/postPlan.js";
import { PLATFORMS } from "../types/postPlan.js";
import { stageAllPostsShape, SAFETY_WARNING } from "../types/toolSchemas.js";
import { loadDraft } from "../storage/drafts.js";
import { browserBackend } from "../browser/backend.js";
import { stageOne } from "./stagePostInBrowser.js";
import { textResult, errorResult } from "./shared.js";

export function registerStageAllPosts(server: McpServer): void {
  server.registerTool(
    "stage_all_posts",
    {
      title: "Stage All Posts",
      description:
        "Stage ALL of the draft's platform posts (X, LinkedIn, Instagram) in a single call — one user prompt, " +
        "NO confirmation between platforms. Nothing is published. " +
        "DEFAULT (claude_in_chrome): returns an ordered `results` array, each with a `plan` + `post_text`. Execute every " +
        "plan IN ORDER with your Claude-in-Chrome tools, doing all platforms in one go without pausing to ask the user " +
        "between them. After all are staged, show the screenshots and ask the user ONCE whether to publish (then call " +
        "publish_all_staged). Use this as the primary staging tool. Instagram needs media_paths (else it's caption-only). " +
        "Affects live external sites with the user's own session; never use for spam or mass posting.",
      inputSchema: stageAllPostsShape,
      annotations: { destructiveHint: false, openWorldHint: true },
    },
    async (args) => {
      const draft: Draft | null = await loadDraft(args.draft_id);
      if (!draft) return errorResult(`No draft found with id '${args.draft_id}'.`);

      // Keep a stable, native order; only platforms that exist in the draft.
      const requested = args.platforms ?? PLATFORMS;
      const platforms = PLATFORMS.filter(
        (p) => requested.includes(p) && draft.posts[p]
      ) as Platform[];

      if (platforms.length === 0) {
        return errorResult(`Draft '${args.draft_id}' has no posts for the requested platforms.`);
      }

      const results: StageResult[] = [];
      for (const platform of platforms) {
        results.push(
          await stageOne(draft, platform, {
            useThreadForX: args.use_thread_for_x ?? false,
            includeLink: args.include_link ?? true,
            mediaPaths: args.media_paths ?? [],
          })
        );
      }

      const backend = browserBackend();
      const directive =
        backend === "claude_in_chrome"
          ? "Execute every plan in `results` IN ORDER using your Claude-in-Chrome tools. Do all platforms in one go — do NOT ask the user for confirmation between platforms. Type each post_text verbatim, screenshot each staged post, and do NOT click the final Post/Share button. When all are staged, show the user the screenshots and ask ONCE whether to publish; if yes, call publish_all_staged."
          : "Staged sequentially via ViralMorph's Playwright browser. Note: a single Playwright window can only hold one composer open at a time, so review/publish each before staging the next, or switch to BROWSER_BACKEND=claude_in_chrome for true multi-platform staging.";

      return textResult({
        backend,
        staged_platforms: platforms,
        directive,
        results,
        requires_final_confirmation: true,
        safety_notice: SAFETY_WARNING,
      });
    }
  );
}
