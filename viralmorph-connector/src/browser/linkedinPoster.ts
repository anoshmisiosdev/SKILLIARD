/**
 * LinkedIn staging + publishing.
 *
 * Clicks "Start a post", types into the share-box editor, and stops. The final
 * "Post" click only happens in publishLinkedInPost() after explicit confirmation.
 */
import type { StageResult, PublishResult } from "../types/postPlan.js";
import { LINKEDIN } from "./selectors.js";
import {
  state,
  getPage,
  gotoPlatform,
  findFirst,
  detectLogin,
  waitForLogin,
  loginWaitMs,
} from "./browserContext.js";

export async function stageLinkedInPost(postText: string): Promise<StageResult> {
  state.currentPlatform = "linkedin";
  state.currentStep = "navigating_to_linkedin";
  state.lastError = "";
  try {
    const page = await gotoPlatform(LINKEDIN.url);

    const login = await detectLogin(page, LINKEDIN);
    if (login === "logged_out") {
      const ok = await waitForLogin(page, LINKEDIN, loginWaitMs());
      if (!ok) {
        state.currentStep = "login_required";
        return {
          status: "login_required",
          platform: "linkedin",
          message:
            "LinkedIn is showing a login wall. Log in manually in the opened browser window, then ask me to stage the LinkedIn post again.",
          requires_final_confirmation: false,
          manual_instructions: [
            "Switch to the opened browser window.",
            "Log into LinkedIn manually (ViralMorph never sees your password).",
            "Once your feed loads, re-run: 'Stage the LinkedIn post in my browser.'",
          ],
        };
      }
    }

    // Open the composer modal via "Start a post".
    state.currentStep = "opening_composer";
    const opener = await findFirst(page, LINKEDIN.openComposer, 6000);
    if (opener) await opener.click().catch(() => {});

    const composer = await findFirst(page, LINKEDIN.composer, 8000);
    if (!composer) {
      state.currentStep = "composer_not_found";
      return {
        status: "manual_fallback_required",
        platform: "linkedin",
        message:
          "Could not reliably find the LinkedIn composer. I've opened LinkedIn — click 'Start a post' and paste manually.",
        requires_final_confirmation: false,
        manual_instructions: [
          "Click 'Start a post'.",
          "Paste the copied text (use copy_post_to_clipboard if needed).",
          "Review it.",
          "Click 'Post' manually if you approve.",
        ],
      };
    }

    state.currentStep = "staging_text";
    await composer.click();
    await composer.pressSequentially(postText, { delay: 3 });

    state.stagedPostReady = true;
    state.stagedPlatform = "linkedin";
    state.currentStep = "staged";
    return {
      status: "staged",
      platform: "linkedin",
      message:
        "Your LinkedIn post is staged in the composer but NOT published. Review it in the browser, then confirm explicitly to publish.",
      requires_final_confirmation: true,
      manual_instructions: [],
    };
  } catch (err) {
    state.lastError = (err as Error).message;
    state.currentStep = "error";
    return {
      status: "error",
      platform: "linkedin",
      message: `Unexpected error while staging the LinkedIn post: ${(err as Error).message}`,
      requires_final_confirmation: false,
      manual_instructions: [
        "Open https://www.linkedin.com/feed/ manually.",
        "Click 'Start a post' and paste your text (use copy_post_to_clipboard).",
        "Review and post it yourself.",
      ],
    };
  }
}

export async function publishLinkedInPost(): Promise<PublishResult> {
  state.currentStep = "publishing";
  try {
    const page = await getPage();
    const button = await findFirst(page, LINKEDIN.publish, 6000);
    if (!button) {
      return {
        status: "manual_fallback_required",
        platform: "linkedin",
        message: "Could not find the LinkedIn 'Post' button. Please click Post manually to publish.",
        post_url: "",
        manual_instructions: ["Review the staged post.", "Click the blue 'Post' button to publish it yourself."],
      };
    }
    await button.click();
    await page.waitForTimeout(2500);

    state.stagedPostReady = false;
    state.stagedPlatform = "";
    state.currentStep = "published";
    return {
      status: "published",
      platform: "linkedin",
      message: "Clicked Post on LinkedIn. Verify in the browser that the post went live.",
      post_url: "",
      manual_instructions: [],
    };
  } catch (err) {
    state.lastError = (err as Error).message;
    return {
      status: "error",
      platform: "linkedin",
      message: `Error while publishing the LinkedIn post: ${(err as Error).message}`,
      post_url: "",
      manual_instructions: ["Click the blue 'Post' button manually in the browser to publish."],
    };
  }
}
