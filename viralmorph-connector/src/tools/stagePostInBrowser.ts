/** Tool: stage_post_in_browser — stage one post (never publishes). */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Draft, Platform, StageResult } from "../types/postPlan.js";
import { stagePostInBrowserShape, SAFETY_WARNING } from "../types/toolSchemas.js";
import { loadDraft } from "../storage/drafts.js";
import { browserBackend } from "../browser/backend.js";
import { buildStagePlan } from "../browser/stagingPlan.js";
import { state, markStaged } from "../browser/browserContext.js";
import { stageXPost } from "../browser/xPoster.js";
import { stageLinkedInPost } from "../browser/linkedinPoster.js";
import { stageInstagramPost } from "../browser/instagramPoster.js";
import { textResult, errorResult } from "./shared.js";

/** Build the exact text to stage: copy + hashtags (+ optional link), per platform. */
export function composeStagedText(
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

/**
 * Stage a single platform. In the default Claude-in-Chrome backend this returns
 * a PLAN for the host to execute (no Playwright). In playwright backend it drives
 * ViralMorph's own browser. Reused by both stage_post_in_browser and stage_all_posts.
 */
export async function stageOne(
  draft: Draft,
  platform: Platform,
  opts: { useThreadForX: boolean; includeLink: boolean; mediaPaths: string[] }
): Promise<StageResult> {
  const text = composeStagedText(draft, platform, {
    useThreadForX: opts.useThreadForX,
    includeLink: opts.includeLink,
  });

  if (browserBackend() === "claude_in_chrome") {
    state.currentStep = "delegated_to_claude_in_chrome";
    const result = buildStagePlan(platform, text, {
      hasMedia: platform === "instagram" && opts.mediaPaths.length > 0,
    });
    // Optimistically mark staged: the host follows the returned plan in Chrome.
    markStaged(platform);
    return result;
  }

  // Playwright backend (self-contained).
  if (platform === "x") return stageXPost(text);
  if (platform === "linkedin") return stageLinkedInPost(text);
  return stageInstagramPost(text, opts.mediaPaths);
}

export function registerStagePostInBrowser(server: McpServer): void {
  server.registerTool(
    "stage_post_in_browser",
    {
      title: "Stage Post in Browser",
      description:
        "Stage ONE platform's approved post into its composer — never clicks Post/Share. " +
        "DEFAULT (BROWSER_BACKEND=claude_in_chrome): returns an ordered PLAN plus the exact text for YOU to execute " +
        "with your Claude-in-Chrome tools (navigate, screenshot, find, form_input/computer, file_upload) in the user's " +
        "real Chrome — real cursor + screenshots. Follow `plan` step by step and type `post_text` verbatim. " +
        "Tip: to do all platforms at once, prefer stage_all_posts. " +
        "(BROWSER_BACKEND=playwright makes ViralMorph drive its own Chromium instead.) " +
        "This affects live external sites using the user's own session. Never use for spam or mass posting. " +
        "For Instagram, pass media_paths or it returns instructions noting a photo/video is required.",
      inputSchema: stagePostInBrowserShape,
      annotations: { destructiveHint: false, openWorldHint: true },
    },
    async (args) => {
      const draft: Draft | null = await loadDraft(args.draft_id);
      if (!draft) return errorResult(`No draft found with id '${args.draft_id}'.`);

      const platform = args.platform as Platform;
      if (!draft.posts[platform]) {
        return errorResult(`Draft '${args.draft_id}' has no '${platform}' post. Generate or update it first.`);
      }

      const result = await stageOne(draft, platform, {
        useThreadForX: args.use_thread_for_x ?? false,
        includeLink: args.include_link ?? true,
        mediaPaths: args.media_paths ?? [],
      });

      return textResult({ ...result, backend: browserBackend(), safety_notice: SAFETY_WARNING });
    }
  );
}
