/**
 * Shared error helper for MCP tool handlers.
 * Provides consistent, actionable error messages for the LLM.
 */

import { BoxApiError } from "./box-client.js";

export { BoxApiError };

type ToolResult = {
  content: Array<{ type: "text"; text: string }>;
  isError: true;
};

const SUGGESTION_MAP: Record<string, string> = {
  not_found: "Verify the ID exists and that you have access.",
  forbidden: "The authenticated user does not have permission for this action.",
  access_denied: "Check that the user has the required role or collaboration on this item.",
  item_name_in_use: "An item with this name already exists. Try a different name.",
  conflict: "A conflicting operation occurred. The resource may have been modified concurrently.",
  name_temporarily_reserved: "This name is temporarily reserved. Wait a moment and retry.",
  rate_limit: "Too many requests. Wait and retry.",
  unauthorized: "The access token is invalid or expired. Re-authenticate with Box.",
  insufficient_scope: "The OAuth token lacks the required scope for this operation.",
  storage_limit_exceeded: "The Box account has exceeded its storage quota.",
  item_name_too_long: "The item name is too long. Use a shorter name (max 255 characters).",
  item_name_invalid: "The item name contains invalid characters. Avoid / and \\ in names.",
};

function getSuggestion(code: string): string {
  return SUGGESTION_MAP[code] ?? "Check the parameters and try again.";
}

export function toolError(
  action: string,
  error: unknown,
  context?: Record<string, string>,
): ToolResult {
  if (error instanceof BoxApiError) {
    const parts: string[] = [];
    parts.push(`${action} failed`);

    if (context && Object.keys(context).length > 0) {
      const ctx = Object.entries(context)
        .map(([k, v]) => `${k}: ${v}`)
        .join(", ");
      parts.push(`(${ctx})`);
    }

    parts.push(`— ${error.message}`);
    parts.push(getSuggestion(error.code));

    if (error.requestId) {
      parts.push(`[request_id: ${error.requestId}]`);
    }

    return {
      content: [{ type: "text" as const, text: parts.join(" ") }],
      isError: true,
    };
  }

  const msg = error instanceof Error ? error.message : String(error);
  return {
    content: [{ type: "text" as const, text: `${action} failed: ${msg}` }],
    isError: true,
  };
}
