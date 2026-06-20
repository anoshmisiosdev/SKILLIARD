/** Tool: update_platform_post — edit one platform's post before staging. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Draft, InstagramPost, LinkedInPost, XPost } from "../types/postPlan.js";
import { updatePlatformPostShape } from "../types/toolSchemas.js";
import { loadDraft, saveDraft } from "../storage/drafts.js";
import { scorePost } from "../llm/mockGenerator.js";
import { textResult, errorResult } from "./shared.js";

function emptyBase() {
  return {
    recommended_format: "",
    post_copy: "",
    hashtags: [] as string[],
    cta: "",
    asset_brief: "",
    virality_score: 0,
    revision_notes: [] as string[],
    risk_notes: [] as string[],
  };
}

export function registerUpdatePlatformPost(server: McpServer): void {
  server.registerTool(
    "update_platform_post",
    {
      title: "Update Platform Post",
      description:
        "Edit one platform's saved post (post_copy, hashtags, Instagram caption, or X thread_option) before staging. " +
        "Recomputes the virality score and re-saves the draft. Use this to apply the host AI's improved copy. " +
        "Does not touch the browser.",
      inputSchema: updatePlatformPostShape,
    },
    async (args) => {
      const draft: Draft | null = await loadDraft(args.draft_id);
      if (!draft) return errorResult(`No draft found with id '${args.draft_id}'.`);

      const platform = args.platform;

      if (platform === "instagram") {
        const post = (draft.posts.instagram ?? { ...emptyBase(), caption: "" }) as InstagramPost;
        if (args.post_copy !== undefined) post.post_copy = args.post_copy;
        if (args.caption !== undefined) post.caption = args.caption;
        if (args.hashtags !== undefined) post.hashtags = args.hashtags;
        post.virality_score = scorePost("instagram", post, draft.input);
        draft.posts.instagram = post;
      } else if (platform === "linkedin") {
        const post = (draft.posts.linkedin ?? emptyBase()) as LinkedInPost;
        if (args.post_copy !== undefined) post.post_copy = args.post_copy;
        if (args.hashtags !== undefined) post.hashtags = args.hashtags;
        post.virality_score = scorePost("linkedin", post, draft.input);
        draft.posts.linkedin = post;
      } else {
        const post = (draft.posts.x ?? { ...emptyBase(), thread_option: [] }) as XPost;
        if (args.post_copy !== undefined) post.post_copy = args.post_copy;
        if (args.hashtags !== undefined) post.hashtags = args.hashtags;
        if (args.thread_option !== undefined) post.thread_option = args.thread_option;
        post.virality_score = scorePost("x", post, draft.input);
        draft.posts.x = post;
      }

      const saved = await saveDraft(draft);
      return textResult(saved);
    }
  );
}
