/** Tool: stage_post_in_browser — open a real browser and stage (never publish). */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Draft, Platform, StageResult } from "../types/postPlan.js";
import { stagePostInBrowserShape, SAFETY_WARNING } from "../types/toolSchemas.js";
import { loadDraft } from "../storage/drafts.js";
import { stageXPost } from "../browser/xPoster.js";
import { stageLinkedInPost } from "../browser/linkedinPoster.js";
import { stageInstagramPost } from "../browser/instagramPoster.js";
import { textResult, errorResult } from "./shared.js";

/** Build the exact text to stage: copy + hashtags (+ optional link), per platform. */
function composeStagedText(
  draft: Draft,
  platform: Platform,
  opts: { useThreadForX: boolean; includeLink: boolean }
): string {
  let base = "";
  let hashtags: string[] = [];

  if (platform === "x") {
    const x = draft.posts.x!;
    base = opts.useThreadForX && x.thread_option.length > 0 ? x.thread_option[0] : x.post_copy;
    hashtags = x.hashtags;
  } else if (platform === "linkedin") {
    const li = draft.posts.linkedin!;
    base = li.post_copy;
    hashtags = li.hashtags;
  } else {
    const ig = draft.posts.instagram!;
    base = ig.caption || ig.post_copy;
    hashtags = ig.hashtags;
  }

  let text = base.trim();
  if (hashtags.length > 0) {
    const tagLine = hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
    if (!text.includes(tagLine)) text += `\n\n${tagLine}`;
  }
  const link = draft.input.link;
  if (opts.includeLink && link && !text.includes(link)) {
    text += `\n\n${link}`;
  }
  return text;
}

export function registerStagePostInBrowser(server: McpServer): void {
  server.registerTool(
    "stage_post_in_browser",
    {
      title: "Stage Post in Browser",
      description:
        "Open a REAL local browser (persistent profile), navigate to the platform, wait for manual login if needed, " +
        "and paste the approved post into the composer. NEVER clicks the final Post/Share button — staging only. " +
        "This affects external social media websites and uses your own logged-in session. Requires a follow-up " +
        "publish_staged_post call (with explicit confirmation) to actually post. Do NOT use for spam or mass posting. " +
        "For Instagram, pass media_paths (an image/video) or it returns manual instructions (a photo/video is required).",
      inputSchema: stagePostInBrowserShape,
      annotations: { destructiveHint: false, openWorldHint: true },
    },
    async (args) => {
      const draft: Draft | null = await loadDraft(args.draft_id);
      if (!draft) return errorResult(`No draft found with id '${args.draft_id}'.`);

      const platform = args.platform as Platform;
      if (!draft.posts[platform]) {
        return errorResult(
          `Draft '${args.draft_id}' has no '${platform}' post. Generate or update it first.`
        );
      }

      const text = composeStagedText(draft, platform, {
        useThreadForX: args.use_thread_for_x ?? false,
        includeLink: args.include_link ?? true,
      });

      let result: StageResult;
      if (platform === "x") {
        result = await stageXPost(text);
      } else if (platform === "linkedin") {
        result = await stageLinkedInPost(text);
      } else {
        const ig = draft.posts.instagram!;
        const caption = composeStagedText(draft, "instagram", {
          useThreadForX: false,
          includeLink: args.include_link ?? true,
        });
        // Use caption (with hashtags/link) but keep brief fallback to post_copy.
        result = await stageInstagramPost(caption || ig.caption, args.media_paths ?? []);
      }

      return textResult({ ...result, safety_notice: SAFETY_WARNING });
    }
  );
}
