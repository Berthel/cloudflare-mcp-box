import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerGroupTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_groups_search",
    "Search for Box groups by name. Returns matching groups with IDs and member counts.",
    {
      query: z.string().min(1).describe("The group name to search for"),
    },
    async (args) => {
      try {
        const result = await client.get("/groups", { filter_term: args.query });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error searching groups: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_groups_list_members",
    "List all members of a Box group. Returns user details for each group member.",
    {
      group_id: z.string().describe("The ID of the group"),
    },
    async (args) => {
      try {
        const result = await client.get(`/groups/${args.group_id}/memberships`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing group members: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_groups_list_by_user",
    "List all groups that a specific user belongs to.",
    {
      user_id: z.string().describe("The ID of the user"),
    },
    async (args) => {
      try {
        const result = await client.get(`/users/${args.user_id}/memberships`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing user's groups: ${msg}` }], isError: true };
      }
    },
  );
}
