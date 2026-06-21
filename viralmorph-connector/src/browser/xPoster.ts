/**
 * X / Twitter staging + publishing.
 *
 * Stages the post into the composer but NEVER clicks "Post" — that only happens
 * in publishXPost(), which the publish_staged_post tool calls after explicit
 * user confirmation. On any uncertainty we return a manual fallback.
 */
import type { StageResult, PublishResult } from "../types/postPlan.js";
import { X } from "./selectors.js";
import {
  state,
  getPage,
  gotoPlatform,
  findFirst,
  detectLogin,
  waitForLogin,
  loginWaitMs,
  markStaged,
  markPublished,
} from "./browserContext.js";

export async function stageXPost(postText: string): Promise<StageResult> {
  state.currentPlatform = "x";
  state.currentStep = "navigating_to_x";
  state.lastError = "";
  try {
    const page = await gotoPlatform(X.url);

    // 1) Make sure we're logged in (manual login only — we never type passwords).
    const login = await detectLogin(page, X);
    if (login === "logged_out") {
      const ok = await waitForLogin(page, X, loginWaitMs());
      if (!ok) {
        state.currentStep = "login_required";
        return {
          status: "login_required",
          platform: "x",
          message:
            "X is showing a login wall. Log into X manually in the opened browser window, then ask me to stage the X post again.",
          requires_final_confirmation: false,
          manual_instructions: [
            "Switch to the opened browser window.",
            "Log into your X account manually (ViralMorph never sees your password).",
            "Once you see your home feed, re-run: 'Stage the X post in my browser.'",
          ],
        };
      }
    }

    // 2) Open the composer. The inline box may already be present; otherwise click "Post".
    state.currentStep = "opening_composer";
    let composer = await findFirst(page, X.composer, 4000);
    if (!composer) {
      const opener = await findFirst(page, X.openComposer, 4000);
      if (opener) await opener.click().catch(() => {});
      composer = await findFirst(page, X.composer, 6000);
    }

    if (!composer) {
      state.currentStep = "composer_not_found";
      return {
        status: "manual_fallback_required",
        platform: "x",
        message:
          "Could not reliably find the X composer. I've left X open — paste the post manually.",
        requires_final_confirmation: false,
        manual_instructions: [
          "Click the 'Post' button (or the compose pencil) on X.",
          "Paste the post text (use copy_post_to_clipboard if you need it on your clipboard).",
          "Review it, then click 'Post' yourself if you approve.",
        ],
      };
    }

    // 3) Type the approved text. We do NOT click Post.
    state.currentStep = "staging_text";
    await composer.click();
    await composer.fill("").catch(() => {});
    await composer.pressSequentially(postText, { delay: 5 });

    markStaged("x");
    state.currentStep = "staged";
    return {
      status: "staged",
      platform: "x",
      message:
        "Your X post is staged in the composer but NOT published. Review it in the browser. When you're ready, confirm explicitly and I'll publish it.",
      requires_final_confirmation: true,
      manual_instructions: [],
    };
  } catch (err) {
    state.lastError = (err as Error).message;
    state.currentStep = "error";
    return {
      status: "error",
      platform: "x",
      message: `Unexpected error while staging the X post: ${(err as Error).message}`,
      requires_final_confirmation: false,
      manual_instructions: [
        "Open https://x.com/home manually.",
        "Click 'Post' and paste your text (use copy_post_to_clipboard).",
        "Review and post it yourself.",
      ],
    };
  }
}

export async function publishXPost(): Promise<PublishResult> {
  state.currentStep = "publishing";
  try {
    const page = await getPage();
    const button = await findFirst(page, X.publish, 6000);
    if (!button) {
      return {
        status: "manual_fallback_required",
        platform: "x",
        message: "Could not find the X 'Post' button. Please click Post manually to publish.",
        post_url: "",
        manual_instructions: ["Review the staged post in the browser.", "Click 'Post' to publish it yourself."],
      };
    }
    await button.click();
    await page.waitForTimeout(2500); // let the request fire / toast appear

    markPublished("x");
    state.currentStep = "published";
    return {
      status: "published",
      platform: "x",
      message: "Clicked Post on X. Verify in the browser that the post went live.",
      post_url: "", // X doesn't expose the new permalink reliably without scraping.
      manual_instructions: [],
    };
  } catch (err) {
    state.lastError = (err as Error).message;
    return {
      status: "error",
      platform: "x",
      message: `Error while publishing the X post: ${(err as Error).message}`,
      post_url: "",
      manual_instructions: ["Click 'Post' manually in the browser to publish."],
    };
  }
}
