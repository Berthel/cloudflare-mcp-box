import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerAiTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_ai_ask_single_file",
    "Ask a question about a single Box file using Box AI. Returns an AI-generated answer based on the file content.",
    {
      file_id: z.string().describe("The ID of the Box file to ask about"),
      prompt: z.string().describe("The question or prompt to ask about the file"),
      ai_agent_id: z.string().optional().describe("Optional Box AI agent ID to use for the request"),
    },
    async () => {
      // TODO: POST /ai/ask (mode: single_item_qa)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_ask_multi_file",
    "Ask a question across multiple Box files using Box AI. Returns an AI-generated answer synthesized from all files.",
    {
      file_ids: z.array(z.string()).min(1).describe("List of Box file IDs to include in the query"),
      prompt: z.string().describe("The question or prompt to ask across the files"),
      ai_agent_id: z.string().optional().describe("Optional Box AI agent ID to use for the request"),
    },
    async () => {
      // TODO: POST /ai/ask (mode: multiple_item_qa)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_ask_hub",
    "Ask a question against a Box Hub using Box AI. Hubs are curated collections of content for AI queries.",
    {
      hub_id: z.string().describe("The ID of the Box Hub to query"),
      prompt: z.string().describe("The question or prompt to ask against the Hub"),
      ai_agent_id: z.string().optional().describe("Optional Box AI agent ID to use"),
    },
    async () => {
      // TODO: POST /ai/ask (hub mode)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_extract_freeform",
    "Extract information from files using a freeform prompt. Box AI analyzes the files and returns extracted data.",
    {
      file_ids: z.array(z.string()).min(1).describe("List of file IDs to extract information from"),
      prompt: z.string().describe("Freeform prompt describing what information to extract"),
      ai_agent_id: z.string().optional().describe("Optional Box AI agent ID to use"),
    },
    async () => {
      // TODO: POST /ai/extract
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_extract_structured_fields",
    "Extract structured data from files using field definitions. Each field specifies a key, type, and description.",
    {
      file_ids: z.array(z.string()).min(1).describe("List of file IDs to extract data from"),
      fields: z.array(z.object({
        key: z.string().describe("The field key/name"),
        type: z.string().optional().describe("The expected data type (string, number, date, etc.)"),
        description: z.string().optional().describe("Description of what this field represents"),
      })).describe("Field definitions for structured extraction"),
      ai_agent_id: z.string().optional().describe("Optional Box AI agent ID to use"),
    },
    async () => {
      // TODO: POST /ai/extract_structured
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_extract_structured_template",
    "Extract structured data from files using a Box metadata template. The template defines the extraction schema.",
    {
      file_ids: z.array(z.string()).min(1).describe("List of file IDs to extract data from"),
      template_key: z.string().describe("The metadata template key to use as extraction schema"),
      ai_agent_id: z.string().optional().describe("Optional Box AI agent ID to use"),
    },
    async () => {
      // TODO: POST /ai/extract_structured
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_extract_structured_enhanced_fields",
    "Enhanced structured extraction using field definitions with improved accuracy and multi-page support.",
    {
      file_ids: z.array(z.string()).min(1).describe("List of file IDs to extract data from"),
      fields: z.array(z.object({
        key: z.string().describe("The field key/name"),
        type: z.string().optional().describe("The expected data type"),
        description: z.string().optional().describe("Description of what this field represents"),
      })).describe("Field definitions for enhanced extraction"),
    },
    async () => {
      // TODO: POST /ai/extract_structured (enhanced)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_extract_structured_enhanced_template",
    "Enhanced structured extraction using a metadata template with improved accuracy and multi-page support.",
    {
      file_ids: z.array(z.string()).min(1).describe("List of file IDs to extract data from"),
      template_key: z.string().describe("The metadata template key to use as extraction schema"),
    },
    async () => {
      // TODO: POST /ai/extract_structured (enhanced, template)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_agent_info",
    "Get detailed information about a specific Box AI agent by its ID.",
    {
      ai_agent_id: z.string().describe("The ID of the Box AI agent to look up"),
    },
    async () => {
      // TODO: GET /ai_agents/:id
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_agents_list",
    "List all available Box AI agents. Returns agent IDs, names, and configurations.",
    {
      limit: z.number().int().min(1).max(1000).default(100).describe("Maximum number of agents to return"),
    },
    async () => {
      // TODO: GET /ai_agents
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_ai_agents_search_by_name",
    "Search for Box AI agents by name. Filters the agent list to match the given name.",
    {
      name: z.string().min(1).describe("The agent name to search for"),
      limit: z.number().int().min(1).max(1000).default(100).describe("Maximum number of results"),
    },
    async () => {
      // TODO: GET /ai_agents + filter by name
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
