import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";

// Import tool registration functions
// import { registerExampleTools } from "./tools/example.js";

export class MyMcpAgent extends McpAgent {
  server = new McpServer({
    name: "REPLACE-WITH-SERVER-NAME",
    version: "0.1.0",
  });

  async init() {
    // Register tools — pass this.env for access to bindings/secrets
    // const apiClient = new ApiClient(this.env.API_KEY);
    // registerExampleTools(this.server, apiClient);
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      return MyMcpAgent.serve("/mcp").fetch(request, env, ctx);
    }

    if (url.pathname === "/health") {
      return Response.json({
        status: "ok",
        timestamp: new Date().toISOString(),
      });
    }

    if (url.pathname === "/") {
      return new Response("MCP Server — connect via /mcp", {
        headers: { "content-type": "text/plain" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
