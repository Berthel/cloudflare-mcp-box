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
    async () => {
      // TODO: GET /groups?filter_term=...
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_groups_list_members",
    "List all members of a Box group. Returns user details for each group member.",
    {
      group_id: z.string().describe("The ID of the group"),
    },
    async () => {
      // TODO: GET /groups/:id/memberships
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_groups_list_by_user",
    "List all groups that a specific user belongs to.",
    {
      user_id: z.string().describe("The ID of the user"),
    },
    async () => {
      // TODO: GET /users/:id/memberships
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
