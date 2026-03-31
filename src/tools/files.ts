import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerFileTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_file_info",
    "Get detailed information about a Box file including name, size, parent folder, timestamps, and permissions.",
    {
      file_id: z.string().describe("The ID of the Box file"),
    },
    async (args) => {
      try {
        const result = await client.get(`/files/${args.file_id}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting file info: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_copy",
    "Copy a file to a destination folder. Optionally rename the copy and specify a version.",
    {
      file_id: z.string().describe("The ID of the file to copy"),
      destination_folder_id: z.string().describe("The ID of the destination folder"),
      new_name: z.string().optional().describe("New name for the copied file (defaults to original name)"),
      version_number: z.string().optional().describe("Specific file version to copy"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = { parent: { id: args.destination_folder_id } };
        if (args.new_name) body.name = args.new_name;
        if (args.version_number) body.version = args.version_number;
        const result = await client.post(`/files/${args.file_id}/copy`, body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error copying file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_delete",
    "Permanently delete a file from Box. This action cannot be undone.",
    {
      file_id: z.string().describe("The ID of the file to delete"),
    },
    async (args) => {
      try {
        await client.delete(`/files/${args.file_id}`);
        return { content: [{ type: "text" as const, text: `File ${args.file_id} deleted successfully.` }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error deleting file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_move",
    "Move a file to a different folder in Box.",
    {
      file_id: z.string().describe("The ID of the file to move"),
      destination_folder_id: z.string().describe("The ID of the destination folder"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, { parent: { id: args.destination_folder_id } });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error moving file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_rename",
    "Rename a file in Box.",
    {
      file_id: z.string().describe("The ID of the file to rename"),
      new_name: z.string().describe("The new name for the file (including extension)"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, { name: args.new_name });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error renaming file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_set_description",
    "Set or update the description of a Box file.",
    {
      file_id: z.string().describe("The ID of the file"),
      description: z.string().describe("The new description text for the file"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, { description: args.description });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error setting file description: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_retention_date_set",
    "Set a disposition/retention date on a file. The file cannot be deleted before this date.",
    {
      file_id: z.string().describe("The ID of the file"),
      retention_date: z.string().describe("ISO 8601 date string for the retention date, e.g. '2025-12-31T00:00:00Z'"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, { disposition_at: args.retention_date });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error setting retention date: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_retention_date_clear",
    "Clear/remove the retention date from a file, allowing it to be deleted at any time.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, { disposition_at: null });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error clearing retention date: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_lock",
    "Lock a file to prevent other users from editing it.",
    {
      file_id: z.string().describe("The ID of the file to lock"),
      lock_expires_at: z.string().optional().describe("ISO 8601 date when the lock expires"),
      is_download_prevented: z.boolean().optional().describe("Whether to also prevent downloads while locked"),
    },
    async (args) => {
      try {
        const lock: Record<string, unknown> = { type: "lock" };
        if (args.lock_expires_at) lock.expires_at = args.lock_expires_at;
        if (args.is_download_prevented !== undefined) lock.is_download_prevented = args.is_download_prevented;
        const result = await client.put(`/files/${args.file_id}`, { lock });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error locking file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_unlock",
    "Remove the lock from a file, allowing other users to edit it again.",
    {
      file_id: z.string().describe("The ID of the file to unlock"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, { lock: null });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error unlocking file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_set_download_open",
    "Set the file's download permissions to 'open' — anyone with access can download.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, {
          shared_link: { permissions: { can_download: true } },
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error setting download permissions: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_set_download_company",
    "Restrict the file's download permissions to company users only.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, {
          shared_link: { access: "company", permissions: { can_download: true } },
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error setting download permissions: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_set_download_reset",
    "Reset the file's download permissions to default settings.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.put(`/files/${args.file_id}`, {
          shared_link: null,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error resetting download permissions: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_tag_list",
    "List all tags on a Box file.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.get<{ tags?: string[] }>(`/files/${args.file_id}`, { fields: "tags" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result.tags ?? [], null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing file tags: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_tag_add",
    "Add a tag to a Box file.",
    {
      file_id: z.string().describe("The ID of the file"),
      tag: z.string().describe("The tag to add to the file"),
    },
    async (args) => {
      try {
        const file = await client.get<{ tags?: string[] }>(`/files/${args.file_id}`, { fields: "tags" });
        const tags = file.tags ?? [];
        if (!tags.includes(args.tag)) tags.push(args.tag);
        const result = await client.put(`/files/${args.file_id}`, { tags });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error adding tag to file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_tag_remove",
    "Remove a tag from a Box file.",
    {
      file_id: z.string().describe("The ID of the file"),
      tag: z.string().describe("The tag to remove from the file"),
    },
    async (args) => {
      try {
        const file = await client.get<{ tags?: string[] }>(`/files/${args.file_id}`, { fields: "tags" });
        const tags = (file.tags ?? []).filter((t) => t !== args.tag);
        const result = await client.put(`/files/${args.file_id}`, { tags });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error removing tag from file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_thumbnail_url",
    "Get the URL for a file's thumbnail image. Useful for previewing files.",
    {
      file_id: z.string().describe("The ID of the file"),
      extension: z.enum(["png", "jpg"]).optional().describe("Thumbnail image format"),
      min_height: z.number().int().optional().describe("Minimum thumbnail height in pixels"),
      min_width: z.number().int().optional().describe("Minimum thumbnail width in pixels"),
      max_height: z.number().int().optional().describe("Maximum thumbnail height in pixels"),
      max_width: z.number().int().optional().describe("Maximum thumbnail width in pixels"),
    },
    async (args) => {
      try {
        const ext = args.extension ?? "png";
        const params: Record<string, string> = {};
        if (args.min_height) params.min_height = String(args.min_height);
        if (args.min_width) params.min_width = String(args.min_width);
        if (args.max_height) params.max_height = String(args.max_height);
        if (args.max_width) params.max_width = String(args.max_width);
        const response = await client.getRaw(`/files/${args.file_id}/thumbnail.${ext}`, params);
        if (response.status === 202 || response.status === 302) {
          const location = response.headers.get("location");
          return { content: [{ type: "text" as const, text: JSON.stringify({ status: "pending", thumbnail_url: location }, null, 2) }] };
        }
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Box API error ${response.status}: ${errorText}`);
        }
        const location = response.headers.get("location");
        return { content: [{ type: "text" as const, text: JSON.stringify({ thumbnail_url: location ?? response.url }, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting thumbnail URL: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_thumbnail_download",
    "Download a file's thumbnail image as base64-encoded data.",
    {
      file_id: z.string().describe("The ID of the file"),
      extension: z.enum(["png", "jpg"]).optional().describe("Thumbnail image format"),
      min_height: z.number().int().optional().describe("Minimum thumbnail height in pixels"),
      min_width: z.number().int().optional().describe("Minimum thumbnail width in pixels"),
      max_height: z.number().int().optional().describe("Maximum thumbnail height in pixels"),
      max_width: z.number().int().optional().describe("Maximum thumbnail width in pixels"),
    },
    async (args) => {
      try {
        const ext = args.extension ?? "png";
        const params: Record<string, string> = {};
        if (args.min_height) params.min_height = String(args.min_height);
        if (args.min_width) params.min_width = String(args.min_width);
        if (args.max_height) params.max_height = String(args.max_height);
        if (args.max_width) params.max_width = String(args.max_width);
        const response = await client.getRaw(`/files/${args.file_id}/thumbnail.${ext}`, params);
        if (response.status === 202) {
          return { content: [{ type: "text" as const, text: "Thumbnail is being generated. Try again in a few seconds." }] };
        }
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Box API error ${response.status}: ${errorText}`);
        }
        const buffer = await response.arrayBuffer();
        const base64 = btoa(String.fromCharCode(...new Uint8Array(buffer)));
        const mimeType = ext === "jpg" ? "image/jpeg" : "image/png";
        return { content: [{ type: "image" as const, data: base64, mimeType }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error downloading thumbnail: ${msg}` }], isError: true };
      }
    },
  );
}
