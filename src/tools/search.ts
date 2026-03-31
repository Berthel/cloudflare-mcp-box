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
    async () => {
      // TODO: GET /search
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_search_folder_by_name",
    "Find a folder by its exact name. Returns matching folders with their IDs and paths.",
    {
      folder_name: z.string().min(1).describe("The exact folder name to search for"),
    },
    async () => {
      // TODO: GET /search?type=folder&query=...
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
