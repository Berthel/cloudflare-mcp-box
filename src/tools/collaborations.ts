import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

const COLLABORATION_ROLE = z.enum([
  "editor", "viewer", "previewer", "uploader", "previewer uploader",
  "viewer uploader", "co-owner", "owner",
]).describe("The collaboration role/permission level");

export function registerCollaborationTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_collaboration_list_by_file",
    "List all collaborations on a Box file. Shows who has access and their roles.",
    {
      file_id: z.string().describe("The ID of the file"),
    },
    async (args) => {
      try {
        const result = await client.get(`/files/${args.file_id}/collaborations`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing file collaborations: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_list_by_folder",
    "List all collaborations on a Box folder. Shows who has access and their roles.",
    {
      folder_id: z.string().describe("The ID of the folder"),
    },
    async (args) => {
      try {
        const result = await client.get(`/folders/${args.folder_id}/collaborations`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing folder collaborations: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_delete",
    "Remove a collaboration, revoking the collaborator's access.",
    {
      collaboration_id: z.string().describe("The ID of the collaboration to remove"),
    },
    async (args) => {
      try {
        await client.delete(`/collaborations/${args.collaboration_id}`);
        return { content: [{ type: "text" as const, text: `Collaboration ${args.collaboration_id} deleted successfully.` }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error deleting collaboration: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_update",
    "Update a collaboration's role or settings.",
    {
      collaboration_id: z.string().describe("The ID of the collaboration to update"),
      role: COLLABORATION_ROLE.optional(),
      status: z.enum(["accepted", "rejected"]).optional().describe("Accept or reject a pending collaboration"),
      expires_at: z.string().optional().describe("ISO 8601 date when the collaboration expires"),
      can_view_path: z.boolean().optional().describe("Whether the collaborator can see the full folder path"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {};
        if (args.role) body.role = args.role;
        if (args.status) body.status = args.status;
        if (args.expires_at) body.expires_at = args.expires_at;
        if (args.can_view_path !== undefined) body.can_view_path = args.can_view_path;
        const result = await client.put(`/collaborations/${args.collaboration_id}`, body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error updating collaboration: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_file_user_by_id",
    "Add a user as a collaborator on a file using their Box user ID.",
    {
      file_id: z.string().describe("The ID of the file"),
      user_id: z.string().describe("The Box user ID to add as collaborator"),
      role: COLLABORATION_ROLE.optional().default("viewer"),
      is_access_only: z.boolean().optional().describe("If true, user can only access without folder structure"),
      expires_at: z.string().optional().describe("ISO 8601 expiration date"),
      notify: z.boolean().optional().describe("Whether to send a notification email"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          item: { id: args.file_id, type: "file" },
          accessible_by: { id: args.user_id, type: "user" },
          role: args.role,
        };
        if (args.is_access_only !== undefined) body.is_access_only = args.is_access_only;
        if (args.expires_at) body.expires_at = args.expires_at;
        const params: Record<string, string> = {};
        if (args.notify !== undefined) params.notify = String(args.notify);
        const result = await client.post("/collaborations", body, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error adding file collaborator: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_file_user_by_login",
    "Add a user as a collaborator on a file using their email address.",
    {
      file_id: z.string().describe("The ID of the file"),
      user_login: z.string().email().describe("The email address of the user to add"),
      role: COLLABORATION_ROLE.optional().default("viewer"),
      is_access_only: z.boolean().optional().describe("If true, user can only access without folder structure"),
      expires_at: z.string().optional().describe("ISO 8601 expiration date"),
      notify: z.boolean().optional().describe("Whether to send a notification email"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          item: { id: args.file_id, type: "file" },
          accessible_by: { login: args.user_login, type: "user" },
          role: args.role,
        };
        if (args.is_access_only !== undefined) body.is_access_only = args.is_access_only;
        if (args.expires_at) body.expires_at = args.expires_at;
        const params: Record<string, string> = {};
        if (args.notify !== undefined) params.notify = String(args.notify);
        const result = await client.post("/collaborations", body, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error adding file collaborator: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_file_group",
    "Add a group as a collaborator on a file.",
    {
      file_id: z.string().describe("The ID of the file"),
      group_id: z.string().describe("The Box group ID to add as collaborator"),
      role: COLLABORATION_ROLE.optional().default("viewer"),
      is_access_only: z.boolean().optional().describe("If true, group can only access without folder structure"),
      expires_at: z.string().optional().describe("ISO 8601 expiration date"),
      notify: z.boolean().optional().describe("Whether to send a notification email"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          item: { id: args.file_id, type: "file" },
          accessible_by: { id: args.group_id, type: "group" },
          role: args.role,
        };
        if (args.is_access_only !== undefined) body.is_access_only = args.is_access_only;
        if (args.expires_at) body.expires_at = args.expires_at;
        const params: Record<string, string> = {};
        if (args.notify !== undefined) params.notify = String(args.notify);
        const result = await client.post("/collaborations", body, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error adding file group collaborator: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_folder_user_by_id",
    "Add a user as a collaborator on a folder using their Box user ID.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      user_id: z.string().describe("The Box user ID to add as collaborator"),
      role: COLLABORATION_ROLE.optional().default("viewer"),
      is_access_only: z.boolean().optional().describe("If true, user can only access without folder structure"),
      can_view_path: z.boolean().optional().describe("Whether the user can see the full folder path"),
      expires_at: z.string().optional().describe("ISO 8601 expiration date"),
      notify: z.boolean().optional().describe("Whether to send a notification email"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          item: { id: args.folder_id, type: "folder" },
          accessible_by: { id: args.user_id, type: "user" },
          role: args.role,
        };
        if (args.is_access_only !== undefined) body.is_access_only = args.is_access_only;
        if (args.can_view_path !== undefined) body.can_view_path = args.can_view_path;
        if (args.expires_at) body.expires_at = args.expires_at;
        const params: Record<string, string> = {};
        if (args.notify !== undefined) params.notify = String(args.notify);
        const result = await client.post("/collaborations", body, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error adding folder collaborator: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_folder_user_by_login",
    "Add a user as a collaborator on a folder using their email address.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      user_login: z.string().email().describe("The email address of the user to add"),
      role: COLLABORATION_ROLE.optional().default("viewer"),
      is_access_only: z.boolean().optional().describe("If true, user can only access without folder structure"),
      can_view_path: z.boolean().optional().describe("Whether the user can see the full folder path"),
      expires_at: z.string().optional().describe("ISO 8601 expiration date"),
      notify: z.boolean().optional().describe("Whether to send a notification email"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          item: { id: args.folder_id, type: "folder" },
          accessible_by: { login: args.user_login, type: "user" },
          role: args.role,
        };
        if (args.is_access_only !== undefined) body.is_access_only = args.is_access_only;
        if (args.can_view_path !== undefined) body.can_view_path = args.can_view_path;
        if (args.expires_at) body.expires_at = args.expires_at;
        const params: Record<string, string> = {};
        if (args.notify !== undefined) params.notify = String(args.notify);
        const result = await client.post("/collaborations", body, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error adding folder collaborator: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_collaboration_folder_group",
    "Add a group as a collaborator on a folder.",
    {
      folder_id: z.string().describe("The ID of the folder"),
      group_id: z.string().describe("The Box group ID to add as collaborator"),
      role: COLLABORATION_ROLE.optional().default("viewer"),
      is_access_only: z.boolean().optional().describe("If true, group can only access without folder structure"),
      can_view_path: z.boolean().optional().describe("Whether the group can see the full folder path"),
      expires_at: z.string().optional().describe("ISO 8601 expiration date"),
      notify: z.boolean().optional().describe("Whether to send a notification email"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          item: { id: args.folder_id, type: "folder" },
          accessible_by: { id: args.group_id, type: "group" },
          role: args.role,
        };
        if (args.is_access_only !== undefined) body.is_access_only = args.is_access_only;
        if (args.can_view_path !== undefined) body.can_view_path = args.can_view_path;
        if (args.expires_at) body.expires_at = args.expires_at;
        const params: Record<string, string> = {};
        if (args.notify !== undefined) params.notify = String(args.notify);
        const result = await client.post("/collaborations", body, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error adding folder group collaborator: ${msg}` }], isError: true };
      }
    },
  );
}
