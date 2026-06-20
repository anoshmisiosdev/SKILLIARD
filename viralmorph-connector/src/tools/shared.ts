/** Tiny helpers shared by every tool: wrap results as MCP text content. */
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export function textResult(obj: unknown): CallToolResult {
  const text = typeof obj === "string" ? obj : JSON.stringify(obj, null, 2);
  return { content: [{ type: "text", text }] };
}

export function errorResult(message: string): CallToolResult {
  return { content: [{ type: "text", text: message }], isError: true };
}
