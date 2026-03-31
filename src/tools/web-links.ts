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
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          url: args.url,
          parent: { id: args.parent_folder_id },
        };
        if (args.name) body.name = args.name;
        if (args.description) body.description = args.description;
        const result = await client.post("/web_links", body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error creating web link: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_web_link_get",
    "Get details of a Box web link by its ID.",
    {
      web_link_id: z.string().describe("The ID of the web link"),
    },
    async (args) => {
      try {
        const result = await client.get(`/web_links/${args.web_link_id}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting web link: ${msg}` }], isError: true };
      }
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
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          url: args.url,
          parent: { id: args.parent_folder_id },
        };
        if (args.name) body.name = args.name;
        if (args.description) body.description = args.description;
        const result = await client.put(`/web_links/${args.web_link_id}`, body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error updating web link: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_web_link_delete",
    "Delete a Box web link.",
    {
      web_link_id: z.string().describe("The ID of the web link to delete"),
    },
    async (args) => {
      try {
        await client.delete(`/web_links/${args.web_link_id}`);
        return { content: [{ type: "text" as const, text: `Web link ${args.web_link_id} deleted successfully.` }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error deleting web link: ${msg}` }], isError: true };
      }
    },
  );
}
