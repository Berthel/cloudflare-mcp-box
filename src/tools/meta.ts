import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BoxClient } from "../lib/box-client.js";

export function registerMetaTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_who_am_i",
    "Get the currently authenticated Box user's profile (name, email, ID, space usage)",
    {},
    async () => {
      try {
        const user = await client.get("/users/me");
        return { content: [{ type: "text" as const, text: JSON.stringify(user, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error fetching current user: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_server_info",
    "Get MCP server information including version, available tools, and capabilities",
    {},
    async () => {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            name: "box-mcp-server",
            version: "0.1.0",
            description: "Box MCP Server on Cloudflare Workers",
          }, null, 2),
        }],
      };
    },
  );
}
