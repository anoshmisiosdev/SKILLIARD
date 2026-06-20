/**
 * Core domain types for ViralMorph.
 *
 * A "draft" is the full multi-platform plan produced by `generate_social_posts`
 * and persisted as JSON in data/drafts/{draft_id}.json. Browser modules consume
 * the per-platform posts when staging/publishing.
 */

export type Platform = "instagram" | "linkedin" | "x";

export const PLATFORMS: Platform[] = ["instagram", "linkedin", "x"];

export type DesiredAction =
  | "awareness"
  | "waitlist"
  | "demo"
  | "feedback"
  | "sales"
  | "recruit"
  | "community"
  | "other";

export type Tone =
  | "credible"
  | "witty"
  | "founder-led"
  | "technical"
  | "contrarian"
  | "educational"
  | "casual"
  | "polished";

/** Normalized inputs used by every generator (mock / provider / host). */
export interface GenerationInput {
  context: string;
  product_name?: string;
  target_audience?: string;
  desired_action?: DesiredAction;
  tone?: Tone;
  link?: string;
  proof_points?: string;
  platforms: Platform[];
}

export interface GlobalStrategy {
  core_angle: string;
  primary_emotion: string;
  target_action: string;
  risk_notes: string[];
}

/** Shared fields every platform post has. */
interface BasePost {
  recommended_format: string;
  post_copy: string;
  hashtags: string[];
  cta: string;
  asset_brief: string;
  virality_score: number;
  revision_notes: string[];
  risk_notes: string[];
}

export interface InstagramPost extends BasePost {
  /** Instagram-specific: the caption shown under the media. */
  caption: string;
}

export type LinkedInPost = BasePost;

export interface XPost extends BasePost {
  /** Optional thread variant: an array of tweet-sized posts. */
  thread_option: string[];
}

export interface Posts {
  instagram?: InstagramPost;
  linkedin?: LinkedInPost;
  x?: XPost;
}

/** The full saved draft. */
export interface Draft {
  draft_id: string;
  created_at: string;
  updated_at: string;
  /** Echo of the inputs so regeneration has full context without the host. */
  input: GenerationInput;
  assumptions: string[];
  global_strategy: GlobalStrategy;
  posts: Posts;
  /** Present only when LLM_PROVIDER=host: instructions for the host AI. */
  host_instructions?: string;
}

// --- Browser automation result shapes (match the tool output schemas) ---

export type StageStatus =
  | "staged"
  | "login_required"
  | "manual_fallback_required"
  | "error";

export interface StageResult {
  status: StageStatus;
  platform: Platform | "";
  message: string;
  requires_final_confirmation: boolean;
  manual_instructions: string[];
}

export type PublishStatus = "published" | "manual_fallback_required" | "error";

export interface PublishResult {
  status: PublishStatus;
  platform: Platform | "";
  message: string;
  post_url: string;
  manual_instructions: string[];
}

export interface BrowserStatus {
  browser_open: boolean;
  current_platform: Platform | "";
  current_step: string;
  waiting_for_login: boolean;
  staged_post_ready: boolean;
  last_error: string;
}
