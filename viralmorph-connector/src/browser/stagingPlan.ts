/**
 * Builds the Claude-in-Chrome execution plans returned by the stage/publish
 * tools. ViralMorph never clicks anything in this mode — it hands the host AI an
 * ordered, explicit plan to run with its Claude-in-Chrome tools (navigate,
 * screenshot, find, form_input/computer, file_upload).
 */
import type { ChromeStep, Platform, StageResult, PublishResult } from "../types/postPlan.js";
import { X, LINKEDIN, INSTAGRAM, type PlatformSelectors } from "./selectors.js";

const SELECTORS: Record<Platform, PlatformSelectors> = { x: X, linkedin: LINKEDIN, instagram: INSTAGRAM };
const NAME: Record<Platform, string> = { x: "X", linkedin: "LinkedIn", instagram: "Instagram" };

const COMPOSER_HINT: Record<Platform, string> = {
  x: 'the tweet composer (click the "Post" button or the "What is happening?!" box on the home timeline)',
  linkedin: 'the post editor (click "Start a post" first, then the text box inside the dialog)',
  instagram: 'the create-post flow (click the "+" / "New post" button)',
};

const PUBLISH_BUTTON: Record<Platform, string> = {
  x: 'the blue "Post" button',
  linkedin: 'the blue "Post" button in the share dialog',
  instagram: 'the "Share" button',
};

/** The shared "use Claude in Chrome" preamble step. */
function preamble(platform: Platform): ChromeStep {
  return {
    action: "note",
    detail:
      `ACTION REQUIRED — use your Claude-in-Chrome tools (navigate, screenshot, find, form_input/computer, file_upload) ` +
      `to do this in the user's real Chrome. Do NOT use any other browser or automation. This affects ${NAME[platform]}, ` +
      `a live external site, using the user's own logged-in session.`,
  };
}

/** Plan to STAGE a post (never publishes). */
export function buildStagePlan(
  platform: Platform,
  postText: string,
  opts: { hasMedia: boolean } = { hasMedia: false }
): StageResult {
  const sel = SELECTORS[platform];
  const steps: ChromeStep[] = [
    preamble(platform),
    { action: "navigate", detail: `Open ${sel.url} in the user's Chrome.` },
    { action: "screenshot", detail: "Take a screenshot to confirm the page loaded." },
    {
      action: "wait_for_login",
      detail: `If a login wall is shown, STOP and ask the user to log into ${NAME[platform]} manually. Never type their password.`,
    },
    { action: "find_and_focus", detail: `Open and click into ${COMPOSER_HINT[platform]}.` },
  ];

  if (platform === "instagram") {
    if (opts.hasMedia) {
      steps.push({
        action: "upload_media",
        detail:
          'Use file_upload to attach the provided media file(s), then click "Next" through the crop and filter steps until you reach the caption field.',
      });
    } else {
      steps.push({
        action: "note",
        detail:
          "Instagram requires a photo/video to post. No media was provided — paste the caption where you can and tell the user to add media, or skip publishing for Instagram.",
      });
    }
  }

  steps.push(
    { action: "type", detail: "Type the post text EXACTLY as given in post_text below into the composer." },
    { action: "screenshot", detail: "Screenshot the staged post so the user can review it before publishing." },
    {
      action: "note",
      detail: `Do NOT click ${PUBLISH_BUTTON[platform]} now. Staging only — leave it ready and move on.`,
    }
  );

  return {
    status: "use_claude_in_chrome",
    platform,
    message: `Staging plan for ${NAME[platform]}. Execute it with Claude-in-Chrome. Do not publish yet.`,
    requires_final_confirmation: true,
    manual_instructions: [],
    post_text: postText,
    plan: steps,
  };
}

/** Plan to PUBLISH an already-staged post (only after user confirmation). */
export function buildPublishPlan(platform: Platform): PublishResult {
  const steps: ChromeStep[] = [
    preamble(platform),
    { action: "verify", detail: `Screenshot ${NAME[platform]} to confirm the staged post is still in the composer.` },
    { action: "click_publish", detail: `Click ${PUBLISH_BUTTON[platform]} to publish the post.` },
    { action: "screenshot", detail: "Screenshot to confirm the post went live." },
  ];
  return {
    status: "use_claude_in_chrome",
    platform,
    message: `Publish plan for ${NAME[platform]}. Execute it with Claude-in-Chrome.`,
    post_url: "",
    manual_instructions: [],
    plan: steps,
  };
}
