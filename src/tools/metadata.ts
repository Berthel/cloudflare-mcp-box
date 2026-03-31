import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerMetadataTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_metadata_template_create",
    "Create a new metadata template in Box. Templates define structured fields that can be applied to files and folders.",
    {
      display_name: z.string().describe("Display name for the metadata template"),
      fields: z.array(z.object({
        key: z.string().describe("Unique key for the field"),
        type: z.enum(["string", "float", "date", "enum", "multiSelect"]).describe("Field data type"),
        displayName: z.string().describe("Display name for the field"),
        description: z.string().optional().describe("Field description"),
        options: z.array(z.object({ key: z.string() })).optional().describe("Options for enum/multiSelect fields"),
      })).describe("Array of field definitions for the template"),
      template_key: z.string().optional().describe("Custom key for the template (auto-generated if omitted)"),
    },
    async () => {
      // TODO: POST /metadata_templates/schema
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_metadata_template_list",
    "List all metadata templates available in the enterprise.",
    {},
    async () => {
      // TODO: GET /metadata_templates/enterprise
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_metadata_template_get_by_key",
    "Get a metadata template by its template key.",
    {
      template_key: z.string().describe("The template key to look up"),
    },
    async () => {
      // TODO: GET /metadata_templates/enterprise/:template_key/schema
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_metadata_template_get_by_name",
    "Find a metadata template by its display name.",
    {
      template_name: z.string().describe("The display name to search for"),
    },
    async () => {
      // TODO: GET /metadata_templates/enterprise + filter
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_metadata_set_instance_on_file",
    "Apply a metadata template instance to a file with initial values.",
    {
      file_id: z.string().describe("The ID of the file to apply metadata to"),
      template_key: z.string().describe("The metadata template key"),
      metadata: z.record(z.unknown()).describe("Key-value pairs matching the template fields"),
    },
    async () => {
      // TODO: POST /files/:id/metadata/enterprise/:template_key
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_metadata_get_instance_on_file",
    "Get the metadata instance values for a specific template on a file.",
    {
      file_id: z.string().describe("The ID of the file"),
      template_key: z.string().describe("The metadata template key"),
    },
    async () => {
      // TODO: GET /files/:id/metadata/enterprise/:template_key
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_metadata_update_instance_on_file",
    "Update metadata values on a file. Can optionally remove fields not included in the update.",
    {
      file_id: z.string().describe("The ID of the file"),
      template_key: z.string().describe("The metadata template key"),
      metadata: z.record(z.unknown()).describe("Updated key-value pairs"),
      remove_non_included_data: z.boolean().optional()
        .describe("If true, fields not in the update payload will be removed from the instance"),
    },
    async () => {
      // TODO: PUT /files/:id/metadata/enterprise/:template_key
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_metadata_delete_instance_on_file",
    "Remove a metadata template instance from a file.",
    {
      file_id: z.string().describe("The ID of the file"),
      template_key: z.string().describe("The metadata template key to remove"),
    },
    async () => {
      // TODO: DELETE /files/:id/metadata/enterprise/:template_key
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
