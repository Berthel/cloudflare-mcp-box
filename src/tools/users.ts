import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";
import { toolError } from "../lib/errors.js";

export function registerUserTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_users_list",
    "List all users in the Box enterprise. Returns user IDs, names, emails, and status. Supports pagination.",
    {
      offset: z.number().int().min(0).optional().describe("Pagination offset (0-based)"),
      limit: z.number().int().min(1).max(1000).optional().describe("Maximum users to return (default 100)"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {};
        if (args.offset !== undefined) params.offset = String(args.offset);
        if (args.limit !== undefined) params.limit = String(args.limit);
        const result = await client.get("/users", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("List users", error);
      }
    },
  );

  server.tool(
    "box_users_locate_by_name",
    "Find Box users by their name. Returns matching users with IDs and email addresses.",
    {
      name: z.string().min(1).describe("The user name to search for"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
      limit: z.number().int().min(1).max(1000).optional().describe("Maximum results to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = { filter_term: args.name };
        if (args.offset !== undefined) params.offset = String(args.offset);
        if (args.limit !== undefined) params.limit = String(args.limit);
        const result = await client.get("/users", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Locate user by name", error, { name: args.name });
      }
    },
  );

  server.tool(
    "box_users_locate_by_email",
    "Find a Box user by their email address.",
    {
      email: z.string().email().describe("The email address to look up"),
    },
    async (args) => {
      try {
        const result = await client.get("/users", { filter_term: args.email });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Locate user by email", error, { email: args.email });
      }
    },
  );

  server.tool(
    "box_users_search",
    "Search for Box users by name or email. More flexible than locate — matches partial strings.",
    {
      query: z.string().min(1).describe("Search query matching name or email"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
      limit: z.number().int().min(1).max(1000).optional().describe("Maximum results to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = { filter_term: args.query };
        if (args.offset !== undefined) params.offset = String(args.offset);
        if (args.limit !== undefined) params.limit = String(args.limit);
        const result = await client.get("/users", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Search users", error, { query: args.query });
      }
    },
  );
}
