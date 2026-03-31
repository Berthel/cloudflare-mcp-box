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
    async () => {
      // TODO: GET /files/:id/collaborations
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_collaboration_list_by_folder",
    "List all collaborations on a Box folder. Shows who has access and their roles.",
    {
      folder_id: z.string().describe("The ID of the folder"),
    },
    async () => {
      // TODO: GET /folders/:id/collaborations
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_collaboration_delete",
    "Remove a collaboration, revoking the collaborator's access.",
    {
      collaboration_id: z.string().describe("The ID of the collaboration to remove"),
    },
    async () => {
      // TODO: DELETE /collaborations/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: PUT /collaborations/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /collaborations
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /collaborations
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /collaborations
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /collaborations
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /collaborations
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /collaborations
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
