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
    async () => {
      // TODO: POST /docgen_templates
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_docgen_template_list",
    "List all document generation templates. Supports pagination with marker-based cursors.",
    {
      marker: z.string().optional().describe("Pagination marker from a previous response"),
      limit: z.number().int().min(1).max(1000).optional().describe("Maximum number of templates to return"),
    },
    async () => {
      // TODO: GET /docgen_templates
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_docgen_template_get_by_id",
    "Get a document generation template by its ID. Returns template details including tags and version info.",
    {
      template_id: z.string().describe("The ID of the docgen template"),
    },
    async () => {
      // TODO: GET /docgen_templates/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_docgen_template_get_by_name",
    "Find a document generation template by its name.",
    {
      template_name: z.string().describe("The name of the docgen template to find"),
    },
    async () => {
      // TODO: GET /docgen_templates + filter by name
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: GET /docgen_templates/:id/tags
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: GET /docgen_templates/:id/jobs
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /docgen_batches
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: POST /docgen_batches (single from user input)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
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
    async () => {
      // TODO: GET /docgen_batches/:id/jobs
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_docgen_get_job",
    "Get the status and details of a specific document generation job.",
    {
      job_id: z.string().describe("The document generation job ID"),
    },
    async () => {
      // TODO: GET /docgen_jobs/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_docgen_list_jobs",
    "List all document generation jobs. Supports pagination.",
    {
      marker: z.string().optional().describe("Pagination marker"),
      limit: z.number().int().optional().describe("Maximum number of jobs to return"),
    },
    async () => {
      // TODO: GET /docgen_jobs
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
