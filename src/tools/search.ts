import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerSearchTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_search",
    "Search for files and folders in Box by query string. Supports filtering by file extensions and ancestor folders.",
    {
      query: z.string().min(1).describe("The search query string to find files and folders"),
      file_extensions: z.array(z.string()).optional().describe("Filter by file extensions, e.g. ['pdf', 'docx']"),
      where_to_look_for_query: z.enum(["name", "description", "file_content", "comments", "tags"])
        .optional()
        .describe("Where to search: name, description, file_content, comments, or tags"),
      ancestor_folder_ids: z.array(z.string()).optional()
        .describe("Limit search to specific folder IDs and their subfolders"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = { query: args.query };
        if (args.file_extensions?.length) params.file_extensions = args.file_extensions.join(",");
        if (args.where_to_look_for_query) params.content_types = args.where_to_look_for_query;
        if (args.ancestor_folder_ids?.length) params.ancestor_folder_ids = args.ancestor_folder_ids.join(",");
        const result = await client.get("/search", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error searching Box: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_search_folder_by_name",
    "Find a folder by its exact name. Returns matching folders with their IDs and paths.",
    {
      folder_name: z.string().min(1).describe("The exact folder name to search for"),
    },
    async (args) => {
      try {
        const result = await client.get("/search", {
          query: args.folder_name,
          type: "folder",
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error searching for folder: ${msg}` }], isError: true };
      }
    },
  );
}
