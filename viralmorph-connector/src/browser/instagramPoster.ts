/**
 * Instagram staging + publishing.
 *
 * Instagram is visual-first and its web composer is the most fragile of the
 * three. Strategy:
 *   - No media -> copy caption to clipboard, open IG, return manual instructions
 *     (a photo/video is required to post).
 *   - With media -> best-effort: open the create flow, upload, paste caption.
 *     Any failure copies the caption to clipboard and returns a manual fallback.
 *
 * Publishing clicks "Share" only via publishInstagramPost() after confirmation.
 */
import type { StageResult, PublishResult } from "../types/postPlan.js";
import { INSTAGRAM } from "./selectors.js";
import {
  state,
  getPage,
  gotoPlatform,
  findFirst,
  detectLogin,
  waitForLogin,
  loginWaitMs,
} from "./browserContext.js";
import { copyToClipboard } from "./clipboard.js";

const NEXT_BUTTON = ['div[role="button"]:has-text("Next")', 'button:has-text("Next")'];
const SELECT_FROM_COMPUTER = [
  'button:has-text("Select from computer")',
  'div[role="button"]:has-text("Select from computer")',
];

export async function stageInstagramPost(caption: string, mediaPaths: string[] = []): Promise<StageResult> {
  state.currentPlatform = "instagram";
  state.currentStep = "navigating_to_instagram";
  state.lastError = "";
  try {
    const page = await gotoPlatform(INSTAGRAM.url);

    const login = await detectLogin(page, INSTAGRAM);
    if (login === "logged_out") {
      const ok = await waitForLogin(page, INSTAGRAM, loginWaitMs());
      if (!ok) {
        await copyToClipboard(caption);
        state.currentStep = "login_required";
        return {
          status: "login_required",
          platform: "instagram",
          message:
            "Instagram is showing a login wall. I copied your caption to the clipboard. Log in manually, then re-run staging.",
          requires_final_confirmation: false,
          manual_instructions: [
            "Switch to the opened browser window and log into Instagram manually.",
            "Re-run: 'Open Instagram and prepare the caption.'",
          ],
        };
      }
    }

    // --- No media: caption-only is not postable on IG. Manual fallback. ---
    if (!mediaPaths || mediaPaths.length === 0) {
      const copied = await copyToClipboard(caption);
      state.currentStep = "manual_fallback_no_media";
      return {
        status: "manual_fallback_required",
        platform: "instagram",
        message:
          "Instagram requires an image or video to post. I opened Instagram and " +
          (copied ? "copied your caption to the clipboard." : "prepared your caption (clipboard copy unavailable)."),
        requires_final_confirmation: false,
        manual_instructions: [
          "Click the '+' (New post) button in Instagram.",
          "Select a photo or video from your computer.",
          "Click Next through crop/filter steps.",
          "Paste the caption (it's on your clipboard).",
          "Re-run staging with media_paths set to your file path to let me do this automatically next time.",
          "Review, then click 'Share' yourself when ready.",
        ],
      };
    }

    // --- With media: best-effort upload + caption. ---
    state.currentStep = "opening_create_flow";
    const newPost = await findFirst(page, INSTAGRAM.openComposer, 6000);
    if (newPost) await newPost.click().catch(() => {});

    // Upload via the native file chooser.
    state.currentStep = "uploading_media";
    const selectBtn = await findFirst(page, SELECT_FROM_COMPUTER, 6000);
    if (selectBtn) {
      try {
        const [chooser] = await Promise.all([
          page.waitForEvent("filechooser", { timeout: 8000 }),
          selectBtn.click(),
        ]);
        await chooser.setFiles(mediaPaths);
      } catch {
        return await instagramManualFallback(caption, "Could not complete the media upload automatically.");
      }
    } else {
      return await instagramManualFallback(caption, "Could not find the 'Select from computer' button.");
    }

    // Crop -> Filter -> Caption: click Next twice (bounded; ignore if missing).
    state.currentStep = "advancing_create_flow";
    for (let i = 0; i < 2; i++) {
      const next = await findFirst(page, NEXT_BUTTON, 6000);
      if (next) {
        await next.click().catch(() => {});
        await page.waitForTimeout(800);
      }
    }

    // Caption box.
    state.currentStep = "staging_caption";
    const captionBox = await findFirst(page, INSTAGRAM.composer, 8000);
    if (!captionBox) {
      return await instagramManualFallback(caption, "Reached the caption step but couldn't find the caption box.");
    }
    await captionBox.click();
    await captionBox.pressSequentially(caption, { delay: 3 });

    state.stagedPostReady = true;
    state.stagedPlatform = "instagram";
    state.currentStep = "staged";
    return {
      status: "staged",
      platform: "instagram",
      message:
        "Your Instagram post (media + caption) is staged but NOT shared. Review it in the browser, then confirm explicitly to publish.",
      requires_final_confirmation: true,
      manual_instructions: [],
    };
  } catch (err) {
    state.lastError = (err as Error).message;
    return await instagramManualFallback(caption, `Unexpected error: ${(err as Error).message}`);
  }
}

async function instagramManualFallback(caption: string, reason: string): Promise<StageResult> {
  const copied = await copyToClipboard(caption);
  state.currentStep = "manual_fallback";
  return {
    status: "manual_fallback_required",
    platform: "instagram",
    message: `${reason} ${copied ? "I copied your caption to the clipboard." : ""} Finish the post manually in the browser.`,
    requires_final_confirmation: false,
    manual_instructions: [
      "Click the '+' (New post) button.",
      "Select your photo/video from your computer.",
      "Click Next through the crop and filter steps.",
      "Paste the caption (on your clipboard).",
      "Review, then click 'Share' yourself when ready.",
    ],
  };
}

export async function publishInstagramPost(): Promise<PublishResult> {
  state.currentStep = "publishing";
  try {
    const page = await getPage();
    const button = await findFirst(page, INSTAGRAM.publish, 6000);
    if (!button) {
      return {
        status: "manual_fallback_required",
        platform: "instagram",
        message: "Could not find the Instagram 'Share' button. Please click Share manually to publish.",
        post_url: "",
        manual_instructions: ["Review the staged post.", "Click 'Share' to publish it yourself."],
      };
    }
    await button.click();
    await page.waitForTimeout(3000);

    state.stagedPostReady = false;
    state.stagedPlatform = "";
    state.currentStep = "published";
    return {
      status: "published",
      platform: "instagram",
      message: "Clicked Share on Instagram. Verify in the browser that the post went live.",
      post_url: "",
      manual_instructions: [],
    };
  } catch (err) {
    state.lastError = (err as Error).message;
    return {
      status: "error",
      platform: "instagram",
      message: `Error while publishing the Instagram post: ${(err as Error).message}`,
      post_url: "",
      manual_instructions: ["Click 'Share' manually in the browser to publish."],
    };
  }
}
