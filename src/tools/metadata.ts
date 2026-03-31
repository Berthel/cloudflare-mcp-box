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
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          scope: "enterprise",
          displayName: args.display_name,
          fields: args.fields,
        };
        if (args.template_key) body.templateKey = args.template_key;
        const result = await client.post("/metadata_templates/schema", body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error creating metadata template: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_metadata_template_list",
    "List all metadata templates available in the enterprise.",
    {},
    async () => {
      try {
        const result = await client.get("/metadata_templates/enterprise");
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing metadata templates: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_metadata_template_get_by_key",
    "Get a metadata template by its template key.",
    {
      template_key: z.string().describe("The template key to look up"),
    },
    async (args) => {
      try {
        const result = await client.get(`/metadata_templates/enterprise/${args.template_key}/schema`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting metadata template: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_metadata_template_get_by_name",
    "Find a metadata template by its display name.",
    {
      template_name: z.string().describe("The display name to search for"),
    },
    async (args) => {
      try {
        const result = await client.get<{ entries?: Array<{ displayName?: string; [k: string]: unknown }> }>("/metadata_templates/enterprise");
        const match = (result.entries ?? []).filter((t) =>
          t.displayName?.toLowerCase().includes(args.template_name.toLowerCase()),
        );
        if (match.length === 0) {
          return { content: [{ type: "text" as const, text: `No metadata template found with name matching "${args.template_name}".` }] };
        }
        return { content: [{ type: "text" as const, text: JSON.stringify({ total_count: match.length, entries: match }, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error finding metadata template: ${msg}` }], isError: true };
      }
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
    async (args) => {
      try {
        const result = await client.post(`/files/${args.file_id}/metadata/enterprise/${args.template_key}`, args.metadata);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error setting metadata on file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_metadata_get_instance_on_file",
    "Get the metadata instance values for a specific template on a file.",
    {
      file_id: z.string().describe("The ID of the file"),
      template_key: z.string().describe("The metadata template key"),
    },
    async (args) => {
      try {
        const result = await client.get(`/files/${args.file_id}/metadata/enterprise/${args.template_key}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting metadata from file: ${msg}` }], isError: true };
      }
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
    async (args) => {
      try {
        const ops: Array<{ op: string; path: string; value?: unknown }> = [];
        for (const [key, value] of Object.entries(args.metadata)) {
          ops.push({ op: "add", path: `/${key}`, value });
        }
        if (args.remove_non_included_data) {
          const current = await client.get<Record<string, unknown>>(`/files/${args.file_id}/metadata/enterprise/${args.template_key}`);
          for (const key of Object.keys(current)) {
            if (key.startsWith("$") || key.startsWith("_")) continue;
            if (!(key in args.metadata)) {
              ops.push({ op: "remove", path: `/${key}` });
            }
          }
        }
        const result = await client.put(`/files/${args.file_id}/metadata/enterprise/${args.template_key}`, ops);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error updating metadata on file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_metadata_delete_instance_on_file",
    "Remove a metadata template instance from a file.",
    {
      file_id: z.string().describe("The ID of the file"),
      template_key: z.string().describe("The metadata template key to remove"),
    },
    async (args) => {
      try {
        await client.delete(`/files/${args.file_id}/metadata/enterprise/${args.template_key}`);
        return { content: [{ type: "text" as const, text: `Metadata template "${args.template_key}" removed from file ${args.file_id}.` }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error removing metadata from file: ${msg}` }], isError: true };
      }
    },
  );
}
