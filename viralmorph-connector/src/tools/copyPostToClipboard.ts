/** Tool: copy_post_to_clipboard — fallback so the user can paste manually. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Draft, Platform } from "../types/postPlan.js";
import { copyPostToClipboardShape } from "../types/toolSchemas.js";
import { loadDraft } from "../storage/drafts.js";
import { copyToClipboard } from "../browser/clipboard.js";
import { textResult, errorResult } from "./shared.js";

function fullTextFor(draft: Draft, platform: Platform): string {
  const post = draft.posts[platform];
  if (!post) return "";
  let text = platform === "instagram" ? draft.posts.instagram!.caption || post.post_copy : post.post_copy;
  if (post.hashtags.length > 0) {
    const tags = post.hashtags.map((h) => (h.startsWith("#") ? h : `#${h}`)).join(" ");
    if (!text.includes(tags)) text += `\n\n${tags}`;
  }
  return text.trim();
}

export function registerCopyPostToClipboard(server: McpServer): void {
  server.registerTool(
    "copy_post_to_clipboard",
    {
      title: "Copy Post to Clipboard",
      description:
        "Copy one platform's post text (copy + hashtags) to the system clipboard as a manual fallback, so the user " +
        "can paste it into the composer themselves. Does not open or click anything in the browser.",
      inputSchema: copyPostToClipboardShape,
    },
    async (args) => {
      const draft = await loadDraft(args.draft_id);
      if (!draft) return errorResult(`No draft found with id '${args.draft_id}'.`);
      const platform = args.platform as Platform;
      if (!draft.posts[platform]) return errorResult(`Draft has no '${platform}' post.`);

      const text = fullTextFor(draft, platform);
      const copied = await copyToClipboard(text);

      return textResult({
        status: copied ? "copied" : "clipboard_unavailable",
        platform,
        characters: text.length,
        message: copied
          ? `Copied the ${platform} post to your clipboard. Paste it into the composer with Cmd/Ctrl+V.`
          : "Could not access the system clipboard. Here is the text to copy manually.",
        text,
      });
    }
  );
}
