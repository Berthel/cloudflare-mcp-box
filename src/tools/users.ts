import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerUserTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_users_list",
    "List all users in the Box enterprise. Returns user IDs, names, emails, and status.",
    {},
    async () => {
      // TODO: GET /users
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_users_locate_by_name",
    "Find Box users by their name. Returns matching users with IDs and email addresses.",
    {
      name: z.string().min(1).describe("The user name to search for"),
    },
    async () => {
      // TODO: GET /users?filter_term=...
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_users_locate_by_email",
    "Find a Box user by their email address.",
    {
      email: z.string().email().describe("The email address to look up"),
    },
    async () => {
      // TODO: GET /users?filter_term=...
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_users_search",
    "Search for Box users by name or email. More flexible than locate — matches partial strings.",
    {
      query: z.string().min(1).describe("Search query matching name or email"),
    },
    async () => {
      // TODO: GET /users?filter_term=...
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
