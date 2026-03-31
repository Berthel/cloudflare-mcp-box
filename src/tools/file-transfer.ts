import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import type { BoxClient } from "../lib/box-client.js";
import { CHARACTER_LIMIT } from "../lib/types.js";

export function registerFileTransferTools(server: McpServer, client: BoxClient) {
  server.tool(
    "box_file_download",
    "Download a Box file's content. Returns the text/content representation of the file.",
    {
      file_id: z.string().describe("The ID of the file to download"),
    },
    async (args) => {
      try {
        const response = await client.getRaw(`/files/${args.file_id}/content`);
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Box API error ${response.status}: ${errorText}`);
        }
        const contentType = response.headers.get("content-type") ?? "";
        const isText = contentType.includes("text") || contentType.includes("json") || contentType.includes("xml") || contentType.includes("javascript") || contentType.includes("csv");
        if (!isText) {
          const fileInfo = await client.get<{ name: string; size: number; shared_link?: { url: string } }>(`/files/${args.file_id}`, { fields: "name,size,shared_link" });
          return {
            content: [{
              type: "text" as const,
              text: `This is a binary file (${contentType}) and cannot be displayed as text.\nFile: ${fileInfo.name} (${fileInfo.size} bytes)\nUse box_file_text_extract to get a text representation, or access via Box UI.`,
            }],
          };
        }
        let text = await response.text();
        if (text.length > CHARACTER_LIMIT) {
          text = text.substring(0, CHARACTER_LIMIT) + `\n\n--- Content truncated at ${CHARACTER_LIMIT} characters ---`;
        }
        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error downloading file: ${msg}` }], isError: true };
      }
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
    async (args) => {
      try {
        const result = await client.upload(args.parent_folder_id, args.file_name, args.content);
        return { content: [{ type: "text" as const, text: JSON.stringify(result, null, 2) }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error uploading file: ${msg}` }], isError: true };
      }
    },
  );

  server.tool(
    "box_file_text_extract",
    "Extract the text/content representation from a Box file. Works with documents, PDFs, and other text-representable files.",
    {
      file_id: z.string().describe("The ID of the file to extract text from"),
    },
    async (args) => {
      try {
        const response = await client.getRaw(
          `/files/${args.file_id}/content`,
          undefined,
          { "X-Rep-Hints": "[extracted_text]" },
        );
        if (response.ok) {
          let text = await response.text();
          if (text.length > CHARACTER_LIMIT) {
            text = text.substring(0, CHARACTER_LIMIT) + `\n\n--- Content truncated at ${CHARACTER_LIMIT} characters ---`;
          }
          return { content: [{ type: "text" as const, text }] };
        }

        const repResponse = await client.get<{
          representations?: { entries?: Array<{ representation?: string; status?: { state?: string }; content?: { url_template?: string } }> };
        }>(`/files/${args.file_id}`, { fields: "representations", "x-rep-hints": "[extracted_text]" });

        const entry = repResponse.representations?.entries?.find((e) => e.representation === "extracted_text");
        if (!entry?.content?.url_template) {
          return { content: [{ type: "text" as const, text: "Text extraction is not available for this file type." }] };
        }
        if (entry.status?.state !== "success") {
          return { content: [{ type: "text" as const, text: `Text extraction status: ${entry.status?.state ?? "unknown"}. Try again later.` }] };
        }

        const textUrl = entry.content.url_template.replace("{+asset_path}", "");
        const textResponse = await fetch(textUrl);
        let text = await textResponse.text();
        if (text.length > CHARACTER_LIMIT) {
          text = text.substring(0, CHARACTER_LIMIT) + `\n\n--- Content truncated at ${CHARACTER_LIMIT} characters ---`;
        }
        return { content: [{ type: "text" as const, text }] };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        return { content: [{ type: "text" as const, text: `Error extracting text: ${msg}` }], isError: true };
      }
    },
  );
}
