import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerWebLinkTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_web_link_create",
    "Create a web link (bookmark) in a Box folder. Web links point to external URLs.",
    {
      url: z.string().url().describe("The external URL the web link points to"),
      parent_folder_id: z.string().describe("The ID of the folder to create the web link in"),
      name: z.string().optional().describe("Display name for the web link (defaults to URL)"),
      description: z.string().optional().describe("Description of the web link"),
    },
    async () => {
      // TODO: POST /web_links
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_web_link_get",
    "Get details of a Box web link by its ID.",
    {
      web_link_id: z.string().describe("The ID of the web link"),
    },
    async () => {
      // TODO: GET /web_links/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_web_link_update",
    "Update a Box web link's URL, name, description, or parent folder.",
    {
      web_link_id: z.string().describe("The ID of the web link to update"),
      url: z.string().url().describe("The new URL"),
      parent_folder_id: z.string().describe("The new parent folder ID"),
      name: z.string().optional().describe("New display name"),
      description: z.string().optional().describe("New description"),
    },
    async () => {
      // TODO: PUT /web_links/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_web_link_delete",
    "Delete a Box web link.",
    {
      web_link_id: z.string().describe("The ID of the web link to delete"),
    },
    async () => {
      // TODO: DELETE /web_links/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
