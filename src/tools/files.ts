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
    async () => {
      // TODO: GET /files/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /files/:id/copy
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_delete",
    "Permanently delete a file from Box. This action cannot be undone.",
    {
      file_id: z.string().describe("The ID of the file to delete"),
    },
    async () => {
      // TODO: DELETE /files/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_move",
    "Move a file to a different folder in Box.",
    {
      file_id: z.string().describe("The ID of the file to move"),
      destination_folder_id: z.string().describe("The ID of the destination folder"),
    },
    async () => {
      // TODO: PUT /files/:id (parent.id)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_rename",
    "Rename a file in Box.",
    {
      file_id: z.string().describe("The ID of the file to rename"),
      new_name: z.string().describe("The new name for the file (including extension)"),
    },
    async () => {
      // TODO: PUT /files/:id (name)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_set_description",
    "Set or update the description of a Box file.",
    {
      file_id: z.string().describe("The ID of the file"),
      description: z.string().describe("The new description text for the file"),
    },
    async () => {
      // TODO: PUT /files/:id (description)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_retention_date_set",
    "Set a disposition/retention date on a file. The file cannot be deleted before this date.",
    {
      file_id: z.string().describe("The ID of the file"),
      retention_date: z.string().describe("ISO 8601 date string for the retention date, e.g. '2025-12-31T00:00:00Z'"),
    },
    async () => {
      // TODO: PUT /files/:id (disposition_at)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_retention_date_clear",
    "Clear/remove the retention date from a file, allowing it to be deleted at any time.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async () => {
      // TODO: PUT /files/:id (disposition_at: null)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: PUT /files/:id (lock)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_unlock",
    "Remove the lock from a file, allowing other users to edit it again.",
    {
      file_id: z.string().describe("The ID of the file to unlock"),
    },
    async () => {
      // TODO: PUT /files/:id (lock: null)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_set_download_open",
    "Set the file's download permissions to 'open' — anyone with access can download.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async () => {
      // TODO: PUT /files/:id (shared_link.permissions)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_set_download_company",
    "Restrict the file's download permissions to company users only.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async () => {
      // TODO: PUT /files/:id (shared_link.permissions)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_set_download_reset",
    "Reset the file's download permissions to default settings.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async () => {
      // TODO: PUT /files/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_tag_list",
    "List all tags on a Box file.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async () => {
      // TODO: GET /files/:id?fields=tags
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_tag_add",
    "Add a tag to a Box file.",
    {
      file_id: z.string().describe("The ID of the file"),
      tag: z.string().describe("The tag to add to the file"),
    },
    async () => {
      // TODO: PUT /files/:id (tags)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_tag_remove",
    "Remove a tag from a Box file.",
    {
      file_id: z.string().describe("The ID of the file"),
      tag: z.string().describe("The tag to remove from the file"),
    },
    async () => {
      // TODO: PUT /files/:id (tags)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: GET /files/:id/thumbnail.:extension
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: GET /files/:id/thumbnail.:extension (binary)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
