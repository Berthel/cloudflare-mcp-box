import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";
import { toolError } from "../lib/errors.js";

export function registerFolderTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_folder_info",
    "Get detailed information about a Box folder including name, owner, size, and item counts.",
    {
      folder_id: z.string().describe("The ID of the folder ('0' for root folder)"),
    },
    async (args) => {
      try {
        const result = await client.get(`/folders/${args.folder_id}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Get folder info", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_items_list",
    "List all items (files and subfolders) in a Box folder. Supports pagination and recursive listing.",
    {
      folder_id: z.string().describe("The ID of the folder to list ('0' for root)"),
      is_recursive: z.boolean().optional().describe("Whether to list items recursively in subfolders"),
      offset: z.number().int().min(0).optional().describe("Pagination offset for non-recursive listing (0-based)"),
      limit: z.number().int().min(1).max(1000).default(100).describe("Maximum number of items to return"),
    },
    async (args) => {
      try {
        if (args.is_recursive) {
          const allItems: unknown[] = [];
          const collectItems = async (folderId: string, depth: number) => {
            if (depth > 5 || allItems.length >= args.limit) return;
            let offset = 0;
            const pageSize = 1000;
            while (allItems.length < args.limit) {
              const result = await client.get<{
                entries: Array<{ id: string; type: string; [k: string]: unknown }>;
                total_count: number;
              }>(
                `/folders/${folderId}/items`,
                { limit: String(pageSize), offset: String(offset), fields: "id,type,name,size,modified_at,parent" },
              );
              for (const entry of result.entries) {
                if (allItems.length >= args.limit) break;
                allItems.push(entry);
                if (entry.type === "folder" && allItems.length < args.limit) {
                  await collectItems(entry.id, depth + 1);
                }
              }
              if (result.entries.length < pageSize) break;
              offset += pageSize;
            }
          };
          await collectItems(args.folder_id, 0);
          return { content: [{ type: "text" as const, text: JSON.stringify({ total_count: allItems.length, entries: allItems.slice(0, args.limit) }, null, 2) }] };
        }
        const params: Record<string, string> = {
          limit: String(args.limit),
          fields: "id,type,name,size,modified_at,parent",
        };
        if (args.offset !== undefined) params.offset = String(args.offset);
        const result = await client.get(`/folders/${args.folder_id}/items`, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("List folder items", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_create",
    "Create a new folder in Box under the specified parent folder.",
    {
      name: z.string().describe("Name for the new folder"),
      parent_folder_id: z.string().default("0").describe("Parent folder ID ('0' for root)"),
    },
    async (args) => {
      try {
        const result = await client.post("/folders", { name: args.name, parent: { id: args.parent_folder_id } });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Create folder", error, { name: args.name });
      }
    },
  );

  server.tool(
    "box_folder_delete",
    "Delete a Box folder. Use recursive=true to delete non-empty folders.",
    {
      folder_id: z.string().describe("The ID of the folder to delete"),
      recursive: z.boolean().optional().describe("Whether to delete the folder even if it contains items"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {};
        if (args.recursive) params.recursive = "true";
        await client.delete(`/folders/${args.folder_id}`, params);
        return { content: [{ type: "text" as const, text: `Folder ${args.folder_id} deleted successfully.` }] };
      } catch (error) {
        return toolError("Delete folder", error, { folder_id: args.folder_id });
      }
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
    async (args) => {
      try {
        const body: Record<string, unknown> = { parent: { id: args.destination_parent_folder_id } };
        if (args.name) body.name = args.name;
        const result = await client.post(`/folders/${args.folder_id}/copy`, body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Copy folder", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_move",
    "Move a folder to a different parent folder in Box.",
    {
      folder_id: z.string().describe("The ID of the folder to move"),
      destination_parent_folder_id: z.string().describe("The ID of the new parent folder"),
    },
    async (args) => {
      try {
        const result = await client.put(`/folders/${args.folder_id}`, { parent: { id: args.destination_parent_folder_id } });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Move folder", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_rename",
    "Rename a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder to rename"),
      new_name: z.string().describe("The new name for the folder"),
    },
    async (args) => {
      try {
        const result = await client.put(`/folders/${args.folder_id}`, { name: args.new_name });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Rename folder", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_set_description",
    "Set or update the description of a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      description: z.string().describe("The new description for the folder"),
    },
    async (args) => {
      try {
        const result = await client.put(`/folders/${args.folder_id}`, { description: args.description });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Set folder description", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_favorites_add",
    "Add a folder to the current user's favorites/collection.",
    {
      folder_id: z.string().describe("The ID of the folder to favorite"),
    },
    async (args) => {
      try {
        const collections = await client.get<{ entries: Array<{ id: string; type: string; name: string }> }>("/collections");
        const favorites = collections.entries.find((c) => c.name === "Favorites");
        if (!favorites) {
          return { content: [{ type: "text" as const, text: "Could not find Favorites collection." }], isError: true };
        }
        const result = await client.put(`/folders/${args.folder_id}`, { collections: [{ id: favorites.id }] });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Add folder to favorites", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_favorites_remove",
    "Remove a folder from the current user's favorites/collection.",
    {
      folder_id: z.string().describe("The ID of the folder to unfavorite"),
    },
    async (args) => {
      try {
        const result = await client.put(`/folders/${args.folder_id}`, { collections: [] });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Remove folder from favorites", error, { folder_id: args.folder_id });
      }
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
    async (args) => {
      try {
        const result = await client.put(`/folders/${args.folder_id}`, {
          can_non_owners_invite: args.can_non_owners_invite,
          can_non_owners_view_collaborators: args.can_non_owners_view_collaborators,
          is_collaboration_restricted_to_enterprise: args.is_collaboration_restricted_to_enterprise,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Set collaboration settings", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_set_sync",
    "Set the sync state of a folder (synced, not_synced, partially_synced).",
    {
      folder_id: z.string().describe("The ID of the folder"),
      sync_state: z.enum(["synced", "not_synced", "partially_synced"]).describe("The desired sync state"),
    },
    async (args) => {
      try {
        const result = await client.put(`/folders/${args.folder_id}`, { sync_state: args.sync_state });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Set sync state", error, { folder_id: args.folder_id });
      }
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
    async (args) => {
      try {
        const result = await client.put(`/folders/${args.folder_id}`, {
          folder_upload_email: { access: args.folder_upload_email_access },
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Set upload email", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_tag_list",
    "List all tags on a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
    },
    async (args) => {
      try {
        const result = await client.get<{ tags?: string[] }>(`/folders/${args.folder_id}`, { fields: "tags" });
        return { content: [{ type: "text" as const, text: JSON.stringify(result.tags ?? [], null, 2) }] };
      } catch (error) {
        return toolError("List folder tags", error, { folder_id: args.folder_id });
      }
    },
  );

  server.tool(
    "box_folder_tag_add",
    "Add a tag to a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      tag: z.string().describe("The tag to add"),
    },
    async (args) => {
      try {
        const folder = await client.get<{ tags?: string[] }>(`/folders/${args.folder_id}`, { fields: "tags" });
        const tags = folder.tags ?? [];
        if (!tags.includes(args.tag)) tags.push(args.tag);
        const result = await client.put(`/folders/${args.folder_id}`, { tags });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Add folder tag", error, { folder_id: args.folder_id, tag: args.tag });
      }
    },
  );

  server.tool(
    "box_folder_tag_remove",
    "Remove a tag from a Box folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      tag: z.string().describe("The tag to remove"),
    },
    async (args) => {
      try {
        const folder = await client.get<{ tags?: string[] }>(`/folders/${args.folder_id}`, { fields: "tags" });
        const tags = (folder.tags ?? []).filter((t) => t !== args.tag);
        const result = await client.put(`/folders/${args.folder_id}`, { tags });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        return toolError("Remove folder tag", error, { folder_id: args.folder_id, tag: args.tag });
      }
    },
  );
}
