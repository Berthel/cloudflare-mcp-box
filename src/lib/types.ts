/**
 * Shared types and constants for the Box MCP server.
 */

export const BOX_API_BASE = "https://api.box.com/2.0";
export const BOX_UPLOAD_BASE = "https://upload.box.com/api/2.0";

export const CHARACTER_LIMIT = 25_000;

export type BoxUser = {
  id: string;
  type: "user";
  name: string;
  login: string;
};

export type BoxFile = {
  id: string;
  type: "file";
  name: string;
  size: number;
  parent?: { id: string; name: string };
  created_at: string;
  modified_at: string;
  description?: string;
};

export type BoxFolder = {
  id: string;
  type: "folder";
  name: string;
  parent?: { id: string; name: string };
  created_at: string;
  modified_at: string;
  description?: string;
};

export type BoxSearchResult = {
  total_count: number;
  entries: Array<BoxFile | BoxFolder>;
};

export type PaginatedResponse<T> = {
  total_count: number;
  entries: T[];
  offset?: number;
  limit?: number;
};
