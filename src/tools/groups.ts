import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";
import { toolError } from "../lib/errors.js";

export function registerGroupTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_groups_search",
    "Search for Box groups by name. Returns matching groups with IDs and member counts.",
    {
      query: z.string().min(1).describe("The group name to search for"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
      limit: z.number().int().min(1).max(1000).optional().describe("Maximum results to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = { filter_term: args.query };
        if (args.offset !== undefined) params.offset = String(args.offset);
        if (args.limit !== undefined) params.limit = String(args.limit);
        const result = await client.get("/groups", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Search groups", error, { query: args.query });
      }
    },
  );

  server.tool(
    "box_groups_list_members",
    "List all members of a Box group. Returns user details for each group member.",
    {
      group_id: z.string().describe("The ID of the group"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
      limit: z.number().int().min(1).max(1000).optional().describe("Maximum results to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {};
        if (args.offset !== undefined) params.offset = String(args.offset);
        if (args.limit !== undefined) params.limit = String(args.limit);
        const result = await client.get(`/groups/${args.group_id}/memberships`, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("List group members", error, { group_id: args.group_id });
      }
    },
  );

  server.tool(
    "box_groups_list_by_user",
    "List all groups that a specific user belongs to.",
    {
      user_id: z.string().describe("The ID of the user"),
      offset: z.number().int().min(0).optional().describe("Pagination offset"),
      limit: z.number().int().min(1).max(1000).optional().describe("Maximum results to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {};
        if (args.offset !== undefined) params.offset = String(args.offset);
        if (args.limit !== undefined) params.limit = String(args.limit);
        const result = await client.get(`/users/${args.user_id}/memberships`, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("List user groups", error, { user_id: args.user_id });
      }
    },
  );
}
