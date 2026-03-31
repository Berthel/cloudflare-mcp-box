import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

/**
 * Example tool registration.
 * Replace with your actual tools. One file per tool group.
 */
export function registerExampleTools(server: McpServer) {
  server.tool(
    "healthcheck",
    "Check if the MCP server is running and responsive",
    {},
    async () => {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                status: "ok",
                timestamp: new Date().toISOString(),
              },
              null,
              2,
            ),
          },
        ],
      };
    },
  );

  server.tool(
    "echo",
    "Echo back the provided message — useful for testing connectivity",
    {
      message: z.string().describe("The message to echo back"),
    },
    async (args) => {
      return {
        content: [
          {
            type: "text",
            text: `Echo: ${args.message}`,
          },
        ],
      };
    },
  );
}
