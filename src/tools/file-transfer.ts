import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";

export function registerFileTransferTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_file_download",
    "Download a Box file's content. Returns the text/content representation of the file.",
    {
      file_id: z.string().describe("The ID of the file to download"),
    },
    async () => {
      // TODO: GET /files/:id/content
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_upload",
    "Upload a new file to Box from text content. The file is created in the specified parent folder.",
    {
      content: z.string().describe("The text content to upload as a file"),
      file_name: z.string().describe("The name for the new file (including extension)"),
      parent_folder_id: z.string().describe("The ID of the folder to upload into ('0' for root)"),
    },
    async () => {
      // TODO: POST https://upload.box.com/api/2.0/files/content
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );

  server.tool(
    "box_file_text_extract",
    "Extract the text/content representation from a Box file. Works with documents, PDFs, and other text-representable files.",
    {
      file_id: z.string().describe("The ID of the file to extract text from"),
    },
    async () => {
      // TODO: GET /files/:id/content (representations)
      return { content: [{ type: "text" as const, text: "Not implemented yet" }] };
    },
  );
}
