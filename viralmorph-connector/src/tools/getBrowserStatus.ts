/** Tool: get_browser_status — report the browser automation state. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BrowserStatus } from "../types/postPlan.js";
import { getBrowserStatusShape } from "../types/toolSchemas.js";
import { state } from "../browser/browserContext.js";
import { browserBackend } from "../browser/backend.js";
import { textResult } from "./shared.js";

export function registerGetBrowserStatus(server: McpServer): void {
  server.registerTool(
    "get_browser_status",
    {
      title: "Get Browser Status",
      description:
        "Report the current state of the ViralMorph browser automation: whether the browser is open, the current " +
        "platform/step, whether it's waiting for manual login, whether a post is staged and ready to publish, and the " +
        "last error (if any). Read-only.",
      inputSchema: getBrowserStatusShape,
    },
    async () => {
      const status: BrowserStatus = {
        browser_open: state.browserOpen,
        current_platform: state.currentPlatform,
        current_step: state.currentStep,
        waiting_for_login: state.waitingForLogin,
        staged_post_ready: state.stagedPostReady,
        last_error: state.lastError,
      };
      return textResult({
        ...status,
        backend: browserBackend(),
        staged_platforms: state.stagedPlatforms,
        note:
          browserBackend() === "claude_in_chrome"
            ? "Backend is claude_in_chrome: ViralMorph does not drive a browser itself — the host AI uses Claude-in-Chrome to execute the returned plans, so browser_open reflects only ViralMorph's (unused) Playwright window."
            : "Backend is playwright: ViralMorph drives its own Chromium window.",
      });
    }
  );
}
