import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerDocgenTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_docgen_template_create",
    "Create a new document generation template from an existing Box file.",
    {
      file_id: z.string().describe("The ID of the Box file to use as the template source"),
    },
    async (args) => {
      try {
        const result = await client.post("/docgen_templates", { file: { id: args.file_id, type: "file" } });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error creating docgen template: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_template_list",
    "List all document generation templates. Supports pagination with marker-based cursors.",
    {
      marker: z.string().optional().describe("Pagination marker from a previous response"),
      limit: z.number().int().min(1).max(1000).optional().describe("Maximum number of templates to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {};
        if (args.marker) params.marker = args.marker;
        if (args.limit) params.limit = String(args.limit);
        const result = await client.get("/docgen_templates", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing docgen templates: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_template_get_by_id",
    "Get a document generation template by its ID. Returns template details including tags and version info.",
    {
      template_id: z.string().describe("The ID of the docgen template"),
    },
    async (args) => {
      try {
        const result = await client.get(`/docgen_templates/${args.template_id}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting docgen template: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_template_get_by_name",
    "Find a document generation template by its name.",
    {
      template_name: z.string().describe("The name of the docgen template to find"),
    },
    async (args) => {
      try {
        const result = await client.get<{ entries?: Array<{ file_name?: string; [k: string]: unknown }> }>("/docgen_templates");
        const match = (result.entries ?? []).filter((t) =>
          t.file_name?.toLowerCase().includes(args.template_name.toLowerCase()),
        );
        if (match.length === 0) {
          return { content: [{ type: "text" as const, text: `No docgen template found with name matching "${args.template_name}".` }] };
        }
        return { content: [{ type: "text" as const, text: JSON.stringify({ total_count: match.length, entries: match }, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error finding docgen template: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_template_list_tags",
    "List all tags defined in a document generation template. Tags are placeholders for dynamic content.",
    {
      template_id: z.string().describe("The ID of the docgen template"),
      template_version_id: z.string().optional().describe("Specific template version ID (defaults to latest)"),
      marker: z.string().optional().describe("Pagination marker"),
      limit: z.number().int().optional().describe("Maximum number of tags to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {};
        if (args.template_version_id) params.template_version_id = args.template_version_id;
        if (args.marker) params.marker = args.marker;
        if (args.limit) params.limit = String(args.limit);
        const result = await client.get(`/docgen_templates/${args.template_id}/tags`, params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing template tags: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_template_list_jobs",
    "List document generation jobs for a specific template.",
    {
      template_id: z.string().describe("The ID of the docgen template"),
      marker: z.string().optional().describe("Pagination marker"),
      limit: z.number().int().optional().describe("Maximum number of jobs to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = { template_id: args.template_id };
        if (args.marker) params.marker = args.marker;
        if (args.limit) params.limit = String(args.limit);
        const result = await client.get("/docgen_template_jobs", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing template jobs: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_create_batch",
    "Generate documents in batch from a template with provided data. Creates multiple output files.",
    {
      docgen_template_id: z.string().describe("The ID of the docgen template to use"),
      destination_folder_id: z.string().describe("The folder ID where generated documents will be saved"),
      document_generation_data: z.array(z.record(z.unknown()))
        .describe("Array of data objects, one per document to generate. Keys must match template tags."),
      output_type: z.enum(["pdf", "docx"]).default("pdf").describe("Output format: pdf or docx"),
    },
    async (args) => {
      try {
        const result = await client.post("/docgen_batches", {
          file: { id: args.docgen_template_id, type: "file" },
          destination_folder: { id: args.destination_folder_id, type: "folder" },
          document_generation_data: args.document_generation_data,
          output_type: args.output_type,
        });
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error creating docgen batch: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_create_from_user_input",
    "Generate a single document from a template using freeform user input. Box AI fills in the template tags.",
    {
      docgen_template_id: z.string().describe("The ID of the docgen template to use"),
      destination_folder_id: z.string().describe("The folder ID where the generated document will be saved"),
      user_input: z.string().describe("Freeform text input that Box AI will use to fill template tags"),
      generated_file_name: z.string().optional().describe("Custom name for the generated file"),
      output_type: z.enum(["pdf", "docx"]).default("pdf").describe("Output format: pdf or docx"),
    },
    async (args) => {
      try {
        const body: Record<string, unknown> = {
          file: { id: args.docgen_template_id, type: "file" },
          destination_folder: { id: args.destination_folder_id, type: "folder" },
          user_input: args.user_input,
          output_type: args.output_type,
        };
        if (args.generated_file_name) body.generated_file_name = args.generated_file_name;
        const result = await client.post("/docgen_batches", body);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error creating document from user input: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_list_jobs_by_batch",
    "List all document generation jobs within a specific batch.",
    {
      batch_id: z.string().describe("The batch ID to list jobs for"),
      marker: z.string().optional().describe("Pagination marker"),
      limit: z.number().int().optional().describe("Maximum number of jobs to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = { batch_id: args.batch_id };
        if (args.marker) params.marker = args.marker;
        if (args.limit) params.limit = String(args.limit);
        const result = await client.get("/docgen_batch_jobs_v2", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing batch jobs: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_get_job",
    "Get the status and details of a specific document generation job.",
    {
      job_id: z.string().describe("The document generation job ID"),
    },
    async (args) => {
      try {
        const result = await client.get(`/docgen_jobs/${args.job_id}`);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error getting docgen job: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_docgen_list_jobs",
    "List all document generation jobs. Supports pagination.",
    {
      marker: z.string().optional().describe("Pagination marker"),
      limit: z.number().int().optional().describe("Maximum number of jobs to return"),
    },
    async (args) => {
      try {
        const params: Record<string, string> = {};
        if (args.marker) params.marker = args.marker;
        if (args.limit) params.limit = String(args.limit);
        const result = await client.get("/docgen_jobs", params);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error listing docgen jobs: ${msg}` }], isError: true };
      }
    },
  );
}
