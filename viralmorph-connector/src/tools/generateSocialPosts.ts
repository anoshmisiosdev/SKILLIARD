/** Tool: generate_social_posts — the entry point that produces a full draft. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { Draft, GenerationInput } from "../types/postPlan.js";
import { generateSocialPostsShape } from "../types/toolSchemas.js";
import { makeDraftId, saveDraft } from "../storage/drafts.js";
import { buildAssumptions, buildGlobalStrategy, buildPosts } from "../llm/mockGenerator.js";
import { activeProvider, generateWithProvider } from "../llm/generateWithProvider.js";
import { buildHostInstructions } from "../llm/generateWithHostInstructions.js";
import { textResult, errorResult } from "./shared.js";

/**
 * Generation dispatcher used by both generate_social_posts and
 * regenerate_platform_post. Chooses provider -> host -> mock and ALWAYS returns
 * a complete, scored draft. Never throws on provider failure (falls back to mock).
 */
export async function produceDraft(input: GenerationInput): Promise<Draft> {
  const now = new Date().toISOString();
  let assumptions: string[] | undefined;
  let global_strategy: Draft["global_strategy"] | undefined;
  let posts: Draft["posts"] | undefined;
  let host_instructions: string | undefined;

  // Mode 2: server-side provider (only if an API key is configured).
  if (activeProvider() !== "none") {
    try {
      const r = await generateWithProvider(input);
      if (r && Object.keys(r.posts).length > 0) {
        assumptions = r.assumptions;
        global_strategy = r.global_strategy;
        posts = r.posts;
      }
    } catch (err) {
      assumptions = [`Provider call failed (${(err as Error).message}); used the deterministic generator instead.`];
    }
  }

  // Fallback / mock / host mode.
  if (!posts) {
    posts = buildPosts(input);
    global_strategy = buildGlobalStrategy(input);
    assumptions = [...(assumptions ?? []), ...buildAssumptions(input)];
    if ((process.env.LLM_PROVIDER ?? "").toLowerCase() === "host") {
      host_instructions = await buildHostInstructions(input);
      assumptions.push(
        "Host mode: posts seeded with deterministic templates. The host AI should refine each one using the included instructions, then save via update_platform_post."
      );
    }
  }

  const draft: Draft = {
    draft_id: makeDraftId(),
    created_at: now,
    updated_at: now,
    input,
    assumptions: assumptions ?? [],
    global_strategy: global_strategy!,
    posts: posts!,
    ...(host_instructions ? { host_instructions } : {}),
  };
  return saveDraft(draft);
}

export function registerGenerateSocialPosts(server: McpServer): void {
  server.registerTool(
    "generate_social_posts",
    {
      title: "Generate Social Posts",
      description:
        "Turn ONE raw context block into platform-native posts for Instagram, LinkedIn, and/or X. " +
        "Rewrites structure, hook, CTA, hashtags, and format per platform (never cross-posts identical copy), " +
        "attaches a 0–100 virality score and an asset brief, and saves the draft locally. " +
        "Call this first; it returns a draft_id used by every other tool. Does NOT touch the browser or publish anything.",
      inputSchema: generateSocialPostsShape,
    },
    async (args) => {
      try {
        const input: GenerationInput = {
          context: args.context,
          product_name: args.product_name,
          target_audience: args.target_audience,
          desired_action: args.desired_action,
          tone: args.tone,
          link: args.link,
          proof_points: args.proof_points,
          platforms: args.platforms ?? ["instagram", "linkedin", "x"],
        };
        const draft = await produceDraft(input);
        return textResult(draft);
      } catch (err) {
        return errorResult(`generate_social_posts failed: ${(err as Error).message}`);
      }
    }
  );
}
