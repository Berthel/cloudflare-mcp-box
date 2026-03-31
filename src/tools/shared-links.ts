import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

const SHARED_LINK_ACCESS = z.enum(["open", "company", "collaborators"])
  .describe("Access level: 'open' (anyone with link), 'company' (enterprise only), 'collaborators' (invited only)");

function buildSharedLinkBody(args: {
  access?: string;
  can_download?: boolean;
  can_preview?: boolean;
  can_edit?: boolean;
  password?: string;
  vanity_name?: string;
  unshared_at?: string;
}): Record<string, unknown> {
  const link: Record<string, unknown> = {};
  if (args.access) link.access = args.access;
  if (args.password) link.password = args.password;
  if (args.vanity_name) link.vanity_name = args.vanity_name;
  if (args.unshared_at) link.unshared_at = args.unshared_at;
  const perms: Record<string, boolean> = {};
  if (args.can_download !== undefined) perms.can_download = args.can_download;
  if (args.can_preview !== undefined) perms.can_preview = args.can_preview;
  if (args.can_edit !== undefined) perms.can_edit = args.can_edit;
  if (Object.keys(perms).length > 0) link.permissions = perms;
  return { shared_link: link };
}

export function registerSharedLinkTools(server: McpServer, client: BoxClient) {
  // --- File shared links ---

  server.tool(
    "box_shared_link_file_get",
    "Get the shared link for a Box file, if one exists.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.get(`/files/${args.file_id}`, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting file shared link: ${msg}` }], isError: true };
      }
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
    async (args) => {
      try {
        const body = buildSharedLinkBody(args);
        const result = await client.put(`/files/${args.file_id}`, body, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error creating/updating file shared link: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_shared_link_file_remove",
    "Remove the shared link from a file, making it accessible only via direct collaboration.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, { shared_link: null }, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error removing file shared link: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_shared_link_file_find",
    "Find a file by its shared link URL. Returns the file details if accessible.",
    {
      shared_link_url: z.string().url().describe("The full shared link URL"),
      password: z.string().optional().describe("Password if the shared link is password-protected"),
    },
    async (args) => {
      try {
        const result = await client.getSharedItem(args.shared_link_url, args.password);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error finding item by shared link: ${msg}` }], isError: true };
      }
    },
  );

  // --- Folder shared links ---

  server.tool(
    "box_shared_link_folder_get",
    "Get the shared link for a Box folder, if one exists.",
    {
      folder_id: z.string().describe("The ID of the folder"),
    },
    async (args) => {
      try {
        const result = await client.get(`/folders/${args.folder_id}`, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting folder shared link: ${msg}` }], isError: true };
      }
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
    async (args) => {
      try {
        const body = buildSharedLinkBody(args);
        const result = await client.put(`/folders/${args.folder_id}`, body, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error creating/updating folder shared link: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_shared_link_folder_remove",
    "Remove the shared link from a folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
    },
    async (args) => {
      try {
        const result = await client.put(`/folders/${args.folder_id}`, { shared_link: null }, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error removing folder shared link: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_shared_link_folder_find",
    "Find a folder by its shared link URL. Returns the folder details if accessible.",
    {
      shared_link_url: z.string().url().describe("The full shared link URL"),
      password: z.string().optional().describe("Password if the shared link is password-protected"),
    },
    async (args) => {
      try {
        const result = await client.getSharedItem(args.shared_link_url, args.password);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error finding item by shared link: ${msg}` }], isError: true };
      }
    },
  );

  // --- Web link shared links ---

  server.tool(
    "box_shared_link_web_link_get",
    "Get the shared link for a Box web link, if one exists.",
    {
      web_link_id: z.string().describe("The ID of the web link"),
    },
    async (args) => {
      try {
        const result = await client.get(`/web_links/${args.web_link_id}`, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting web link shared link: ${msg}` }], isError: true };
      }
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
    async (args) => {
      try {
        const body = buildSharedLinkBody(args);
        const result = await client.put(`/web_links/${args.web_link_id}`, body, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error creating/updating web link shared link: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_shared_link_web_link_remove",
    "Remove the shared link from a web link.",
    {
      web_link_id: z.string().describe("The ID of the web link"),
    },
    async (args) => {
      try {
        const result = await client.put(`/web_links/${args.web_link_id}`, { shared_link: null }, { fields: "shared_link" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error removing web link shared link: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_shared_link_web_link_find",
    "Find a web link by its shared link URL.",
    {
      shared_link_url: z.string().url().describe("The full shared link URL"),
      password: z.string().optional().describe("Password if the shared link is password-protected"),
    },
    async (args) => {
      try {
        const result = await client.getSharedItem(args.shared_link_url, args.password);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error finding item by shared link: ${msg}` }], isError: true };
      }
    },
  );
}
