# TypeScript MCP Server — Cloudflare Workers Guide

Patterns and examples specific to building MCP servers on Cloudflare Workers with the `agents` package.

## Key Imports

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";
import { z } from "zod";
```

## Minimal McpAgent

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { McpAgent } from "agents/mcp";

export class MyMcpAgent extends McpAgent {
  server = new McpServer({
    name: "My MCP Server",
    version: "0.1.0",
  });

  async init() {
    // Register tools here
    // this.env → all Cloudflare bindings and secrets
    // this.ctx.storage → persistent state (survives DO eviction)
  }
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    return MyMcpAgent.serve("/mcp").fetch(request, env, ctx);
  },
};
```

## Tool Registration Pattern

### Inline (small projects)

```typescript
async init() {
  this.server.tool(
    "my_tool",
    "Short description for the LLM",
    {
      param1: z.string().describe("What this parameter is for"),
      param2: z.number().optional().describe("Optional numeric param"),
    },
    async (args) => {
      const result = await doSomething(args.param1, args.param2);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    },
  );
}
```

### Modular (larger projects)

```typescript
// src/tools/users.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";

export function registerUserTools(server: McpServer, apiClient: ApiClient) {
  server.tool(
    "search_users",
    "Search for users by name or email",
    {
      query: z.string().min(2).describe("Search query"),
      limit: z.number().int().min(1).max(100).default(20).describe("Max results"),
    },
    async (args) => {
      try {
        const users = await apiClient.searchUsers(args.query, args.limit);
        return {
          content: [{ type: "text", text: JSON.stringify(users, null, 2) }],
        };
      } catch (error) {
        return {
          content: [{
            type: "text",
            text: `Error searching users: ${error instanceof Error ? error.message : String(error)}`,
          }],
        };
      }
    },
  );
}

// src/index.ts
async init() {
  const apiClient = new ApiClient(this.env.API_KEY);
  registerUserTools(this.server, apiClient);
}
```

## Zod Schema Patterns

```typescript
// String with constraints
z.string().min(1).max(500).describe("User's full name")

// Enum
z.enum(["active", "inactive", "pending"]).describe("Filter by status")

// Optional with default
z.number().int().min(1).max(100).default(20).describe("Page size")

// Union types
z.union([z.string(), z.number()]).describe("ID can be string or number")

// Object (nested)
z.object({
  name: z.string().describe("Filter name"),
  value: z.string().describe("Filter value"),
}).describe("Custom filter")
```

## Session State

Instance variables survive between tool calls in the same session:

```typescript
export class MyMcpAgent extends McpAgent {
  private cache = new Map<string, unknown>();

  async init() {
    this.server.tool("cached_fetch", "...", { url: z.string() }, async (args) => {
      if (this.cache.has(args.url)) {
        return { content: [{ type: "text", text: JSON.stringify(this.cache.get(args.url)) }] };
      }
      const data = await fetch(args.url).then(r => r.json());
      this.cache.set(args.url, data);
      return { content: [{ type: "text", text: JSON.stringify(data) }] };
    });
  }
}
```

For persistent state (survives DO eviction):

```typescript
await this.ctx.storage.put("key", value);
const stored = await this.ctx.storage.get<MyType>("key");
```

## Fetch Handler with Multiple Routes

```typescript
export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    if (url.pathname === "/mcp") {
      return MyMcpAgent.serve("/mcp", { jurisdiction: "eu" }).fetch(request, env, ctx);
    }

    if (url.pathname === "/health") {
      return Response.json({ status: "ok", timestamp: new Date().toISOString() });
    }

    if (url.pathname === "/") {
      return new Response("My MCP Server — connect via /mcp", {
        headers: { "content-type": "text/plain" },
      });
    }

    return new Response("Not found", { status: 404 });
  },
};
```

## Error Handling

Always return actionable errors the LLM can use:

```typescript
async (args) => {
  try {
    const result = await apiCall(args);
    if (!result) {
      return {
        content: [{
          type: "text",
          text: `No results found for "${args.query}". Try a broader search term.`,
        }],
      };
    }
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      content: [{
        type: "text",
        text: `Error: ${message}. Check that the API key is valid and the service is reachable.`,
      }],
    };
  }
}
```

## R2 Storage Helpers

```typescript
// Upload
async function uploadToR2(bucket: R2Bucket, key: string, data: ArrayBuffer, contentType: string) {
  await bucket.put(key, data, {
    httpMetadata: { contentType },
  });
  return key;
}

// Download
async function downloadFromR2(bucket: R2Bucket, key: string) {
  const object = await bucket.get(key);
  if (!object) return null;
  return {
    data: await object.arrayBuffer(),
    contentType: object.httpMetadata?.contentType ?? "application/octet-stream",
  };
}

// List by prefix
async function listR2Objects(bucket: R2Bucket, prefix: string) {
  const listed = await bucket.list({ prefix });
  return listed.objects.map(o => ({ key: o.key, size: o.size }));
}
```

## Common Gotchas

1. **Named export required** — DO class must be `export class`, not `export default class`
2. **`nodejs_compat` flag** — Without it, the `agents` package fails with cryptic errors
3. **`.dev.vars` vs secrets** — Always update both when changing environment
4. **Migration tags** — Each new migration needs a unique tag
5. **Zod `.describe()`** — Without it, the LLM doesn't know what parameters are for
