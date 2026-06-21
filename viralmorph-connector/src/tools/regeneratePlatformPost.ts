/** Tool: regenerate_platform_post — rewrite ONE platform's post from feedback. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Draft, GenerationInput, Platform, Tone } from "../types/postPlan.js";
import { regeneratePlatformPostShape } from "../types/toolSchemas.js";
import { loadDraft, saveDraft } from "../storage/drafts.js";
import { buildPosts } from "../llm/mockGenerator.js";
import { activeProvider, generateWithProvider } from "../llm/generateWithProvider.js";
import { textResult, errorResult } from "./shared.js";

/** Nudge the tone based on plain-language feedback (mock-mode regeneration). */
function adjustToneFromFeedback(current: Tone | undefined, feedback: string): Tone | undefined {
  const f = feedback.toLowerCase();
  if (/\btechnical\b|\bdetailed\b/.test(f)) return "technical";
  if (/founder|personal|first-person/.test(f)) return "founder-led";
  if (/contrarian|spicy|bold|edgy|provocative/.test(f)) return "contrarian";
  if (/witty|funny|playful|humor/.test(f)) return "witty";
  if (/educational|teach|how-to|explain/.test(f)) return "educational";
  if (/polished|professional|corporate-clean/.test(f)) return "polished";
  if (/casual|relaxed|chill/.test(f)) return "casual";
  if (/credible|less hypey|less hype|less salesy|trustworthy|grounded/.test(f)) return "credible";
  return current;
}

export function registerRegeneratePlatformPost(server: McpServer): void {
  server.registerTool(
    "regenerate_platform_post",
    {
      title: "Regenerate Platform Post",
      description:
        "Regenerate ONLY one platform's post using plain-language feedback (e.g. 'more technical', 'shorter', " +
        "'more founder-led', 'less salesy', 'focus on the distribution problem'). Recomputes the virality score and " +
        "re-saves the draft. Leaves the other platforms untouched. Does not touch the browser.",
      inputSchema: regeneratePlatformPostShape,
    },
    async (args) => {
      const draft: Draft | null = await loadDraft(args.draft_id);
      if (!draft) return errorResult(`No draft found with id '${args.draft_id}'.`);
      const platform = args.platform as Platform;
      const feedback = args.user_feedback;

      // Mode 2: provider regeneration for just this platform.
      if (activeProvider() !== "none") {
        try {
          const r = await generateWithProvider(draft.input, { onlyPlatform: platform, feedback });
          const fresh = r?.posts[platform];
          if (fresh) {
            (draft.posts as any)[platform] = fresh;
            draft.assumptions.push(`Regenerated ${platform} via provider from feedback: "${feedback}".`);
            return textResult(await saveDraft(draft));
          }
        } catch (err) {
          draft.assumptions.push(`Provider regeneration failed (${(err as Error).message}); used deterministic generator.`);
        }
      }

      // Mock regeneration: nudge tone, rebuild just this platform.
      const tunedInput: GenerationInput = {
        ...draft.input,
        tone: adjustToneFromFeedback(draft.input.tone, feedback),
        platforms: [platform],
      };
      const rebuilt = buildPosts(tunedInput)[platform];
      if (!rebuilt) return errorResult(`Could not regenerate platform '${platform}'.`);

      rebuilt.revision_notes = [
        `Regenerated from feedback: "${feedback}".`,
        ...(/\bshort|shorter|tighten|concise\b/.test(feedback.toLowerCase())
          ? ["Trim further if still too long for the platform."]
          : []),
        ...rebuilt.revision_notes,
      ];
      (draft.posts as any)[platform] = rebuilt;

      const saved = await saveDraft(draft);
      return textResult(saved);
    }
  );
}
