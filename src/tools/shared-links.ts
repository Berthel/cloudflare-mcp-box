import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

const SHARED_LINK_ACCESS = z.enum(["open", "company", "collaborators"])
  .describe("Access level: 'open' (anyone with link), 'company' (enterprise only), 'collaborators' (invited only)");

export function registerSharedLinkTools(server: McpServer, client: BoxClient) {
  // --- File shared links ---

  server.tool(
    "box_shared_link_file_get",
    "Get the shared link for a Box file, if one exists.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async () => {
      // TODO: GET /files/:id?fields=shared_link
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_file_create_or_update",
    "Create or update a shared link for a file. Configure access level, permissions, and expiration.",
    {
      file_id: z.string().describe("The ID of the file"),
      access: SHARED_LINK_ACCESS.optional(),
      can_download: z.boolean().optional().describe("Whether the shared link allows downloads"),
      can_preview: z.boolean().optional().describe("Whether the shared link allows preview"),
      can_edit: z.boolean().optional().describe("Whether the shared link allows editing"),
      password: z.string().optional().describe("Password to protect the shared link"),
      vanity_name: z.string().optional().describe("Custom vanity name for the shared link URL"),
      unshared_at: z.string().optional().describe("ISO 8601 date when the shared link expires"),
    },
    async () => {
      // TODO: PUT /files/:id (shared_link)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_file_remove",
    "Remove the shared link from a file, making it accessible only via direct collaboration.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async () => {
      // TODO: PUT /files/:id (shared_link: null)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_file_find",
    "Find a file by its shared link URL. Returns the file details if accessible.",
    {
      shared_link_url: z.string().url().describe("The full shared link URL"),
      password: z.string().optional().describe("Password if the shared link is password-protected"),
    },
    async () => {
      // TODO: GET /shared_items (BoxAPI header)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  // --- Folder shared links ---

  server.tool(
    "box_shared_link_folder_get",
    "Get the shared link for a Box folder, if one exists.",
    {
      folder_id: z.string().describe("The ID of the folder"),
    },
    async () => {
      // TODO: GET /folders/:id?fields=shared_link
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_folder_create_or_update",
    "Create or update a shared link for a folder. Configure access level, permissions, and expiration.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      access: SHARED_LINK_ACCESS.optional(),
      can_download: z.boolean().optional().describe("Whether the shared link allows downloads"),
      can_preview: z.boolean().optional().describe("Whether the shared link allows preview"),
      password: z.string().optional().describe("Password to protect the shared link"),
      vanity_name: z.string().optional().describe("Custom vanity name for the shared link URL"),
      unshared_at: z.string().optional().describe("ISO 8601 date when the shared link expires"),
    },
    async () => {
      // TODO: PUT /folders/:id (shared_link)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_folder_remove",
    "Remove the shared link from a folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
    },
    async () => {
      // TODO: PUT /folders/:id (shared_link: null)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_folder_find",
    "Find a folder by its shared link URL. Returns the folder details if accessible.",
    {
      shared_link_url: z.string().url().describe("The full shared link URL"),
      password: z.string().optional().describe("Password if the shared link is password-protected"),
    },
    async () => {
      // TODO: GET /shared_items (BoxAPI header)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  // --- Web link shared links ---

  server.tool(
    "box_shared_link_web_link_get",
    "Get the shared link for a Box web link, if one exists.",
    {
      web_link_id: z.string().describe("The ID of the web link"),
    },
    async () => {
      // TODO: GET /web_links/:id?fields=shared_link
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_web_link_create_or_update",
    "Create or update a shared link for a web link. Configure access level and expiration.",
    {
      web_link_id: z.string().describe("The ID of the web link"),
      access: SHARED_LINK_ACCESS.optional(),
      password: z.string().optional().describe("Password to protect the shared link"),
      vanity_name: z.string().optional().describe("Custom vanity name for the shared link URL"),
      unshared_at: z.string().optional().describe("ISO 8601 date when the shared link expires"),
    },
    async () => {
      // TODO: PUT /web_links/:id (shared_link)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_web_link_remove",
    "Remove the shared link from a web link.",
    {
      web_link_id: z.string().describe("The ID of the web link"),
    },
    async () => {
      // TODO: PUT /web_links/:id (shared_link: null)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_shared_link_web_link_find",
    "Find a web link by its shared link URL.",
    {
      shared_link_url: z.string().url().describe("The full shared link URL"),
      password: z.string().optional().describe("Password if the shared link is password-protected"),
    },
    async () => {
      // TODO: GET /shared_items (BoxAPI header)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
