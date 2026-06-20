/** Tool: get_draft — retrieve a saved draft by id. */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getDraftShape } from "../types/toolSchemas.js";
import { loadDraft } from "../storage/drafts.js";
import { textResult, errorResult } from "./shared.js";

export function registerGetDraft(server: McpServer): void {
  server.registerTool(
    "get_draft",
    {
      title: "Get Draft",
      description:
        "Retrieve a previously generated draft (all platforms) by its draft_id. Read-only; does not touch the browser.",
      inputSchema: getDraftShape,
    },
    async (args) => {
      const draft = await loadDraft(args.draft_id);
      if (!draft) return errorResult(`No draft found with id '${args.draft_id}'.`);
      return textResult(draft);
    }
  );
}
