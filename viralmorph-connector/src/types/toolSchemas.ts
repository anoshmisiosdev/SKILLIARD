/**
 * Zod input schemas for every MCP tool.
 *
 * The MCP TypeScript SDK's `registerTool` expects an `inputSchema` that is a
 * "raw shape" — a plain object whose values are Zod types — so each export here
 * is that raw shape (not wrapped in z.object). The SDK turns it into the JSON
 * schema the host AI sees.
 */
import { z } from "zod";

export const PLATFORM_ENUM = z.enum(["instagram", "linkedin", "x"]);

export const DESIRED_ACTION_ENUM = z.enum([
  "awareness",
  "waitlist",
  "demo",
  "feedback",
  "sales",
  "recruit",
  "community",
  "other",
]);

export const TONE_ENUM = z.enum([
  "credible",
  "witty",
  "founder-led",
  "technical",
  "contrarian",
  "educational",
  "casual",
  "polished",
]);

export const generateSocialPostsShape = {
  context: z
    .string()
    .min(1)
    .describe("Raw product, launch, announcement, or idea context. The single source of truth."),
  product_name: z.string().optional().describe("Optional product name."),
  target_audience: z.string().optional().describe("Who this is for, e.g. 'startup founders and indie hackers'."),
  desired_action: DESIRED_ACTION_ENUM.optional().describe(
    "Primary action you want the audience to take."
  ),
  tone: TONE_ENUM.optional().describe("Desired voice for the posts."),
  link: z.string().optional().describe("Optional URL (waitlist, demo, repo, etc.)."),
  proof_points: z
    .string()
    .optional()
    .describe("Optional real proof points: metrics, user quotes, traction, or constraints. Never fabricated."),
  platforms: z
    .array(PLATFORM_ENUM)
    .min(1)
    .default(["instagram", "linkedin", "x"])
    .describe("Which platforms to generate for."),
};

export const getDraftShape = {
  draft_id: z.string().min(1).describe("The draft id returned by generate_social_posts."),
};

export const updatePlatformPostShape = {
  draft_id: z.string().min(1),
  platform: PLATFORM_ENUM,
  post_copy: z.string().optional().describe("Updated main post text."),
  hashtags: z.array(z.string()).optional().describe("Optional replacement hashtags (without leading #)."),
  caption: z.string().optional().describe("Optional Instagram caption."),
  thread_option: z.array(z.string()).optional().describe("Optional X thread posts (ordered)."),
};

export const regeneratePlatformPostShape = {
  draft_id: z.string().min(1),
  platform: PLATFORM_ENUM,
  user_feedback: z
    .string()
    .min(1)
    .describe("e.g. 'Make it more technical / shorter / more founder-led / less salesy.'"),
};

export const stagePostInBrowserShape = {
  draft_id: z.string().min(1),
  platform: PLATFORM_ENUM,
  use_thread_for_x: z
    .boolean()
    .optional()
    .default(false)
    .describe("If true and platform is x, stage the first post of the thread variant."),
  media_paths: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Absolute local file paths for media. Required for an Instagram image/video post."),
  include_link: z.boolean().optional().default(true).describe("Append the draft link to the post copy if present."),
};

export const stageAllPostsShape = {
  draft_id: z.string().min(1),
  platforms: z
    .array(PLATFORM_ENUM)
    .optional()
    .describe("Which platforms to stage in one go. Defaults to every platform present in the draft."),
  use_thread_for_x: z.boolean().optional().default(false),
  media_paths: z
    .array(z.string())
    .optional()
    .default([])
    .describe("Media file paths for the Instagram post (absolute paths)."),
  include_link: z.boolean().optional().default(true),
};

export const publishAllStagedShape = {
  confirmation: z
    .string()
    .min(1)
    .describe(
      "Must contain both 'confirm' and 'publish'. ONE confirmation authorizes publishing every currently-staged post."
    ),
  platforms: z
    .array(PLATFORM_ENUM)
    .optional()
    .describe("Which staged platforms to publish. Defaults to every currently-staged platform."),
};

export const publishStagedPostShape = {
  platform: PLATFORM_ENUM,
  confirmation: z
    .string()
    .min(1)
    .describe(
      "Must clearly confirm publishing, e.g. 'I confirm I want to publish this post.' Must contain both 'confirm' and 'publish'."
    ),
};

export const copyPostToClipboardShape = {
  draft_id: z.string().min(1),
  platform: PLATFORM_ENUM,
};

export const getBrowserStatusShape = {};

/** Shown to users any time we stage or publish. */
export const SAFETY_WARNING =
  "ViralMorph is a local hackathon prototype. It uses your own browser session and does not store your social media password. Review every post before publishing. Do not use this for spam, mass posting, automated engagement, scraping, or impersonation.";
