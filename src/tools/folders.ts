import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerFolderTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_folder_info",
    "Get detailed information about a Box folder including name, owner, size, and item counts.",
    {
      folder_id: z.string().describe("The ID of the folder ('0' for root folder)"),
    },
    async () => {
      // TODO: GET /folders/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_items_list",
    "List all items (files and subfolders) in a Box folder. Supports recursive listing.",
    {
      folder_id: z.string().describe("The ID of the folder to list ('0' for root)"),
      is_recursive: z.boolean().optional().describe("Whether to list items recursively in subfolders"),
      limit: z.number().int().min(1).max(1000).default(100).describe("Maximum number of items to return"),
    },
    async () => {
      // TODO: GET /folders/:id/items
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_create",
    "Create a new folder in Box under the specified parent folder.",
    {
      name: z.string().describe("Name for the new folder"),
      parent_folder_id: z.string().default("0").describe("Parent folder ID ('0' for root)"),
    },
    async () => {
      // TODO: POST /folders
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_delete",
    "Delete a Box folder. Use recursive=true to delete non-empty folders.",
    {
      folder_id: z.string().describe("The ID of the folder to delete"),
      recursive: z.boolean().optional().describe("Whether to delete the folder even if it contains items"),
    },
    async () => {
      // TODO: DELETE /folders/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_copy",
    "Copy a folder and its contents to a destination folder.",
    {
      folder_id: z.string().describe("The ID of the folder to copy"),
      destination_parent_folder_id: z.string().describe("The ID of the destination parent folder"),
      name: z.string().optional().describe("New name for the copied folder"),
    },
    async () => {
      // TODO: POST /folders/:id/copy
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_move",
    "Move a folder to a different parent folder in Box.",
    {
      folder_id: z.string().describe("The ID of the folder to move"),
      destination_parent_folder_id: z.string().describe("The ID of the new parent folder"),
    },
    async () => {
      // TODO: PUT /folders/:id (parent.id)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_rename",
    "Rename a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder to rename"),
      new_name: z.string().describe("The new name for the folder"),
    },
    async () => {
      // TODO: PUT /folders/:id (name)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_set_description",
    "Set or update the description of a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      description: z.string().describe("The new description for the folder"),
    },
    async () => {
      // TODO: PUT /folders/:id (description)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_favorites_add",
    "Add a folder to the current user's favorites/collection.",
    {
      folder_id: z.string().describe("The ID of the folder to favorite"),
    },
    async () => {
      // TODO: PUT /folders/:id (collections)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_favorites_remove",
    "Remove a folder from the current user's favorites/collection.",
    {
      folder_id: z.string().describe("The ID of the folder to unfavorite"),
    },
    async () => {
      // TODO: PUT /folders/:id (collections)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_set_collaboration",
    "Configure collaboration settings for a folder: who can invite, who can view collaborators.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      can_non_owners_invite: z.boolean().describe("Whether non-owners can invite collaborators"),
      can_non_owners_view_collaborators: z.boolean().describe("Whether non-owners can view the collaborator list"),
      is_collaboration_restricted_to_enterprise: z.boolean().describe("Whether collaboration is restricted to enterprise users"),
    },
    async () => {
      // TODO: PUT /folders/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_set_sync",
    "Set the sync state of a folder (synced, not_synced, partially_synced).",
    {
      folder_id: z.string().describe("The ID of the folder"),
      sync_state: z.enum(["synced", "not_synced", "partially_synced"]).describe("The desired sync state"),
    },
    async () => {
      // TODO: PUT /folders/:id (sync_state)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_set_upload_email",
    "Configure the upload email for a folder. Files emailed to this address are added to the folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      folder_upload_email_access: z.enum(["open", "collaborators"]).default("collaborators")
        .describe("Who can upload via email: 'open' (anyone) or 'collaborators' only"),
    },
    async () => {
      // TODO: PUT /folders/:id (folder_upload_email)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_tag_list",
    "List all tags on a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
    },
    async () => {
      // TODO: GET /folders/:id?fields=tags
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_tag_add",
    "Add a tag to a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      tag: z.string().describe("The tag to add"),
    },
    async () => {
      // TODO: PUT /folders/:id (tags)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_folder_tag_remove",
    "Remove a tag from a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      tag: z.string().describe("The tag to remove"),
    },
    async () => {
      // TODO: PUT /folders/:id (tags)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
